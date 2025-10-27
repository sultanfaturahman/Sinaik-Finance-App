import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReportFrequency } from "@/types/financial-report";

interface FinancialNoteFormProps {
  frequency: ReportFrequency;
  submitting?: boolean;
  suggestions: string[];
  onSubmit: (payload: {
    reportDate: string;
    income: number;
    expense: number;
    incomeCategory: string;
    expenseCategory: string;
  }) => Promise<void>;
}

export const FinancialNoteForm = ({ frequency, submitting, suggestions, onSubmit }: FinancialNoteFormProps) => {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const incomeListId = `${frequency}-income-categories`;
  const expenseListId = `${frequency}-expense-categories`;

  const resetForm = () => {
    setIncome("");
    setExpense("");
    setIncomeCategory("");
    setExpenseCategory("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const incomeAmount = Number(income || "0");
    const expenseAmount = Number(expense || "0");

    if (Number.isNaN(incomeAmount) || Number.isNaN(expenseAmount)) {
      toast.error("Nilai pemasukan dan pengeluaran harus berupa angka.");
      return;
    }

    if (incomeAmount <= 0 && expenseAmount <= 0) {
      toast.error("Isi minimal salah satu nilai pemasukan atau pengeluaran.");
      return;
    }

    const baseDate = frequency === "daily" ? date : month ? `${month}-01` : "";

    if (!baseDate) {
      toast.error("Tanggal atau bulan tidak valid.");
      return;
    }

    const trimmedIncomeCategory = incomeCategory.trim();
    const trimmedExpenseCategory = expenseCategory.trim();

    if (incomeAmount > 0 && !trimmedIncomeCategory) {
      toast.error("Kategori pemasukan wajib diisi saat Anda mencatat pemasukan.");
      return;
    }

    if (expenseAmount > 0 && !trimmedExpenseCategory) {
      toast.error("Kategori pengeluaran wajib diisi saat Anda mencatat pengeluaran.");
      return;
    }

    await onSubmit({
      reportDate: baseDate,
      income: incomeAmount,
      expense: expenseAmount,
      incomeCategory: trimmedIncomeCategory,
      expenseCategory: trimmedExpenseCategory,
    });
    resetForm();
  };

  const quickSuggestions = suggestions.slice(0, 8);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{frequency === "daily" ? "Tanggal" : "Bulan"}</Label>
          {frequency === "daily" ? (
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="focus-visible:ring-brand"
            />
          ) : (
            <Input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              required
              className="focus-visible:ring-brand"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label>Pemasukan</Label>
          <div className="grid gap-2">
            <Input
              type="number"
              min="0"
              placeholder="contoh: 250000"
              value={income}
              onChange={(event) => setIncome(event.target.value)}
              className="focus-visible:ring-brand"
            />
            <div className="space-y-1">
              <Input
                type="text"
                placeholder="Kategori pemasukan, misal: Penjualan Online"
                list={incomeListId}
                value={incomeCategory}
                onChange={(event) => setIncomeCategory(event.target.value)}
                className="focus-visible:ring-brand"
              />
              <datalist id={incomeListId}>
                {suggestions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {quickSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickSuggestions.map((category) => (
                    <Button
                      key={`income-${category}`}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIncomeCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Pengeluaran</Label>
          <div className="grid gap-2">
            <Input
              type="number"
              min="0"
              placeholder="contoh: 180000"
              value={expense}
              onChange={(event) => setExpense(event.target.value)}
              className="focus-visible:ring-brand"
            />
            <div className="space-y-1">
              <Input
                type="text"
                placeholder="Kategori pengeluaran, misal: Pembelian Bahan Baku"
                list={expenseListId}
                value={expenseCategory}
                onChange={(event) => setExpenseCategory(event.target.value)}
                className="focus-visible:ring-brand"
              />
              <datalist id={expenseListId}>
                {suggestions.map((category) => (
                  <option key={`option-${category}`} value={category} />
                ))}
              </datalist>
              {quickSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickSuggestions.map((category) => (
                    <Button
                      key={`expense-${category}`}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setExpenseCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button
          type="submit"
          disabled={submitting}
          className={cn(
            "rounded-2xl bg-brand text-white hover:bg-brand/90 focus-visible:ring-brand",
            submitting && "opacity-75"
          )}
        >
          {submitting ? "Menyimpan..." : "Simpan Catatan"}
        </Button>
      </div>
    </form>
  );
};
