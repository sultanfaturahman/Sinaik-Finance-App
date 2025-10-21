import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatCurrency';
import { FileText, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface MonthlyReport {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

const Reports = () => {
  const { user } = useAuth();
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;

      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (transactions) {
        // Group by month
        const monthlyData: { [key: string]: MonthlyReport } = {};

        transactions.forEach((t) => {
          const date = new Date(t.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: new Intl.DateTimeFormat('id-ID', {
                month: 'long',
                year: 'numeric',
              }).format(date),
              income: 0,
              expense: 0,
              profit: 0,
            };
          }

          if (t.type === 'income') {
            monthlyData[monthKey].income += Number(t.amount);
          } else {
            monthlyData[monthKey].expense += Number(t.amount);
          }
        });

        // Calculate profit
        Object.values(monthlyData).forEach((report) => {
          report.profit = report.income - report.expense;
        });

        setMonthlyReports(Object.values(monthlyData));
      }

      setLoading(false);
    };

    fetchReports();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Laporan Keuangan</h1>
        <p className="text-muted-foreground mt-1">Ringkasan bulanan dan tahunan</p>
      </div>

      {monthlyReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada data laporan.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tambahkan transaksi untuk melihat laporan keuangan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {monthlyReports.map((report, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl">{report.month}</CardTitle>
                <CardDescription>Laporan keuangan bulanan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">Pemasukan</span>
                    </div>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(report.income)}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Pengeluaran</span>
                    </div>
                    <p className="text-2xl font-bold text-destructive">
                      {formatCurrency(report.expense)}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      report.profit >= 0
                        ? 'bg-success/10 border border-success/20'
                        : 'bg-destructive/10 border border-destructive/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet
                        className={`h-4 w-4 ${
                          report.profit >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          report.profit >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        Laba Bersih
                      </span>
                    </div>
                    <p
                      className={`text-2xl font-bold ${
                        report.profit >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {formatCurrency(report.profit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
