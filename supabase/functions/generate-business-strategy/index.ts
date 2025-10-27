import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sanitizeJsonContent = (content: string) => {
  const trimmed = content.trim();
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    return lines.slice(1, lines[lines.length - 1].startsWith("```") ? -1 : undefined).join("\n");
  }
  return trimmed;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error("Unauthorized");
    }

    console.log("Fetching financial data for user:", user.id);

    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("type, amount, category, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (txError) {
      console.error("Error fetching transactions:", txError);
      throw txError;
    }

    const { data: umkmStatus, error: statusError } = await supabase
      .from("umkm_status")
      .select("level, annual_revenue")
      .eq("user_id", user.id)
      .single();

    if (statusError) {
      console.error("Error fetching UMKM status:", statusError);
    }

    const currentYear = new Date().getFullYear();
    const yearTransactions =
      transactions?.filter((t) => new Date(t.date).getFullYear() === currentYear) ?? [];

    const totalIncome = yearTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = yearTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    const expensesByCategory = yearTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const incomeByCategory = yearTransactions
      .filter((t) => t.type === "income")
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
        percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : "0",
      }));

    const topIncome = Object.entries(incomeByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : "0",
      }));

    const monthlyData: Array<{
      month: string;
      income: number;
      expense: number;
      profit: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const monthTx =
        transactions?.filter((t) => {
          const txDate = new Date(t.date);
          return txDate.getFullYear() === date.getFullYear() && txDate.getMonth() === date.getMonth();
        }) ?? [];

      const monthIncome = monthTx
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthExpense = monthTx
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      monthlyData.push({
        month: new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date),
        income: monthIncome,
        expense: monthExpense,
        profit: monthIncome - monthExpense,
      });
    }

    const financialSummary = {
      umkmLevel: umkmStatus?.level || "ultra_mikro",
      annualRevenue: umkmStatus?.annual_revenue || 0,
      yearToDate: {
        totalIncome,
        totalExpense,
        netProfit,
        profitMargin: profitMargin.toFixed(2),
        transactionCount: yearTransactions.length,
      },
      topExpenseCategories: topExpenses,
      topIncomeCategories: topIncome,
      monthlyTrends: monthlyData,
    };

    console.log("Financial summary prepared:", financialSummary);

    const systemPrompt = `Anda adalah konsultan bisnis UMKM di Indonesia. Jawablah dalam Bahasa Indonesia dengan fokus pada langkah praktis.

Berikan HANYA JSON valid tanpa teks tambahan menggunakan struktur berikut:
{
  "analysis": {
    "summary": "Ringkasan kondisi keuangan (2-3 kalimat)",
    "key_metrics": [
      { "label": "Profit Margin YTD", "value": "15%" },
      { "label": "Tren Penjualan", "value": "Naik 12% vs bulan lalu" }
    ]
  },
  "revenue_strategies": [
    {
      "id": "rev-1",
      "title": "Nama strategi peningkatan omzet",
      "description": "Penjelasan singkat + langkah utama",
      "expected_impact": "Perkiraan dampak (Rp atau %)"
    }
  ],
  "cost_strategies": [
    {
      "id": "cost-1",
      "title": "Nama strategi efisiensi biaya",
      "description": "Penjelasan singkat + langkah utama",
      "expected_savings": "Estimasi penghematan"
    }
  ],
  "action_plan": [
    {
      "id": "week-1",
      "title": "Fokus Minggu 1",
      "timeframe": "Minggu 1",
      "summary": "Tujuan utama minggu ini",
      "tasks": [
        { "id": "week-1-task-1", "title": "Nama tugas spesifik", "owner": "Penanggung jawab", "metric": "Cara mengukur keberhasilan" }
      ]
    }
  ],
  "targets": [
    { "label": "Target 3 Bulan", "value": "Ringkasan target" },
    { "label": "Peringatan Dini", "value": "Sinyal yang harus dipantau" }
  ]
}

Ketentuan:
- Minimal 3 item pada setiap array revenue_strategies dan cost_strategies.
- Action_plan wajib mencakup minggu 1 sampai 4 dengan minimal 3 tugas unik per minggu.
- Semua "id" harus huruf kecil dengan tanda hubung (kebab-case) agar mudah disimpan.
- Gunakan format Rupiah seperti "Rp 12.500.000" atau persen seperti "12%" saat relevan.`;

    const userPrompt = `Berikut adalah data keuangan UMKM:

Status: ${financialSummary.umkmLevel}
Omzet Tahunan: Rp ${financialSummary.annualRevenue.toLocaleString("id-ID")}

Data Tahun Berjalan (${currentYear}):
- Total Pemasukan: Rp ${financialSummary.yearToDate.totalIncome.toLocaleString("id-ID")}
- Total Pengeluaran: Rp ${financialSummary.yearToDate.totalExpense.toLocaleString("id-ID")}
- Laba Bersih: Rp ${financialSummary.yearToDate.netProfit.toLocaleString("id-ID")}
- Profit Margin: ${financialSummary.yearToDate.profitMargin}%
- Jumlah Transaksi: ${financialSummary.yearToDate.transactionCount}

Kategori Pengeluaran Tertinggi:
${topExpenses
  .map(
    (e, i) =>
      `${i + 1}. ${e.category}: Rp ${e.amount.toLocaleString("id-ID")} (${e.percentage}%)`,
  )
  .join("\n")}

Kategori Pemasukan Tertinggi:
${topIncome
  .map(
    (e, i) =>
      `${i + 1}. ${e.category}: Rp ${e.amount.toLocaleString("id-ID")} (${e.percentage}%)`,
  )
  .join("\n")}

Tren 6 Bulan Terakhir:
${monthlyData
  .map(
    (m) =>
      `- ${m.month}: Pemasukan Rp ${m.income.toLocaleString("id-ID")}, Pengeluaran Rp ${m.expense.toLocaleString("id-ID")}, Laba Rp ${m.profit.toLocaleString("id-ID")}`,
  )
  .join("\n")}

Berikan strategi bisnis yang komprehensif dan actionable untuk meningkatkan performa UMKM ini.`;

    console.log("Calling Lovable AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit tercapai. Silakan coba lagi dalam beberapa saat." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kredit AI habis. Silakan tambah kredit di workspace Lovable Anda." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw new Error("AI Gateway error");
    }

    const aiData = await aiResponse.json();
    const strategyContent = aiData?.choices?.[0]?.message?.content;

    if (!strategyContent) {
      throw new Error("AI response missing content");
    }

    let strategy;
    try {
      strategy = JSON.parse(sanitizeJsonContent(strategyContent));
    } catch (error) {
      console.error("Failed to parse strategy JSON", error, strategyContent);
      throw new Error("Strategi AI tidak valid, coba ulangi beberapa saat lagi.");
    }

    console.log("Strategy generated successfully");

    return new Response(
      JSON.stringify({
        strategy,
        rawStrategy: strategyContent,
        financialSummary,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in generate-business-strategy:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

