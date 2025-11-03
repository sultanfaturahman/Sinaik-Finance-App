export interface TransactionTemplate {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string | null;
  is_recurring: boolean;
  recurring_frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
  next_occurrence: string | null;
  created_at: string;
  updated_at: string;
}
