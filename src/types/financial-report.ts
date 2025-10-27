export type ReportFrequency = "daily" | "monthly";

export interface FinancialReport {
  id: string;
  user_id: string;
  frequency: ReportFrequency;
  report_date: string;
  total_income: number | null;
  total_expense: number | null;
  income_category: string | null;
  expense_category: string | null;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
}
