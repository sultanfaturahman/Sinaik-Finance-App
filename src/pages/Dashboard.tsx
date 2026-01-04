import { Suspense, lazy, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/app/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { Section } from "@/components/ui/Section";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCategorySuggestions } from "@/hooks/useCategorySuggestions";
import { Skeleton } from "@/components/ui/skeleton";
const OnboardingWizard = lazy(() => import("@/components/OnboardingWizard"));

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  transactionCount: number;
}

interface DashboardStatsRow {
  total_income: number | null;
  total_expense: number | null;
  net_profit: number | null;
  transaction_count: number | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const userId = user?.id;
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
    let active = true;

    const fetchStats = async () => {
      if (!userId || !active) return;

      setLoading(true);

      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase.rpc("get_dashboard_stats");

        if (error) {
          throw error;
        }

        const statsRow: DashboardStatsRow | undefined = Array.isArray(data)
          ? data[0]
          : (data as DashboardStatsRow | null) ?? undefined;

        if (!active) return;

        setStats({
          totalIncome: Number(statsRow?.total_income ?? 0),
          totalExpense: Number(statsRow?.total_expense ?? 0),
          netProfit: Number(statsRow?.net_profit ?? 0),
          transactionCount: Number(statsRow?.transaction_count ?? 0),
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchStats();

    return () => {
      active = false;
    };
  }, [userId]);

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
      {showOnboarding && (
        <Suspense fallback={<OnboardingWizardFallback />}>
          <OnboardingWizard
            open={showOnboarding}
            onOpenChange={setShowOnboarding}
            onCompleted={() => setShowOnboarding(false)}
          />
        </Suspense>
      )}

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

const OnboardingWizardFallback = () => (
  <div className="rounded-2xl border border-dashed border-border/70 bg-background p-6">
    <div className="mb-4 space-y-2">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={`wizard-skeleton-${index}`} className="h-20 rounded-xl" />
      ))}
    </div>
  </div>
);

export default Dashboard;
