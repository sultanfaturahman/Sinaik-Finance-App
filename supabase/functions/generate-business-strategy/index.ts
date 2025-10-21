import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Fetching financial data for user:', user.id);

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('type, amount, category, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (txError) {
      console.error('Error fetching transactions:', txError);
      throw txError;
    }

    // Fetch UMKM status
    const { data: umkmStatus, error: statusError } = await supabase
      .from('umkm_status')
      .select('level, annual_revenue')
      .eq('user_id', user.id)
      .single();

    if (statusError) {
      console.error('Error fetching UMKM status:', statusError);
    }

    // Calculate financial metrics
    const currentYear = new Date().getFullYear();
    const yearTransactions = transactions?.filter(t => 
      new Date(t.date).getFullYear() === currentYear
    ) || [];

    const totalIncome = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Group expenses by category
    const expensesByCategory = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    // Group income by category
    const incomeByCategory = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const topExpenses = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: ((amount / totalExpense) * 100).toFixed(1)
      }));

    const topIncome = Object.entries(incomeByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: ((amount / totalIncome) * 100).toFixed(1)
      }));

    // Calculate monthly trends (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthTx = transactions?.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getFullYear() === date.getFullYear() && 
               txDate.getMonth() === date.getMonth();
      }) || [];

      const monthIncome = monthTx
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const monthExpense = monthTx
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      monthlyData.push({
        month: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date),
        income: monthIncome,
        expense: monthExpense,
        profit: monthIncome - monthExpense
      });
    }

    // Prepare financial summary for AI
    const financialSummary = {
      umkmLevel: umkmStatus?.level || 'ultra_mikro',
      annualRevenue: umkmStatus?.annual_revenue || 0,
      yearToDate: {
        totalIncome,
        totalExpense,
        netProfit,
        profitMargin: profitMargin.toFixed(2),
        transactionCount: yearTransactions.length
      },
      topExpenseCategories: topExpenses,
      topIncomeCategories: topIncome,
      monthlyTrends: monthlyData
    };

    console.log('Financial summary prepared:', financialSummary);

    // Create AI prompt
    const systemPrompt = `Anda adalah konsultan bisnis UMKM yang berpengalaman di Indonesia. 
Tugas Anda adalah menganalisis laporan keuangan dan memberikan strategi bisnis yang praktis dan actionable.

Format respons Anda HARUS menggunakan struktur berikut:

## 📊 Analisis Kondisi Bisnis

[Berikan analisis singkat kondisi keuangan saat ini, termasuk profit margin, tren pendapatan, dan pengeluaran]

## 💡 Strategi Peningkatan Omzet

[Berikan 3-4 strategi spesifik untuk meningkatkan pendapatan]

## 💰 Optimasi Biaya Operasional

[Berikan 3-4 rekomendasi untuk mengoptimalkan pengeluaran]

## 🎯 Rencana Aksi 30 Hari

[Berikan action plan konkret yang bisa dilakukan dalam 30 hari ke depan]

## 📈 Target & Proyeksi

[Berikan target realistis untuk 3 bulan ke depan berdasarkan data yang ada]

Gunakan bahasa Indonesia yang mudah dipahami. Berikan angka-angka spesifik dalam format Rupiah. Fokus pada strategi yang praktis dan bisa langsung diterapkan oleh UMKM kecil.`;

    const userPrompt = `Berikut adalah data keuangan UMKM:

**Status UMKM**: ${financialSummary.umkmLevel}
**Omzet Tahunan**: Rp ${financialSummary.annualRevenue.toLocaleString('id-ID')}

**Data Tahun Berjalan (${currentYear})**:
- Total Pemasukan: Rp ${financialSummary.yearToDate.totalIncome.toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${financialSummary.yearToDate.totalExpense.toLocaleString('id-ID')}
- Laba Bersih: Rp ${financialSummary.yearToDate.netProfit.toLocaleString('id-ID')}
- Profit Margin: ${financialSummary.yearToDate.profitMargin}%
- Jumlah Transaksi: ${financialSummary.yearToDate.transactionCount}

**Kategori Pengeluaran Tertinggi**:
${topExpenses.map((e, i) => `${i + 1}. ${e.category}: Rp ${e.amount.toLocaleString('id-ID')} (${e.percentage}%)`).join('\n')}

**Kategori Pemasukan Tertinggi**:
${topIncome.map((e, i) => `${i + 1}. ${e.category}: Rp ${e.amount.toLocaleString('id-ID')} (${e.percentage}%)`).join('\n')}

**Tren 6 Bulan Terakhir**:
${monthlyData.map(m => `- ${m.month}: Pemasukan Rp ${m.income.toLocaleString('id-ID')}, Pengeluaran Rp ${m.expense.toLocaleString('id-ID')}, Laba Rp ${m.profit.toLocaleString('id-ID')}`).join('\n')}

Berikan strategi bisnis yang komprehensif dan actionable untuk meningkatkan performa UMKM ini.`;

    // Call Lovable AI
    console.log('Calling Lovable AI...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit tercapai. Silakan coba lagi dalam beberapa saat.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Kredit AI habis. Silakan tambah kredit di workspace Lovable Anda.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI Gateway error');
    }

    const aiData = await aiResponse.json();
    const strategy = aiData.choices[0].message.content;

    console.log('Strategy generated successfully');

    return new Response(
      JSON.stringify({ 
        strategy,
        financialSummary 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-business-strategy:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
