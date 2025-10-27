import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/date";
import { Transaction } from "@/types/transaction";

interface TransactionTableProps {
  data: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionTable = ({ data, onEdit, onDelete }: TransactionTableProps) => (
  <div className="hidden md:block overflow-x-auto rounded-2xl border bg-card shadow-sm">
    <Table>
      <TableHeader>
        <TableRow>
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
          <TableRow key={transaction.id}>
            <TableCell>{formatDateShort(transaction.date)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {transaction.type === "income" ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-success font-medium">Pemasukan</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-destructive font-medium">Pengeluaran</span>
                  </>
                )}
              </div>
            </TableCell>
            <TableCell>{transaction.category}</TableCell>
            <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
            <TableCell className="text-muted-foreground">{transaction.note || "-"}</TableCell>
            <TableCell>
              <span className="text-xs px-2 py-1 rounded-full bg-muted">
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
