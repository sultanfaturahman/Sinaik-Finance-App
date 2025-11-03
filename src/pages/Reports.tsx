import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/app/AppShell";
import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatCard } from "@/components/dashboard/StatCard";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { formatCurrency } from "@/utils/formatCurrency";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface MonthlyReport {
  monthLabel: string;
  monthKey: string;
  year: number;
  income: number;
  expense: number;
  profit: number;
}

const Reports = () => {
  const { user } = useAuth();
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      const { data: transactions, error: queryError } = await supabase
        .from("transactions")
        .select("type, amount, date")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (queryError) {
        console.error("Error fetching reports", queryError);
        setError("Gagal memuat laporan keuangan");
        setLoading(false);
        return;
      }

      if (transactions) {
        const monthlyData = new Map<string, MonthlyReport>();

        transactions.forEach((t) => {
          const date = new Date(t.date);
          if (Number.isNaN(date.getTime())) return;

          const year = date.getFullYear();
          const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;

          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
              monthLabel: new Intl.DateTimeFormat("id-ID", {
                month: "long",
                year: "numeric",
              }).format(date),
              monthKey,
              year,
              income: 0,
              expense: 0,
              profit: 0,
            });
          }

          const report = monthlyData.get(monthKey)!;
          if (t.type === "income") {
            report.income += Number(t.amount);
          } else {
            report.expense += Number(t.amount);
          }
        });

        const parsedReports = Array.from(monthlyData.values())
          .map((report) => ({
            ...report,
            profit: report.income - report.expense,
          }))
          .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

        setMonthlyReports(parsedReports);
        if (parsedReports.length > 0) {
          setSelectedYear(parsedReports[0].year);
        }
      }

      setLoading(false);
    };

    fetchReports();
  }, [user]);

  const years = useMemo(
    () => Array.from(new Set(monthlyReports.map((report) => report.year))).sort((a, b) => b - a),
    [monthlyReports]
  );

  const filteredReports = useMemo(
    () => monthlyReports.filter((report) => report.year === selectedYear),
    [monthlyReports, selectedYear]
  );

  const totals = useMemo(() => {
    const income = filteredReports.reduce((sum, report) => sum + report.income, 0);
    const expense = filteredReports.reduce((sum, report) => sum + report.expense, 0);
    const profit = filteredReports.reduce((sum, report) => sum + report.profit, 0);
    const margin = income > 0 ? (profit / income) * 100 : 0;

    const latestReport = filteredReports[0];
    const previousReport = filteredReports[1];
    const latestMargin =
      latestReport && latestReport.income > 0 ? (latestReport.profit / latestReport.income) * 100 : 0;
    const previousMargin =
      previousReport && previousReport.income > 0
        ? (previousReport.profit / previousReport.income) * 100
        : 0;

    return {
      income,
      expense,
      profit,
      margin,
      latestReport,
      previousReport,
      latestMargin,
      previousMargin,
      marginDelta: latestMargin - previousMargin,
    };
  }, [filteredReports]);

  const bestMonth =
    filteredReports.length > 0
      ? filteredReports.reduce((best, report) => (report.profit > best.profit ? report : best))
      : null;

  const worstMonth =
    filteredReports.length > 0
      ? filteredReports.reduce((worst, report) =>
          report.profit < worst.profit ? report : worst
        )
      : null;

  return (
    <AppShell title="Laporan Keuangan" subtitle="Analisis pendapatan dan pengeluaran per bulan">
      {loading ? (
        <ReportsSkeleton />
      ) : error ? (
        <ErrorState
          description={error}
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Muat Ulang
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <ReportFilters
            years={years}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Pemasukan"
              value={formatCurrency(totals.income)}
              icon={<TrendingUp className="h-5 w-5 text-success" />}
              helper={`Periode ${selectedYear}`}
              variant="positive"
            />
            <StatCard
              title="Total Pengeluaran"
              value={formatCurrency(totals.expense)}
              icon={<TrendingDown className="h-5 w-5 text-destructive" />}
              helper="Termasuk biaya tetap & variabel"
              variant="negative"
            />
            <StatCard
              title="Laba Bersih"
              value={formatCurrency(totals.profit)}
              icon={<Wallet className="h-5 w-5 text-primary" />}
              helper={
                totals.profit >= 0 ? "Kas stabil" : "Perlu evaluasi pengeluaran besar"
              }
              variant={totals.profit >= 0 ? "positive" : "negative"}
            />
            <StatCard
              title="Profit Margin"
              value={`${totals.margin.toFixed(1)}%`}
              icon={
                totals.marginDelta >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-success" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-destructive" />
                )
              }
              helper={
                totals.previousReport
                  ? `Perubahan ${totals.marginDelta >= 0 ? "+" : ""}${totals.marginDelta.toFixed(
                      1
                    )}% dari bulan sebelumnya`
                  : "Data satu bulan"
              }
            />
          </div>

          {filteredReports.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="Belum Ada Laporan"
              description={`Tambahkan transaksi pada ${selectedYear} untuk melihat ringkasan laporan.`}
            />
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.monthKey} className="rounded-2xl border bg-card shadow-sm">
                  <CardContent className="space-y-4 p-4 md:p-6">
                    <div className="flex flex-col justify-between gap-1 md:flex-row md:items-center">
                      <h3 className="text-lg font-semibold leading-tight md:text-xl">
                        {report.monthLabel}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Rekap pemasukan, pengeluaran, dan laba bersih
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <HighlightCard
                        title="Pemasukan"
                        value={formatCurrency(report.income)}
                        tone="success"
                        icon={<TrendingUp className="h-4 w-4" />}
                      />
                      <HighlightCard
                        title="Pengeluaran"
                        value={formatCurrency(report.expense)}
                        tone="destructive"
                        icon={<TrendingDown className="h-4 w-4" />}
                      />
                      <HighlightCard
                        title="Laba Bersih"
                        value={formatCurrency(report.profit)}
                        tone={report.profit >= 0 ? "success" : "destructive"}
                        icon={<Wallet className="h-4 w-4" />}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredReports.length > 0 && (
            <Section title="Target & Rekomendasi">
              <div className="grid gap-3 md:grid-cols-2">
                <TargetCard
                  title="Target Margin 25%"
                  description={
                    totals.margin >= 25
                      ? "Target margin tercapai. Pertahankan efisiensi biaya dan fokuskan promosi ke produk dengan margin tinggi."
                      : `Margin saat ini ${totals.margin.toFixed(
                          1
                        )}%. Butuh tambahan ${(25 - totals.margin).toFixed(
                          1
                        )}% untuk mencapai target sehat UMKM.`
                  }
                  icon={<Target className="h-5 w-5 text-primary" />}
                />
                {worstMonth && worstMonth.monthKey !== bestMonth?.monthKey && (
                  <TargetCard
                    title="Bulan Perlu Perhatian"
                    description={`Pengeluaran ${worstMonth.monthLabel} lebih tinggi daripada pemasukan (${formatCurrency(
                      worstMonth.profit
                    )}). Evaluasi promosi dan biaya operasional pada periode tersebut.`}
                    icon={<TrendingDown className="h-5 w-5 text-destructive" />}
                  />
                )}
              </div>
            </Section>
          )}
        </div>
      )}
    </AppShell>
  );
};

const HighlightCard = ({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: string;
  tone: "success" | "destructive";
  icon: React.ReactNode;
}) => (
  <div
    className={
      tone === "success"
        ? "rounded-2xl border border-success/20 bg-success/10 p-4"
        : "rounded-2xl border border-destructive/20 bg-destructive/10 p-4"
    }
  >
    <div className="flex items-center gap-2 text-sm font-medium">
      {icon}
      <span>{title}</span>
    </div>
    <p
      className={
        tone === "success"
          ? "mt-2 text-2xl font-semibold text-success"
          : "mt-2 text-2xl font-semibold text-destructive"
      }
    >
      {value}
    </p>
  </div>
);

const TargetCard = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border bg-background px-4 py-4">
    <span className="mt-1 rounded-xl bg-primary/10 p-2 text-primary">{icon}</span>
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground leading-snug">{description}</p>
    </div>
  </div>
);

const ReportsSkeleton = () => (
  <div className="flex flex-col gap-6">
    <Skeleton className="h-20 rounded-2xl" />
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-2xl" />
      ))}
    </div>
    {Array.from({ length: 2 }).map((_, index) => (
      <Skeleton key={index} className="h-40 rounded-2xl" />
    ))}
  </div>
);

export default Reports;
