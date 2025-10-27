import { useEffect, useMemo, useState } from "react";
import { Loader2, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCategorySuggestions } from "@/hooks/useCategorySuggestions";
import { Section } from "@/components/ui/Section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FinancialNoteForm } from "@/components/notes/FinancialNoteForm";
import type { FinancialReport, ReportFrequency } from "@/types/financial-report";

type FrequencyState<T> = Record<ReportFrequency, T>;

const INITIAL_LOADING: FrequencyState<boolean> = { daily: true, monthly: true };
const INITIAL_SUBMITTING: FrequencyState<boolean> = { daily: false, monthly: false };
const INITIAL_REPORTS: FrequencyState<FinancialReport[]> = { daily: [], monthly: [] };

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const formatDate = (frequency: ReportFrequency, date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  if (frequency === "monthly") {
    return parsed.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }

  return parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const Notes = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportFrequency>("daily");
  const [reports, setReports] = useState<FrequencyState<FinancialReport[]>>(INITIAL_REPORTS);
  const [loading, setLoading] = useState<FrequencyState<boolean>>(INITIAL_LOADING);
  const [submitting, setSubmitting] = useState<FrequencyState<boolean>>(INITIAL_SUBMITTING);
  const { suggestions, addSuggestion, bulkAddSuggestions } = useCategorySuggestions();

  const hasAnyReport = useMemo(
    () => reports.daily.length > 0 || reports.monthly.length > 0,
    [reports.daily.length, reports.monthly.length]
  );

  const fetchReports = async (frequency: ReportFrequency) => {
    if (!user) {
      return;
    }

    setLoading((prev) => ({ ...prev, [frequency]: true }));
    const { data, error } = await supabase
      .from("financial_reports")
      .select("*")
      .eq("user_id", user.id)
      .eq("frequency", frequency)
      .order("report_date", { ascending: false });

    if (error) {
      console.error("Failed to fetch financial reports", error);
      toast.error("Gagal memuat catatan.");
    } else if (data) {
      const typed = data as FinancialReport[];
      setReports((prev) => ({ ...prev, [frequency]: typed }));
      const categories = typed
        .flatMap((item) => [item.income_category, item.expense_category])
        .filter((category): category is string => Boolean(category));
      if (categories.length > 0) {
        bulkAddSuggestions(categories);
      }
    }

    setLoading((prev) => ({ ...prev, [frequency]: false }));
  };

  useEffect(() => {
    if (!user?.id) {
      setReports({ daily: [], monthly: [] });
      setLoading({ daily: false, monthly: false });
      setSubmitting({ daily: false, monthly: false });
      return;
    }

    setLoading({ daily: true, monthly: true });
    fetchReports("daily");
    fetchReports("monthly");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = (frequency: ReportFrequency) => async (payload: {
    reportDate: string;
    income: number;
    expense: number;
    incomeCategory: string;
    expenseCategory: string;
  }) => {
    if (!user) {
      toast.error("Anda belum masuk.");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [frequency]: true }));

    try {
      const { error } = await supabase
        .from("financial_reports")
        .upsert(
          [
            {
              user_id: user.id,
              frequency,
              report_date: payload.reportDate,
              total_income: payload.income,
              total_expense: payload.expense,
              income_category: payload.incomeCategory || null,
              expense_category: payload.expenseCategory || null,
              note: null,
            },
          ],
          { onConflict: "user_id,frequency,report_date" }
        );

      if (error) {
        throw error;
      }

      toast.success("Catatan tersimpan.");
      if (payload.incomeCategory) {
        addSuggestion(payload.incomeCategory);
      }
      if (payload.expenseCategory) {
        addSuggestion(payload.expenseCategory);
      }
      fetchReports(frequency);
    } catch (error) {
      console.error("Failed to upsert financial report", error);
      toast.error("Gagal menyimpan catatan.");
    } finally {
      setSubmitting((prev) => ({ ...prev, [frequency]: false }));
    }
  };

  const renderReportList = (frequency: ReportFrequency) => {
    if (loading[frequency]) {
      return (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border/80 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat catatan {frequency === "daily" ? "harian" : "bulanan"}...
        </div>
      );
    }

    if (reports[frequency].length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          Belum ada catatan {frequency === "daily" ? "harian" : "bulanan"} yang tersimpan.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {reports[frequency].map((report) => {
          const income = Number(report.total_income ?? 0);
          const expense = Number(report.total_expense ?? 0);
          const net = income - expense;
          const netPositive = net >= 0;

          return (
            <Card key={report.id} className="overflow-hidden rounded-2xl border border-border/70">
              <CardHeader className="flex flex-col gap-2 border-b border-border/60 bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {formatDate(frequency, report.report_date)}
                  </CardTitle>
                  <CardDescription>
                    Ringkasan {frequency === "daily" ? "harian" : "bulanan"} disimpan otomatis tanpa mempengaruhi transaksi.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "border px-3 py-1 text-xs font-semibold",
                    netPositive ? "border-emerald-500 text-emerald-600" : "border-red-500 text-red-600"
                  )}
                >
                  {netPositive ? "Surplus" : "Defisit"} {currencyFormatter.format(Math.abs(net))}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-background px-3 py-2 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Pemasukan</p>
                  <p className="text-sm font-semibold text-foreground">{currencyFormatter.format(income)}</p>
                  {report.income_category && (
                    <p className="text-xs text-muted-foreground">
                      Kategori:{" "}
                      <span className="font-medium text-foreground">{report.income_category}</span>
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-border/50 bg-background px-3 py-2 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Pengeluaran</p>
                  <p className="text-sm font-semibold text-foreground">{currencyFormatter.format(expense)}</p>
                  {report.expense_category && (
                    <p className="text-xs text-muted-foreground">
                      Kategori:{" "}
                      <span className="font-medium text-foreground">{report.expense_category}</span>
                    </p>
                  )}
                </div>
                {report.note && (
                  <div className="rounded-xl border border-border/50 bg-background px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Catatan</p>
                    <p className="text-sm text-foreground">{report.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <AppShell
      title="Catatan Keuangan"
      subtitle={
        hasAnyReport ? (
          <span className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
            <NotebookPen className="h-4 w-4" />
            Simpan ringkasan harian atau bulanan tanpa menambah transaksi baru.
          </span>
        ) : null
      }
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ReportFrequency)}
        className="space-y-6"
      >
        <TabsList className="flex w-full gap-2 rounded-2xl bg-muted/40 p-1">
          <TabsTrigger
            value="daily"
            className="flex-1 rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            Catatan Harian
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            className="flex-1 rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            Catatan Bulanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6 focus-visible:outline-none">
          <Section
            title="Input Catatan Harian"
            description="Rekap pemasukan dan pengeluaran harian tanpa mempengaruhi perhitungan transaksi manual atau impor."
          >
            <FinancialNoteForm
              frequency="daily"
              submitting={submitting.daily}
              suggestions={suggestions}
              onSubmit={handleSubmit("daily")}
            />
          </Section>

          <Section
            title="Riwayat Catatan Harian"
            description="Kumpulan catatan harian yang tersimpan sebagai referensi perkembangan usaha."
          >
            {renderReportList("daily")}
          </Section>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6 focus-visible:outline-none">
          <Section
            title="Input Catatan Bulanan"
            description="Catat rangkuman bulanan untuk memantau tren tanpa menambah transaksi baru."
          >
            <FinancialNoteForm
              frequency="monthly"
              submitting={submitting.monthly}
              suggestions={suggestions}
              onSubmit={handleSubmit("monthly")}
            />
          </Section>

          <Section
            title="Riwayat Catatan Bulanan"
            description="Gunakan catatan bulanan sebagai bahan evaluasi dan input strategi."
          >
            {renderReportList("monthly")}
          </Section>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default Notes;
