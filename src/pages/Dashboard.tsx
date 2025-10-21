import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatCurrency';
import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  transactionCount: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id);

      if (transactions) {
        const income = transactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const expense = transactions
          .filter((t) => t.type === 'expense')
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

  const statCards = [
    {
      title: 'Total Pemasukan',
      value: stats.totalIncome,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Pengeluaran',
      value: stats.totalExpense,
      icon: TrendingDown,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Laba Bersih',
      value: stats.netProfit,
      icon: Wallet,
      color: stats.netProfit >= 0 ? 'text-success' : 'text-destructive',
      bgColor: stats.netProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10',
    },
    {
      title: 'Total Transaksi',
      value: stats.transactionCount,
      icon: Receipt,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      isCount: true,
    },
  ];

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
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Ringkasan keuangan bisnis Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.isCount ? stat.value : formatCurrency(stat.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selamat Datang di SiNaik!</CardTitle>
          <CardDescription>
            Sistem Informasi Naik Kelas untuk UMKM Cilegon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Mulai kelola keuangan bisnis Anda dengan mudah. Tambahkan transaksi pemasukan dan
            pengeluaran untuk melihat laporan lengkap dan status klasifikasi UMKM Anda.
          </p>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
              <p><span className="font-medium">Catat transaksi</span> - Kelola pemasukan dan pengeluaran harian</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
              <p><span className="font-medium">Lihat laporan</span> - Analisis keuangan bulanan dan tahunan</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
              <p><span className="font-medium">Cek status UMKM</span> - Pantau klasifikasi bisnis Anda</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
