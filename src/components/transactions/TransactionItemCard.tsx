import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Transaction } from "@/types/transaction";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateShort } from "@/utils/date";
import { EllipsisVertical, TrendingUp, TrendingDown } from "lucide-react";

interface TransactionItemCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionItemCard = ({
  transaction,
  onEdit,
  onDelete,
}: TransactionItemCardProps) => (
  <Card className="rounded-2xl border bg-card shadow-sm">
    <CardContent className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{transaction.category}</p>
          <p className="text-xs text-muted-foreground">{formatDateShort(transaction.date)}</p>
        </div>
        <div className="flex items-center gap-2">
          {transaction.type === "income" ? (
            <Badge variant="outline" className="gap-1 text-success">
              <TrendingUp className="h-3.5 w-3.5" /> Pemasukan
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-destructive">
              <TrendingDown className="h-3.5 w-3.5" /> Pengeluaran
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 focus-visible:ring-brand"
                aria-label={`Opsi transaksi ${transaction.category}`}
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(transaction)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(transaction.id)}
                className="text-destructive focus:text-destructive"
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div>
        <p className="text-lg font-semibold">{formatCurrency(transaction.amount)}</p>
        {transaction.note && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{transaction.note}</p>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Sumber:{" "}
          {transaction.source === "manual"
            ? "Manual"
            : transaction.source === "excel"
            ? "Import Excel"
            : "PWA"}
        </span>
        <span className="rounded-full bg-muted px-2 py-1 text-[11px] uppercase tracking-wide">
          #{transaction.id.slice(0, 6)}
        </span>
      </div>
    </CardContent>
  </Card>
);
