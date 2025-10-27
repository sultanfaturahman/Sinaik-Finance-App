export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  note: string | null;
  source: "manual" | "excel" | "pwa";
}

