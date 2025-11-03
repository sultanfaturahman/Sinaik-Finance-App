import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/date";
import { Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";

interface TransactionTableProps {
  data: Transaction[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionTable = ({
  data,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}: TransactionTableProps) => {
  const total = data.length;
  const selectedCount = selectedIds.size;
  const allSelected = total > 0 && selectedCount === total;
  const partiallySelected = selectedCount > 0 && selectedCount < total;

  return (
    <div className="hidden overflow-x-auto rounded-2xl border bg-card shadow-sm md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                aria-label="Pilih semua transaksi"
                checked={allSelected ? true : partiallySelected ? "indeterminate" : false}
                onCheckedChange={(value) => onToggleSelectAll(value === true)}
              />
            </TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Catatan</TableHead>
            <TableHead>Sumber</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction) => (
            <TableRow
              key={transaction.id}
              className={cn(selectedIds.has(transaction.id) && "bg-muted/50")}
            >
              <TableCell>
                <Checkbox
                  aria-label={`Pilih transaksi ${transaction.category}`}
                  checked={selectedIds.has(transaction.id)}
                  onCheckedChange={(value) =>
                    onToggleSelect(transaction.id, value === true)
                  }
                />
              </TableCell>
              <TableCell>{formatDateShort(transaction.date)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {transaction.type === "income" ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="font-medium text-success">Pemasukan</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <span className="font-medium text-destructive">Pengeluaran</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {transaction.note || "-"}
              </TableCell>
              <TableCell>
                <span className="rounded-full bg-muted px-2 py-1 text-xs">
                  {transaction.source === "manual"
                    ? "Manual"
                    : transaction.source === "excel"
                    ? "Excel"
                    : "PWA"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(transaction)}
                    className="focus-visible:ring-brand"
                    aria-label={`Edit transaksi ${transaction.category}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(transaction.id)}
                    className="text-destructive hover:text-destructive focus-visible:ring-brand"
                    aria-label={`Hapus transaksi ${transaction.category}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
