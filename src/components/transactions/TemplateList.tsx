import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MoreVertical, PencilLine, Plus, Trash2 } from "lucide-react";
import { TemplateDialog } from "@/components/transactions/TemplateDialog";
import type { TransactionTemplate } from "@/types/transaction-template";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuth } from "@/hooks/useAuth";

interface TemplateListProps {
  onTransactionCreated?: () => void;
}

export const TemplateList = ({ onTransactionCreated }: TemplateListProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TransactionTemplate | undefined>();

  const queryKey = useMemo(() => ["transaction-templates", user?.id], [user?.id]);

  const {
    data: templates,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      const { data, error: fetchError } = await supabase
        .from("transaction_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return (data ?? []) as TransactionTemplate[];
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase
        .from("transaction_templates")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Template dihapus");
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Gagal menghapus template";
      toast.error(message);
    },
  });

  const applyTemplate = useMutation({
    mutationFn: async (template: TransactionTemplate) => {
      if (!user) {
        throw new Error("Pengguna belum masuk");
      }

      const { error: insertError } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          type: template.type,
          category: template.category,
          amount: template.amount,
          date: new Date().toISOString().split("T")[0],
          note: template.description,
          source: "manual",
        },
      ]);

      if (insertError) {
        throw insertError;
      }
    },
    onSuccess: () => {
      toast.success("Transaksi baru dibuat dari template");
      void onTransactionCreated?.();
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Gagal menggunakan template";
      toast.error(message);
    },
  });

  if (!user) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Masuk untuk mengelola template transaksi Anda.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Template Transaksi</CardTitle>
            <p className="text-sm text-muted-foreground">
              Simpan pola transaksi favorit untuk input cepat dan konsisten.
            </p>
          </div>
          <Button
            onClick={() => {
              setActiveTemplate(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Template Baru
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListSkeleton rows={3} columns={3} />
          ) : isError ? (
            <p className="text-sm text-destructive">
              Gagal memuat template: {(error as Error)?.message ?? "Terjadi kesalahan"}
            </p>
          ) : !templates || templates.length === 0 ? (
            <EmptyState
              title="Belum ada template"
              description="Buat template pertama Anda untuk transaksi seperti sewa, gaji, atau utilitas."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTemplate(undefined);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Template
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col gap-3 rounded-lg border bg-card p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold">{template.name}</p>
                      <Badge variant={template.type === "income" ? "default" : "secondary"}>
                        {template.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </Badge>
                      {template.is_recurring && template.recurring_frequency && (
                        <Badge variant="outline">
                          {frequencyLabel(template.recurring_frequency)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.category} • {formatCurrency(template.amount)}
                    </p>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    {template.next_occurrence && template.is_recurring && (
                      <p className="text-xs text-muted-foreground">
                        Pengingat berikutnya: {formatNextOccurrence(template.next_occurrence)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate.mutate(template)}
                      disabled={applyTemplate.isPending}
                    >
                      Gunakan
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setActiveTemplate(template);
                            setDialogOpen(true);
                          }}
                        >
                          <PencilLine className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteTemplate.mutate(template.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={activeTemplate}
      />
    </>
  );
};

const frequencyLabel = (frequency: NonNullable<TransactionTemplate["recurring_frequency"]>) => {
  switch (frequency) {
    case "daily":
      return "Harian";
    case "weekly":
      return "Mingguan";
    case "monthly":
      return "Bulanan";
    case "yearly":
      return "Tahunan";
  }
};

const formatNextOccurrence = (value: string) => {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
};
