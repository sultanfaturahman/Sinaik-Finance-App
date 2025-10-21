import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/formatCurrency';
import { UMKM_RULES, classifyUMKM, getNextLevel } from '@/constants/umkmRules';
import { TrendingUp, Target, Award } from 'lucide-react';

const Status = () => {
  const { user } = useAuth();
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      if (!user) return;

      // Calculate annual revenue from transactions
      const currentYear = new Date().getFullYear();
      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', user.id)
        .gte('date', `${currentYear}-01-01`)
        .lte('date', `${currentYear}-12-31`);

      if (transactions) {
        const income = transactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        setAnnualRevenue(income);

        // Update UMKM status in database
        const classification = classifyUMKM(income);
        await supabase
          .from('umkm_status')
          .upsert({
            user_id: user.id,
            level: classification.level,
            annual_revenue: income,
          });
      }

      setLoading(false);
    };

    fetchRevenue();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const currentClassification = classifyUMKM(annualRevenue);
  const nextLevel = getNextLevel(currentClassification.level);
  const progressPercentage = nextLevel
    ? ((annualRevenue - currentClassification.minRevenue) /
        (nextLevel.minRevenue - currentClassification.minRevenue)) *
      100
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Status UMKM</h1>
        <p className="text-muted-foreground mt-1">Klasifikasi bisnis Anda saat ini</p>
      </div>

      <Card className="border-2" style={{ borderColor: currentClassification.color }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${currentClassification.color}15` }}
            >
              <Award className="h-6 w-6" style={{ color: currentClassification.color }} />
            </div>
            <div>
              <CardTitle className="text-2xl">{currentClassification.label}</CardTitle>
              <CardDescription>{currentClassification.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Omzet Tahunan</span>
              <span className="text-sm font-bold" style={{ color: currentClassification.color }}>
                {formatCurrency(annualRevenue)}
              </span>
            </div>
            {nextLevel && (
              <>
                <Progress value={progressPercentage} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(currentClassification.minRevenue)}</span>
                  <span>{formatCurrency(nextLevel.minRevenue)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {nextLevel && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Target Selanjutnya</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tingkatkan omzet Anda untuk mencapai level <strong>{nextLevel.label}</strong>
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Target omzet minimum:</span>
                <span className="font-bold">{formatCurrency(nextLevel.minRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Selisih dari target:</span>
                <span className="font-bold text-primary">
                  {formatCurrency(nextLevel.minRevenue - annualRevenue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Semua Level UMKM</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {UMKM_RULES.map((rule) => (
              <div
                key={rule.level}
                className={`p-4 rounded-lg border-2 transition-all ${
                  rule.level === currentClassification.level
                    ? 'bg-primary/5'
                    : 'bg-muted/30'
                }`}
                style={{
                  borderColor:
                    rule.level === currentClassification.level ? rule.color : 'transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold" style={{ color: rule.color }}>
                      {rule.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  {rule.level === currentClassification.level && (
                    <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      Level Saat Ini
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Status;
