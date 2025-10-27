import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { AppShell } from '@/app/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFinancialSnapshot } from '@/hooks/useFinancialSnapshot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Section } from '@/components/ui/Section';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StrategyInputForm } from '@/components/ai/StrategyInputForm';
import {
  createDefaultStrategyFormState,
  normalizeStrategyPlan,
  transformFormStateToPayload,
} from '@/lib/strategy';
import type {
  StrategyPlan,
  StrategyFinancialSnapshot,
  StrategyFormState,
} from '@/types/strategy';

const STORAGE_PREFIX = 'sinaik:strategy-tracker';
const STRATEGY_DATA_PREFIX = 'sinaik:strategy-data';


const getStorageKey = (userId: string) => `${STORAGE_PREFIX}:${userId}`;
const getStrategyDataKey = (userId: string) => `${STRATEGY_DATA_PREFIX}:${userId}`;

interface MarkdownSection {
  id: string;
  title: string;
  content: string;
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'section';

const parseMarkdownSections = (markdown: string): MarkdownSection[] => {
  if (!markdown || !markdown.trim()) {
    return [];
  }

  const lines = markdown.split(/\r?\n/);
  const sections: MarkdownSection[] = [];
  let currentTitle = 'Ringkasan';
  let buffer: string[] = [];
  let index = 0;

  const pushSection = () => {
    const content = buffer.join('\n').trim();
    if (!content) {
      buffer = [];
      return;
    }

    const slug = slugify(currentTitle || `bagian-${index + 1}`);
    sections.push({
      id: `${slug}-${index}`,
      title: currentTitle || `Bagian ${index + 1}`,
      content,
    });
    index += 1;
    buffer = [];
  };

  lines.forEach((line) => {
    const headingMatch = line.match(/^#{1,6}\s+(.*)/);
    if (headingMatch) {
      pushSection();
      currentTitle = headingMatch[1].trim();
    } else {
      buffer.push(line);
    }
  });

  pushSection();

  return sections;
};

const makePlanVersion = (steps: StrategyStep[]) =>
  steps.map((step) => step.id).join('|');

const AIStrategy = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<StrategyPlan | null>(null);
  const [rawStrategy, setRawStrategy] = useState<string | null>(null);
  const [showRawStrategy, setShowRawStrategy] = useState(false);
  const [taskProgress, setTaskProgress] = useState<Record<string, boolean>>({});
  const [planVersion, setPlanVersion] = useState('');
  const [detailView, setDetailView] = useState<'sections' | 'raw'>('sections');
  const [formState, setFormState] = useState<StrategyFormState>(createDefaultStrategyFormState());
  const [formTouched, setFormTouched] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [cacheMeta, setCacheMeta] = useState<{ cacheHit: boolean; createdAt?: string; model?: string | null } | null>(null);
  const [storedSnapshot, setStoredSnapshot] = useState<StrategyFinancialSnapshot | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);

  const { snapshot, loading: _snapshotLoading, error: snapshotError } = useFinancialSnapshot();

  const markdownSections = useMemo(
    () => (rawStrategy ? parseMarkdownSections(rawStrategy) : []),
    [rawStrategy]
  );

  const persistStrategyData = (
    data: {
      strategy: StrategyPlan;
      rawStrategy: string | null;
      financialSnapshot: StrategyFinancialSnapshot | null;
      formState: StrategyFormState;
      cacheMeta?: { cacheHit: boolean; createdAt?: string; model?: string | null } | null;
      model?: string | null;
      generatedAt: string;
    } | null
  ) => {
    if (!user?.id || typeof window === 'undefined') return;
    const key = getStrategyDataKey(user.id);
    if (!data) {
      window.localStorage.removeItem(key);
      return;
    }

    try {
      const version = makePlanVersion(data.strategy.action_plan);
      window.localStorage.setItem(
        key,
        JSON.stringify({
          ...data,
          planVersion: version,
        })
      );
    } catch (error) {
      console.warn('Gagal menyimpan strategi ke penyimpanan lokal', error);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setStrategy(null);
      setRawStrategy(null);
      setStoredSnapshot(null);
      setPlanVersion('');
      setTaskProgress({});
      setShowRawStrategy(false);
      setDetailView('sections');
      setCacheMeta(null);
      setModelName(null);
      setFormState(createDefaultStrategyFormState());
      setFormTouched(false);
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(getStrategyDataKey(user.id));
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as {
        strategy?: StrategyPlan;
        rawStrategy?: string | null;
        financialSnapshot?: unknown;
        formState?: StrategyFormState;
        planVersion?: string;
        cacheMeta?: { cacheHit: boolean; createdAt?: string; model?: string | null } | null;
        model?: string | null;
      };

      if (parsed?.strategy) {
        setStrategy(parsed.strategy);
        setRawStrategy(parsed.rawStrategy ?? null);
        setStoredSnapshot(isFinancialSnapshot(parsed.financialSnapshot) ? parsed.financialSnapshot : null);
        if (parsed.formState) {
          setFormState(parsed.formState);
          setFormTouched(true);
        }
        setCacheMeta(parsed.cacheMeta ?? null);
        setModelName(parsed.model ?? null);
        setDetailView('sections');

        if (parsed.planVersion) {
          setPlanVersion(parsed.planVersion);
        }
      }
    } catch (error) {
      console.warn('Gagal memuat strategi tersimpan', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    setStoredSnapshot((prev) => prev ?? snapshot);

    if (formTouched) {
      return;
    }

    setFormState((current) => ({
      profile: {
        ...current.profile,
        businessName:
          current.profile.businessName ||
          (user?.user_metadata?.business_name as string | undefined) ||
          (user?.user_metadata?.name as string | undefined) ||
          user?.email?.split('@')[0] ||
          '',
        sector: current.profile.sector || snapshot.topIncomeCategories[0]?.category || current.profile.sector,
        targetMarket: current.profile.targetMarket,
        teamSize: current.profile.teamSize,
        differentiator: current.profile.differentiator,
      },
      financialSummary: {
        revenueYtd:
          current.financialSummary.revenueYtd ||
          String(Math.round(snapshot.yearToDate.totalIncome)),
        expenseYtd:
          current.financialSummary.expenseYtd ||
          String(Math.round(snapshot.yearToDate.totalExpense)),
        netProfitYtd:
          current.financialSummary.netProfitYtd ||
          String(Math.round(snapshot.yearToDate.netProfit)),
        profitMargin:
          current.financialSummary.profitMargin ||
          snapshot.yearToDate.profitMargin.toFixed(1),
        noteworthyTrend: current.financialSummary.noteworthyTrend,
      },
      goals: current.goals,
    }));
  }, [snapshot, formTouched, user?.user_metadata, user?.email]);

  useEffect(() => {
    if (!user?.id || !strategy) return;
    const version = makePlanVersion(strategy.action_plan);
    setPlanVersion(version);

    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(getStorageKey(user.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.version === version && parsed?.tasks) {
          setTaskProgress(parsed.tasks);
          return;
        }
      }
    } catch (error) {
      console.warn('Gagal memuat progres strategi', error);
    }

    setTaskProgress({});
  }, [strategy, user?.id]);

  const persistTaskProgress = (progress: Record<string, boolean>) => {
    if (!user?.id || typeof window === 'undefined') return;
    const version = planVersion || (strategy ? makePlanVersion(strategy.action_plan) : '');
    if (!version) return;
    try {
      window.localStorage.setItem(
        getStorageKey(user.id),
        JSON.stringify({ version, tasks: progress })
      );
    } catch (error) {
      console.warn('Gagal menyimpan progres strategi', error);
    }
  };

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    setTaskProgress((prev) => {
      const next = { ...prev };
      if (checked) {
        next[taskId] = true;
      } else {
        delete next[taskId];
      }
      persistTaskProgress(next);
      return next;
    });
  };

  const resetTaskProgress = () => {
    setTaskProgress({});
    persistTaskProgress({});
  };

  const clearStoredStrategy = () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (user?.id) {
      window.localStorage.removeItem(getStrategyDataKey(user.id));
      window.localStorage.removeItem(getStorageKey(user.id));
    }

    setStrategy(null);
    setRawStrategy(null);
    setStoredSnapshot(null);
    setPlanVersion('');
    setTaskProgress({});
    setShowRawStrategy(false);
    setDetailView('sections');
    setCacheMeta(null);
    setModelName(null);
    setFormState(createDefaultStrategyFormState());
    setFormTouched(false);
    setForceRefresh(false);
    toast.success('Strategi tersimpan dibersihkan. Silakan jalankan analisis ulang.');
  };

  const generateStrategy = async () => {
    if (!user) return;

    const resolvedForm = { ...formState };
    const latestSnapshot = snapshot ?? storedSnapshot;

    if (latestSnapshot && !formTouched) {
      resolvedForm.financialSummary = {
        revenueYtd:
          resolvedForm.financialSummary.revenueYtd ||
          String(Math.round(latestSnapshot.yearToDate.totalIncome)),
        expenseYtd:
          resolvedForm.financialSummary.expenseYtd ||
          String(Math.round(latestSnapshot.yearToDate.totalExpense)),
        netProfitYtd:
          resolvedForm.financialSummary.netProfitYtd ||
          String(Math.round(latestSnapshot.yearToDate.netProfit)),
        profitMargin:
          resolvedForm.financialSummary.profitMargin ||
          latestSnapshot.yearToDate.profitMargin.toFixed(1),
        noteworthyTrend:
          resolvedForm.financialSummary.noteworthyTrend ||
          (latestSnapshot.topIncomeCategories[0]
            ? `Kategori pemasukan terbesar: ${latestSnapshot.topIncomeCategories[0].category}`
            : ''),
      };
    }

    const payload = transformFormStateToPayload(resolvedForm);

    setLoading(true);
    setShowRawStrategy(false);
    setDetailView('sections');

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const { data, error } = await supabase.functions.invoke('generate-business-strategy', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: {
          profile: payload.profile,
          financialSummary: payload.financialSummary,
          goals: payload.goals,
          forceRefresh,
        },
      });

      if (error) {
        console.error('Error invoking function:', error);

        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast.error('Rate limit tercapai. Silakan coba lagi dalam beberapa saat.');
        } else if (error.message?.includes('402') || error.message?.includes('kredit')) {
          toast.error('Kredit AI habis. Silakan hubungi admin untuk menambah kuota.');
        } else {
          toast.error('Gagal menghasilkan strategi: ' + error.message);
        }
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (!data?.strategy) {
        toast.error('Strategi tidak tersedia dari AI. Coba lagi dalam beberapa saat.');
        return;
      }

      const normalized = normalizeStrategyPlan(data.strategy);
      const cacheInfo = {
        cacheHit: Boolean(data.cacheHit),
        createdAt: data.createdAt as string | undefined,
        model: (data.model as string | null) ?? null,
      };

      setStrategy(normalized);
      setRawStrategy(data.rawStrategy ?? null);
      setShowRawStrategy(false);
      setDetailView('sections');
      setCacheMeta(cacheInfo);
      setModelName(cacheInfo.model ?? null);
      setStoredSnapshot(latestSnapshot ?? null);
      setFormState(resolvedForm);
      setFormTouched(true);

      persistStrategyData({
        strategy: normalized,
        rawStrategy: data.rawStrategy ?? null,
        financialSnapshot: latestSnapshot ?? null,
        formState: resolvedForm,
        cacheMeta: cacheInfo,
        model: cacheInfo.model,
        generatedAt: new Date().toISOString(),
      });
      setForceRefresh(false);

      toast.success(
        cacheInfo.cacheHit
          ? 'Strategi dimuat dari cache terbaru.'
          : 'Strategi bisnis berhasil dihasilkan!',
      );
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast.error('Terjadi kesalahan saat menghasilkan strategi');
    } finally {
      setLoading(false);
    }
  };

  const cacheLabel = useMemo(() => {
    if (!cacheMeta) return null;
    const timestamp = cacheMeta.createdAt
      ? new Date(cacheMeta.createdAt).toLocaleString('id-ID')
      : null;
    return cacheMeta.cacheHit
      ? `Cache terbaru${timestamp ? ` • ${timestamp}` : ''}`
      : `Analisis dibuat${timestamp ? ` • ${timestamp}` : ''}`;
  }, [cacheMeta]);

  const summaryToDisplay = storedSnapshot ?? snapshot ?? null;

  return (
    <AppShell
      title="AI Strategi Bisnis"
      subtitle="Dapatkan rekomendasi strategi berdasarkan analisis data usaha Anda"
    >
      <div className="flex min-w-0 flex-col gap-6">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Generator Strategi AI</CardTitle>
              <CardDescription>
                Analisis mendalam laporan keuangan Anda untuk menghasilkan strategi bisnis yang praktis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-background/50 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium">Yang perlu Anda siapkan:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Profil singkat usaha & keunggulan utama</li>
                <li>Ringkasan angka keuangan terbaru (omzet, biaya, margin)</li>
                <li>Tujuan strategis dan kendala utama 1-3 bulan ke depan</li>
              </ul>
            </div>

            {snapshotError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ringkasan keuangan gagal dimuat</AlertTitle>
                <AlertDescription>
                  {snapshotError}. Anda masih bisa mengisi angka secara manual di formulir di bawah.
                </AlertDescription>
              </Alert>
            )}

            {!strategy && (
              <Alert className="border-accent/40 bg-accent/10 text-accent-foreground">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lengkapi ringkasan sebelum menjalankan AI</AlertTitle>
                <AlertDescription>
                  Isi formulir konteks bisnis agar rekomendasi lebih relevan. Anda dapat menyesuaikan angka sebelum
                  menekan tombol &quot;Hasilkan Strategi Bisnis&quot;.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <Switch
                  checked={forceRefresh}
                  onCheckedChange={(checked) => setForceRefresh(checked)}
                  disabled={loading}
                  id="force-refresh"
                />
                <label htmlFor="force-refresh" className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Paksa analisis ulang</p>
                  <p className="text-xs text-muted-foreground">
                    Aktifkan untuk mengabaikan cache AI dan menjalankan analisis terbaru.
                  </p>
                </label>
              </div>
              {cacheLabel && (
                <div className="flex flex-col items-start gap-1 md:items-end">
                  <Badge variant={cacheMeta?.cacheHit ? 'secondary' : 'outline'} className="w-auto">
                    {cacheLabel}
                  </Badge>
                  {modelName && (
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Model: {modelName}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 md:flex-row">
              <Button
                onClick={generateStrategy}
                disabled={loading}
                size="lg"
                className="w-full md:flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Menghubungi AI Strategi...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Hasilkan Strategi Bisnis
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading || (!strategy && !planVersion)}
                onClick={clearStoredStrategy}
                className="w-full md:w-auto md:flex-none"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Bersihkan Strategi Tersimpan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <StrategyInputForm
        value={formState}
        onChange={(next) => {
          setFormState(next);
          setFormTouched(true);
        }}
        disabled={loading}
        onTouch={() => setFormTouched(true)}
      />

      {strategy && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analisis Kondisi Bisnis</CardTitle>
              <CardDescription>Ringkasan AI berdasarkan data terbaru Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {strategy.analysis.summary}
              </p>
              {strategy.analysis.key_metrics.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2">
                  {strategy.analysis.key_metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-lg border bg-muted/30 p-3 text-sm"
                    >
                      <p className="text-muted-foreground">{metric.label}</p>
                      <p className="text-lg font-semibold text-foreground mt-1">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Strategi Peningkatan Omzet</CardTitle>
                <CardDescription>Prioritaskan 3 langkah berikut untuk menaikkan penjualan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {strategy.revenue_strategies.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    AI belum menghasilkan strategi peningkatan omzet. Coba ulangi analisis saat data transaksi sudah lebih lengkap.
                  </p>
                )}
                {strategy.revenue_strategies.map((item) => (
                  <div key={item.id} className="rounded-lg border bg-background p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                      {item.expected_impact && (
                        <Badge variant="outline" className="text-xs">
                          Dampak: {item.expected_impact}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimasi Biaya Operasional</CardTitle>
                <CardDescription>Efisiensi yang disarankan AI untuk menjaga margin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {strategy.cost_strategies.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada rekomendasi efisiensi biaya untuk saat ini.
                  </p>
                )}
                {strategy.cost_strategies.map((item) => (
                  <div key={item.id} className="rounded-lg border bg-background p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                      {item.expected_savings && (
                        <Badge variant="outline" className="text-xs">
                          Potensi hemat: {item.expected_savings}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Rencana Aksi 30 Hari</CardTitle>
                <CardDescription>Centang setiap tugas saat selesai untuk memantau progres</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetTaskProgress} disabled={!planVersion}>
                Reset progres
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {strategy.action_plan.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Rencana aksi belum tersedia. Coba ulangi analisis untuk mendapatkan checklist mingguan.
                </p>
              )}
              {strategy.action_plan.map((step) => (
                <div key={step.id} className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                      {step.summary && (
                        <p className="text-sm text-muted-foreground mt-1">{step.summary}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{step.timeframe}</Badge>
                  </div>
                  <div className="mt-3 space-y-3">
                    {step.tasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex items-start gap-3 rounded-lg border bg-background px-3 py-2 text-sm"
                      >
                        <Checkbox
                          checked={!!taskProgress[task.id]}
                          onCheckedChange={(checked) => handleTaskToggle(task.id, checked === true)}
                        />
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{task.title}</p>
                          {(task.owner || task.metric) && (
                            <p className="text-xs text-muted-foreground">
                              {task.owner && <span>Penanggung jawab: {task.owner}. </span>}
                              {task.metric && <span>Ukuran keberhasilan: {task.metric}</span>}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {strategy.targets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Target & Proyeksi 90 Hari</CardTitle>
                <CardDescription>Patokan utama yang perlu dicapai atau diwaspadai</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {strategy.targets.map((target) => (
                  <div key={target.label} className="rounded-lg border bg-muted/20 p-3 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {target.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {target.value}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {rawStrategy && (
        <Section
          title="Detail Strategi Lengkap"
          description="Lihat output asli yang dihasilkan AI untuk referensi lengkap."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawStrategy((prev) => !prev)}
              className="focus-visible:ring-brand"
            >
              {showRawStrategy ? 'Tutup Detail' : 'Detail Markdown'}
            </Button>
          }
        >
          {showRawStrategy && (
            <Tabs
              value={detailView}
              onValueChange={(value) => {
                if (value) {
                  setDetailView(value as 'sections' | 'raw');
                }
              }}
              className="space-y-4"
            >
              <TabsList className="flex w-full gap-2 rounded-2xl bg-muted/30 p-1">
                <TabsTrigger
                  value="sections"
                  className="flex-1 rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  Format Bagian
                </TabsTrigger>
                <TabsTrigger
                  value="raw"
                  className="flex-1 rounded-xl text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  Markdown Mentah
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sections" className="space-y-3 focus-visible:outline-none">
                {markdownSections.length > 0 ? (
                  <Accordion type="multiple" className="space-y-2">
                    {markdownSections.map((section) => (
                      <AccordionItem
                        key={section.id}
                        value={section.id}
                        className="overflow-hidden rounded-2xl border border-border/60 bg-background"
                      >
                        <AccordionTrigger className="px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="prose prose-sm max-w-none text-muted-foreground [&_strong]:text-foreground">
                            <ReactMarkdown>{section.content}</ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                    Markdown tidak memiliki heading. Gunakan tampilan mentah untuk referensi lengkap.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="raw" className="focus-visible:outline-none">
                <div className="rounded-2xl border border-muted-foreground/20 bg-muted/20 p-4 text-left text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {rawStrategy}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </Section>
      )}

      {summaryToDisplay && (
        <Section title="Ringkasan Keuangan Terkini">
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status UMKM</p>
              <p className="text-sm font-semibold text-foreground">
                {summaryToDisplay.umkmLevel.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Profit Margin</p>
              <p className="text-sm font-semibold text-foreground">
                {summaryToDisplay.yearToDate.profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Transaksi</p>
              <p className="text-sm font-semibold text-foreground">
                {summaryToDisplay.yearToDate.transactionCount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Top Kategori Pemasukan
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {summaryToDisplay.topIncomeCategories.slice(0, 3).map((item) => (
                  <li key={item.category} className="flex items-center justify-between gap-3">
                    <span>{item.category}</span>
                    <span className="font-medium text-foreground">{item.percentage}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Top Kategori Pengeluaran
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {summaryToDisplay.topExpenseCategories.slice(0, 3).map((item) => (
                  <li key={item.category} className="flex items-center justify-between gap-3">
                    <span>{item.category}</span>
                    <span className="font-medium text-foreground">{item.percentage}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      )}
      </div>
    </AppShell>
  );
};

export default AIStrategy;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFinancialSnapshot = (value: unknown): value is StrategyFinancialSnapshot => {
  if (!isRecord(value)) return false;
  if (typeof value.umkmLevel !== 'string') return false;
  if (typeof value.annualRevenue !== 'number') return false;
  if (!isRecord(value.yearToDate)) return false;
  const { totalIncome, totalExpense, netProfit, profitMargin, transactionCount } = value.yearToDate;
  const numericChecks = [
    totalIncome,
    totalExpense,
    netProfit,
    profitMargin,
    transactionCount,
  ].every((item) => typeof item === 'number' && Number.isFinite(item));
  if (!numericChecks) return false;
  if (!Array.isArray(value.topIncomeCategories) || !Array.isArray(value.topExpenseCategories)) {
    return false;
  }
  return Array.isArray(value.monthlyTrends);
};
