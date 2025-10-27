import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/app/AppShell';
import { Section } from '@/components/ui/Section';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StrategyMetric {
  label: string;
  value: string;
}

interface StrategyItem {
  id: string;
  title: string;
  description: string;
  expected_impact?: string;
  expected_savings?: string;
}

interface StrategyTask {
  id: string;
  title: string;
  owner?: string;
  metric?: string;
}

interface StrategyStep {
  id: string;
  title: string;
  timeframe: string;
  summary: string;
  tasks: StrategyTask[];
}

interface StrategyPlan {
  analysis: {
    summary: string;
    key_metrics: StrategyMetric[];
  };
  revenue_strategies: StrategyItem[];
  cost_strategies: StrategyItem[];
  action_plan: StrategyStep[];
  targets: { label: string; value: string }[];
}

interface FinancialSummary {
  umkmLevel: string;
  yearToDate: {
    profitMargin: number;
    transactionCount: number;
    [key: string]: number;
  };
  [key: string]: unknown;
}

const STORAGE_PREFIX = 'sinaik:strategy-tracker';
const STRATEGY_DATA_PREFIX = 'sinaik:strategy-data';

const toString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const ensureArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

interface RawStrategyMetric {
  label?: string;
  value?: string;
}

interface RawStrategyItem {
  id?: string;
  title?: string;
  description?: string;
  expected_impact?: string;
  expected_savings?: string;
}

interface RawStrategyTask {
  id?: string;
  title?: string;
  owner?: string;
  metric?: string;
}

interface RawStrategyStep {
  id?: string;
  title?: string;
  timeframe?: string;
  summary?: string;
  tasks?: RawStrategyTask[];
}

interface RawStrategyPlan {
  analysis?: {
    summary?: string;
    key_metrics?: RawStrategyMetric[];
  };
  revenue_strategies?: RawStrategyItem[];
  cost_strategies?: RawStrategyItem[];
  action_plan?: RawStrategyStep[];
  targets?: Array<{ label?: string; value?: string }>;
}

interface RawTarget {
  label?: string;
  value?: string;
}

const normalizePlan = (raw: RawStrategyPlan | null | undefined): StrategyPlan => {
  const analysis = raw?.analysis ?? {};
  const keyMetrics = ensureArray<RawStrategyMetric>(analysis?.key_metrics).map((metric) => ({
    label: toString(metric?.label) || 'Metric',
    value: toString(metric?.value) || '-',
  }));

  let revenueStrategies = ensureArray<RawStrategyItem>(raw?.revenue_strategies).map(
    (item, index) => ({
      id: toString(item?.id) || `rev-${index + 1}`,
      title: toString(item?.title) || `Strategi ${index + 1}`,
      description: toString(item?.description) || '',
      expected_impact: toString(item?.expected_impact) || undefined,
    })
  );

  let costStrategies = ensureArray<RawStrategyItem>(raw?.cost_strategies).map(
    (item, index) => ({
      id: toString(item?.id) || `cost-${index + 1}`,
      title: toString(item?.title) || `Efisiensi ${index + 1}`,
      description: toString(item?.description) || '',
      expected_savings: toString(item?.expected_savings) || undefined,
    })
  );

  let actionPlan = ensureArray<RawStrategyStep>(raw?.action_plan).map((step, stepIndex) => {
    const stepId = toString(step?.id) || `week-${stepIndex + 1}`;

    const tasks = ensureArray<RawStrategyTask>(step?.tasks).map((task, taskIndex) => ({
      id: toString(task?.id) || `${stepId}-task-${taskIndex + 1}`,
      title: toString(task?.title) || `Tugas ${taskIndex + 1}`,
      owner: toString(task?.owner) || undefined,
      metric: toString(task?.metric) || undefined,
    }));

    return {
      id: stepId,
      title: toString(step?.title) || `Minggu ${stepIndex + 1}`,
      timeframe: toString(step?.timeframe) || `Minggu ${stepIndex + 1}`,
      summary: toString(step?.summary) || '',
      tasks,
    };
  });

  let targets = ensureArray<RawTarget>(raw?.targets).map((target, index) => ({
    label: toString(target?.label) || `Target ${index + 1}`,
    value: toString(target?.value) || '-',
  }));

  actionPlan = actionPlan.map((step, index) => {
    const safeId = step.id || `week-${index + 1}`;
    return {
      id: safeId,
      title: step.title || `Minggu ${index + 1}`,
      timeframe: step.timeframe || `Minggu ${index + 1}`,
      summary: step.summary || '',
      tasks: ensureArray<RawStrategyTask>(step.tasks).map((task, taskIndex) => ({
        id: toString(task?.id) || `${safeId}-task-${taskIndex + 1}`,
        title: toString(task?.title) || `Tugas ${taskIndex + 1}`,
        owner: toString(task?.owner) || undefined,
        metric: toString(task?.metric) || undefined,
      })),
    };
  });

  return {
    analysis: {
      summary: toString(analysis?.summary) || 'AI berhasil menghasilkan strategi, namun ringkasan tidak tersedia.',
      key_metrics: keyMetrics,
    },
    revenue_strategies: revenueStrategies,
    cost_strategies: costStrategies,
    action_plan: actionPlan,
    targets,
  };
};

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
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [taskProgress, setTaskProgress] = useState<Record<string, boolean>>({});
  const [planVersion, setPlanVersion] = useState('');
  const [detailView, setDetailView] = useState<'sections' | 'raw'>('sections');
  const markdownSections = useMemo(
    () => (rawStrategy ? parseMarkdownSections(rawStrategy) : []),
    [rawStrategy]
  );

  const persistStrategyData = (
    data: {
      strategy: StrategyPlan;
      rawStrategy: string | null;
      financialSummary: FinancialSummary | null;
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
      setFinancialSummary(null);
      setPlanVersion('');
      setTaskProgress({});
      setShowRawStrategy(false);
      setDetailView('sections');
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
        financialSummary?: unknown;
        planVersion?: string;
      };

      if (parsed?.strategy) {
        setStrategy(parsed.strategy);
        setRawStrategy(parsed.rawStrategy ?? null);
        setFinancialSummary(isFinancialSummary(parsed.financialSummary) ? parsed.financialSummary : null);
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
    setFinancialSummary(null);
    setPlanVersion('');
    setTaskProgress({});
    setShowRawStrategy(false);
    setDetailView('sections');
    toast.success('Strategi tersimpan dibersihkan. Silakan jalankan analisis ulang.');
  };

  const generateStrategy = async () => {
    if (!user) return;

    setLoading(true);
    setShowRawStrategy(false);
    setDetailView('sections');

    try {
      const { data, error } = await supabase.functions.invoke('generate-business-strategy', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error invoking function:', error);
        
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast.error('Rate limit tercapai. Silakan coba lagi dalam beberapa saat.');
        } else if (error.message?.includes('402') || error.message?.includes('kredit')) {
          toast.error('Kredit AI habis. Silakan tambah kredit di workspace Lovable Anda.');
        } else {
          toast.error('Gagal menghasilkan strategi: ' + error.message);
        }
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (!data.strategy) {
        toast.error('Strategi tidak tersedia dari AI. Coba lagi dalam beberapa saat.');
        return;
      }

      const normalized = normalizePlan(data.strategy);

      const summary = isFinancialSummary(data.financialSummary) ? data.financialSummary : null;

      setStrategy(normalized);
      setRawStrategy(data.rawStrategy ?? null);
      setShowRawStrategy(false);
      setDetailView('sections');
      setFinancialSummary(summary);
      persistStrategyData({
        strategy: normalized,
        rawStrategy: data.rawStrategy ?? null,
        financialSummary: summary,
        generatedAt: new Date().toISOString(),
      });
      toast.success('Strategi bisnis berhasil dihasilkan!');

    } catch (error) {
      console.error('Error generating strategy:', error);
      toast.error('Terjadi kesalahan saat menghasilkan strategi');
    } finally {
      setLoading(false);
    }
  };

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
              <p className="font-medium">Yang akan dianalisis:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Status dan klasifikasi UMKM Anda</li>
                <li>Tren pendapatan dan pengeluaran 6 bulan terakhir</li>
                <li>Kategori pemasukan dan pengeluaran tertinggi</li>
                <li>Profit margin dan efisiensi operasional</li>
              </ul>
            </div>

              {!strategy && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-accent">Catatan Penting</p>
                    <p className="text-muted-foreground mt-1">
                      Pastikan Anda sudah memiliki data transaksi yang cukup untuk mendapatkan analisis yang akurat.
                      AI akan menganalisis semua transaksi Anda tahun ini.
                    </p>
                  </div>
                </div>
              )}

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
                      Menganalisis Data Keuangan...
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

      {financialSummary && (
        <Section title="Data yang Dianalisis">
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status UMKM</p>
              <p className="text-sm font-semibold text-foreground">
                {financialSummary.umkmLevel.replace("_", " ").toUpperCase()}
              </p>
            </div>
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Profit Margin</p>
              <p className="text-sm font-semibold text-foreground">
                {financialSummary.yearToDate.profitMargin}%
              </p>
            </div>
            <div className="rounded-2xl border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Transaksi</p>
              <p className="text-sm font-semibold text-foreground">
                {financialSummary.yearToDate.transactionCount}
              </p>
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

const isFinancialSummary = (value: unknown): value is FinancialSummary => {
  if (!isRecord(value)) return false;
  if (typeof value.umkmLevel !== 'string') return false;
  if (!isRecord(value.yearToDate)) return false;
  const { profitMargin, transactionCount } = value.yearToDate;
  return typeof profitMargin === 'number' && typeof transactionCount === 'number';
};
