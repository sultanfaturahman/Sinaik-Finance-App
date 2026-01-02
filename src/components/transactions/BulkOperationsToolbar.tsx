import { useState } from "react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Tag, Trash2, X } from "lucide-react";

interface BulkOperationsToolbarProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
  onActionComplete?: () => Promise<void> | void;
  availableCategories?: string[];
}

export const BulkOperationsToolbar = ({
  selectedIds,
  onClearSelection,
  onActionComplete,
  availableCategories = [],
}: BulkOperationsToolbarProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const count = selectedIds.size;

  if (count === 0) {
    return null;
  }

  const idList = Array.from(selectedIds);
  const categorySuggestions = availableCategories.filter(Boolean).slice(0, 8);

  const handleBulkDelete = async () => {
    try {
      setIsProcessing(true);
      const supabase = await getSupabaseClient();
      const { error } = await supabase.from("transactions").delete().in("id", idList);
      if (error) {
        throw error;
      }

      toast.success(`${count} transaksi berhasil dihapus`);
      onClearSelection();
      if (onActionComplete) {
        await onActionComplete();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus transaksi";
      toast.error(message);
    } finally {
      setIsProcessing(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleBulkExport = async () => {
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .in("id", idList);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        toast.error("Tidak ada transaksi yang dapat diekspor");
        return;
      }

      const csv = convertToCSV(data);
      downloadCSV(csv, `transaksi-terpilih-${new Date().toISOString()}.csv`);
      toast.success(`${count} transaksi berhasil diekspor`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengekspor transaksi";
      toast.error(message);
    }
  };

  const handleBulkCategorize = async () => {
    const trimmed = categoryValue.trim();
    if (!trimmed) {
      toast.error("Kategori tidak boleh kosong");
      return;
    }

    try {
      setIsProcessing(true);
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from("transactions")
        .update({ category: trimmed })
        .in("id", idList);

      if (error) {
        throw error;
      }

      toast.success(`${count} transaksi dipindahkan ke kategori ${trimmed}`);
      setCategoryDialogOpen(false);
      setCategoryValue("");
      if (onActionComplete) {
        await onActionComplete();
      }
      onClearSelection();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui kategori";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-wide">
            {count} Dipilih
          </Badge>
          <span>Gunakan aksi massal untuk menghemat waktu.</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <Download className="mr-2 h-4 w-4" />
            Ekspor
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)}>
            <Tag className="mr-2 h-4 w-4" />
            Ubah Kategori
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isProcessing}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="mr-2 h-4 w-4" />
            Batal
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {count} transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan dan data transaksi akan hilang permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleBulkDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Ubah Kategori Massal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pilih kategori baru untuk {count} transaksi yang dipilih.
            </p>
            <Input
              autoFocus
              placeholder="Masukkan kategori baru"
              value={categoryValue}
              onChange={(event) => setCategoryValue(event.target.value)}
            />

            {categorySuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categorySuggestions.map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setCategoryValue(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCategoryDialogOpen(false);
                setCategoryValue("");
              }}
            >
              Batal
            </Button>
            <Button type="button" onClick={() => void handleBulkCategorize()} disabled={isProcessing}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0] ?? {});
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        return JSON.stringify(value ?? "");
      })
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
