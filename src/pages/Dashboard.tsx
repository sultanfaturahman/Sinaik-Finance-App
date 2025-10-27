import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/app/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCategorySuggestions } from "@/hooks/useCategorySuggestions";
import { OnboardingWizard } from "@/components/OnboardingWizard";

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  transactionCount: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { onboardingCompleted, ready: onboardingReady } = useCategorySuggestions();
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const { data: transactions } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", user.id);

      if (transactions) {
        const income = transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expense = transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        setStats({
          totalIncome: income,
          totalExpense: expense,
          netProfit: income - expense,
          transactionCount: transactions.length,
        });
      }
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  useEffect(() => {
    if (!onboardingReady) return;
    setShowOnboarding(!onboardingCompleted);
  }, [onboardingCompleted, onboardingReady]);

  type StatVariant = "default" | "positive" | "negative";
  const statCards: Array<{
    title: string;
    value: ReactNode;
    icon?: ReactNode;
    helper?: string;
    variant?: StatVariant;
  }> = [
    {
      title: "Total Pemasukan",
      value: formatCurrency(stats.totalIncome),
      icon: <TrendingUp className="h-5 w-5 text-success" />,
      variant: "positive" as const,
      helper: "Akumulasi sejak awal tahun",
    },
    {
      title: "Total Pengeluaran",
      value: formatCurrency(stats.totalExpense),
      icon: <TrendingDown className="h-5 w-5 text-destructive" />,
      variant: "negative" as const,
      helper: "Termasuk biaya operasional dan tetap",
    },
    {
      title: "Laba Bersih",
      value: formatCurrency(stats.netProfit),
      icon: <Wallet className="h-5 w-5 text-primary" />,
      variant: stats.netProfit >= 0 ? ("positive" as StatVariant) : ("negative" as StatVariant),
      helper: stats.netProfit >= 0 ? "Kondisi kas sehat" : "Perlu evaluasi pengeluaran",
    },
    {
      title: "Total Transaksi",
      value: stats.transactionCount.toLocaleString("id-ID"),
      icon: <Receipt className="h-5 w-5 text-primary" />,
      helper: "Jumlah transaksi tercatat",
    },
  ];

  return (
    <AppShell title="Dashboard" subtitle="Ringkasan terkini performa usaha Anda">
      <OnboardingWizard
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onCompleted={() => setShowOnboarding(false)}
      />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="flex flex-col gap-6">
          <div data-testid="stats-grid" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
                helper={card.helper}
                variant={card.variant}
              />
            ))}
          </div>

          <Section
            title="Selamat Datang di SiNaik!"
            description="Sistem Informasi Naik Kelas untuk UMKM Cilegon."
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mulai kelola keuangan bisnis Anda dengan mudah. Tambahkan transaksi pemasukan dan
              pengeluaran untuk melihat laporan lengkap dan status klasifikasi UMKM Anda.
            </p>
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <ChecklistItem title="Catat transaksi">
                Kelola pemasukan dan pengeluaran harian secara rutin.
              </ChecklistItem>
              <ChecklistItem title="Lihat laporan">
                Analisis keuangan bulanan dan tahunan dengan cepat.
              </ChecklistItem>
              <ChecklistItem title="Cek status UMKM">
                Pantau klasifikasi bisnis Anda dan target level berikutnya.
              </ChecklistItem>
            </div>
          </Section>
        </div>
      )}
    </AppShell>
  );
};

const ChecklistItem = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border/70 bg-background px-4 py-3">
    <span className="mt-1 block h-2 w-2 rounded-full bg-primary" />
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground leading-snug">{children}</p>
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-44 rounded-2xl" />
  </div>
);

export default Dashboard;

