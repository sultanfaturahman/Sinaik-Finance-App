import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const AIStrategy = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [financialSummary, setFinancialSummary] = useState<any>(null);

  const generateStrategy = async () => {
    if (!user) return;

    setLoading(true);
    setStrategy(null);

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

      setStrategy(data.strategy);
      setFinancialSummary(data.financialSummary);
      toast.success('Strategi bisnis berhasil dihasilkan!');

    } catch (error) {
      console.error('Error generating strategy:', error);
      toast.error('Terjadi kesalahan saat menghasilkan strategi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Strategi Bisnis</h1>
        <p className="text-muted-foreground mt-1">
          Dapatkan rekomendasi strategi bisnis berdasarkan analisis AI
        </p>
      </div>

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

            <Button
              onClick={generateStrategy}
              disabled={loading}
              size="lg"
              className="w-full"
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
          </div>
        </CardContent>
      </Card>

      {strategy && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Analisis & Strategi</CardTitle>
            <CardDescription>
              Rekomendasi yang dihasilkan berdasarkan data keuangan Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold text-foreground mt-6 mb-3 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-muted-foreground mb-3 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="ml-4">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                }}
              >
                {strategy}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {financialSummary && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">Data yang Dianalisis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status UMKM:</span>
                <span className="font-medium">{financialSummary.umkmLevel.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit Margin:</span>
                <span className="font-medium">{financialSummary.yearToDate.profitMargin}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Transaksi:</span>
                <span className="font-medium">{financialSummary.yearToDate.transactionCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIStrategy;
