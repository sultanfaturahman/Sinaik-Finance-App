import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/app/AppShell";
import { Section } from "@/components/ui/Section";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/utils/formatCurrency";
import { UMKM_RULES, classifyUMKM, getNextLevel } from "@/utils/umkmRules";
import { TrendingUp, Target, Award, BellRing, AlertTriangle, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Status = () => {
  const { user } = useAuth();
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marginTrend, setMarginTrend] = useState<{
    current: number;
    previous: number;
    currentLabel: string;
    previousLabel: string;
  } | null>(null);
  const [lossStreak, setLossStreak] = useState(0);

  useEffect(() => {
    const fetchRevenue = async () => {
      if (!user) return;

      const currentYear = new Date().getFullYear();
      const supabase = await getSupabaseClient();
      const { data: transactions } = await supabase
        .from("transactions")
        .select("type, amount, date")
        .eq("user_id", user.id)
        .gte("date", `${currentYear}-01-01`)
        .lte("date", `${currentYear}-12-31`);

      if (transactions) {
        const monthFormatter = new Intl.DateTimeFormat("id-ID", {
          month: "long",
          year: "numeric",
        });
        const monthlyBuckets: Record<
          string,
          { income: number; expense: number; monthLabel: string }
        > = {};

        transactions.forEach((t) => {
          const date = new Date(t.date);
          if (Number.isNaN(date.getTime())) return;

          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`;

          if (!monthlyBuckets[monthKey]) {
            monthlyBuckets[monthKey] = {
              income: 0,
              expense: 0,
              monthLabel: monthFormatter.format(date),
            };
          }

          if (t.type === "income") {
            monthlyBuckets[monthKey].income += Number(t.amount);
          } else {
            monthlyBuckets[monthKey].expense += Number(t.amount);
          }
        });

        const income = transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        setAnnualRevenue(income);

        const sortedMonthKeys = Object.keys(monthlyBuckets).sort();
        if (sortedMonthKeys.length > 0) {
          const currentKey = sortedMonthKeys[sortedMonthKeys.length - 1];
          const previousKey = sortedMonthKeys[sortedMonthKeys.length - 2];
          const currentBucket = monthlyBuckets[currentKey];
          const previousBucket = previousKey ? monthlyBuckets[previousKey] : undefined;

          const currentMargin =
            currentBucket.income > 0
              ? ((currentBucket.income - currentBucket.expense) / currentBucket.income) * 100
              : 0;
          const previousMargin =
            previousBucket && previousBucket.income > 0
              ? ((previousBucket.income - previousBucket.expense) / previousBucket.income) * 100
              : 0;

          setMarginTrend({
            current: currentMargin,
            previous: previousMargin,
            currentLabel: currentBucket.monthLabel,
            previousLabel: previousBucket?.monthLabel ?? "",
          });

          let streak = 0;
          for (let idx = sortedMonthKeys.length - 1; idx >= 0; idx -= 1) {
            const bucket = monthlyBuckets[sortedMonthKeys[idx]];
            const profit = bucket.income - bucket.expense;
            if (profit < 0) {
              streak += 1;
            } else {
              break;
            }
          }
          setLossStreak(streak);
        } else {
          setMarginTrend(null);
          setLossStreak(0);
        }

        const classification = classifyUMKM(income);
        await supabase
          .from("umkm_status")
          .upsert(
            {
              user_id: user.id,
              level: classification.level,
              annual_revenue: income,
            },
            { onConflict: "user_id" },
          );
      }

      setLoading(false);
    };

    fetchRevenue();
  }, [user]);

  if (loading) {
    return (
      <AppShell title="Status UMKM" subtitle="Memuat data omzet dan klasifikasi usaha">
        <StatusSkeleton />
      </AppShell>
    );
  }

  const currentClassification = classifyUMKM(annualRevenue);
  const nextLevel = getNextLevel(currentClassification.level);
  const progressPercentage = nextLevel
    ? ((annualRevenue - currentClassification.minRevenue) /
        (nextLevel.minRevenue - currentClassification.minRevenue)) *
      100
    : 100;
  const revenueGap = nextLevel ? nextLevel.minRevenue - annualRevenue : 0;
  const targetRange = nextLevel
    ? nextLevel.minRevenue - currentClassification.minRevenue
    : 0;
  const nearTarget =
    nextLevel &&
    revenueGap > 0 &&
    targetRange > 0 &&
    revenueGap <= Math.max(targetRange * 0.25, 50_000_000);
  const marginDropAlert =
    marginTrend &&
    marginTrend.previous > 0 &&
    marginTrend.current + 5 <= marginTrend.previous;
  const lossStreakAlert = lossStreak >= 2;

  return (
    <AppShell title="Status UMKM" subtitle="Pantau klasifikasi dan target kenaikan level">
      <div className="flex flex-col gap-6">
        {(nearTarget || marginDropAlert || lossStreakAlert) && (
          <Section title="Peringatan Penting">
            {nearTarget && nextLevel && (
              <Alert className="border-primary/30 bg-primary/5">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <AlertTitle>Omzet tinggal {formatCurrency(revenueGap)}</AlertTitle>
                <AlertDescription className="text-sm">
                  Kejar sedikit lagi untuk mencapai level <strong>{nextLevel.label}</strong>.
                  Fokuskan promo ke kategori pemasukan terbesar dalam 30 hari ke depan.
                </AlertDescription>
              </Alert>
            )}

            {marginDropAlert && marginTrend && (
              <Alert className="border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
                <BellRing className="h-4 w-4 text-amber-500" />
                <AlertTitle>
                  Margin turun {Math.abs(marginTrend.previous - marginTrend.current).toFixed(1)}%
                </AlertTitle>
                <AlertDescription className="text-sm">
                  Bulan {marginTrend.currentLabel} memiliki margin {marginTrend.current.toFixed(1)}%
                  {marginTrend.previousLabel
                    ? `, turun dari ${marginTrend.previousLabel} yang mencapai ${marginTrend.previous.toFixed(
                        1
                      )}%.`
                    : "."}{" "}
                  Tinjau pengeluaran terbesar minggu ini dan pastikan harga jual sudah diperbarui.
                </AlertDescription>
              </Alert>
            )}

            {lossStreakAlert && (
              <Alert className="border-destructive/30 bg-destructive/5">
                <Activity className="h-4 w-4 text-destructive" />
                <AlertTitle>Perhatian: {lossStreak} bulan terakhir rugi</AlertTitle>
                <AlertDescription className="text-sm">
                  Buat rencana aksi cepat: hentikan promo yang tidak efektif, cek stok lambat gerak,
                  dan gunakan strategi AI untuk rekomendasi pemulihan omzet.
                </AlertDescription>
              </Alert>
            )}
          </Section>
        )}

        <Section
          title="Klasifikasi UMKM Saat Ini"
          description="Status mengikuti peraturan terbaru Kementerian Koperasi dan UKM."
        >
          <div className="flex flex-col gap-4 rounded-2xl border border-primary/40 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${currentClassification.color}1f` }}
              >
                <Award className="h-6 w-6" style={{ color: currentClassification.color }} />
              </span>
              <div>
                <p className="text-lg font-semibold text-foreground md:text-xl">
                  {currentClassification.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentClassification.description}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-background px-4 py-3 text-sm shadow-sm">
              <p className="text-muted-foreground">Omzet Tahunan</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(annualRevenue)}</p>
            </div>
          </div>

          {nextLevel && (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background p-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Progres menuju level {nextLevel.label}</span>
                <span>{progressPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(currentClassification.minRevenue)}</span>
                <span>{formatCurrency(nextLevel.minRevenue)}</span>
              </div>
            </div>
          )}
        </Section>

        {nextLevel && (
          <Section title="Target Selanjutnya">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border bg-background px-4 py-4">
                <p className="text-sm text-muted-foreground">Target omzet minimum:</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(nextLevel.minRevenue)}
                </p>
              </div>
              <div className="rounded-2xl border bg-background px-4 py-4">
                <p className="text-sm text-muted-foreground">Selisih menuju target:</p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(nextLevel.minRevenue - annualRevenue)}
                </p>
              </div>
            </div>
          </Section>
        )}

        <Section title="Semua Level UMKM">
          <div className="space-y-3">
            {UMKM_RULES.map((rule) => {
              const isCurrentLevel = rule.level === currentClassification.level;
              return (
                <div
                  key={rule.level}
                  className={`flex items-center justify-between rounded-2xl border-2 px-4 py-4 transition-colors ${
                    isCurrentLevel
                      ? "border-primary bg-primary/10"
                      : "border-transparent bg-background"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: rule.color }}
                    />
                    <div>
                      <p className={`font-semibold ${isCurrentLevel ? "text-foreground" : "text-foreground/80"}`}>
                        {rule.label}
                      </p>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                  </div>
                  {isCurrentLevel && (
                    <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Level Saat Ini
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </AppShell>
  );
};

const StatusSkeleton = () => (
  <div className="flex flex-col gap-6">
    {Array.from({ length: 3 }).map((_, index) => (
      <Skeleton key={index} className="h-40 rounded-2xl" />
    ))}
  </div>
);

export default Status;

