import type {} from "./globals";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  timeframe?: string;
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
  targets: Array<{ label: string; value: string }>;
  key_focus?: string[];
  actions?: StrategyTask[];
  timeframe?: string;
  version?: string;
}

interface StrategyProfileInput {
  businessName: string;
  sector: string;
  targetMarket: string;
  teamSize: string;
  differentiator: string;
}

interface StrategyFinancialSummaryInput {
  revenueYtd: number;
  expenseYtd: number;
  netProfitYtd: number;
  profitMargin: number;
  noteworthyTrend: string;
}

interface StrategyGoalInput {
  primary: string;
  secondary: string;
  timeframe: string;
  risks: string;
}

interface StrategyRequestPayload {
  profile: StrategyProfileInput;
  financialSummary: StrategyFinancialSummaryInput;
  goals: StrategyGoalInput;
  forceRefresh?: boolean;
}

interface StrategyCacheRow {
  id: string;
  strategy: StrategyPlan;
  raw_response: string | null;
  model: string | null;
  created_at: string;
}

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

const toString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

const ensureArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value === undefined || value === null) return [];
  return [value as T];
};

const asOptionalString = (value: unknown): string | undefined => {
  const str = toString(value).trim();
  return str.length > 0 ? str : undefined;
};

const normaliseItem = (item: unknown, index: number): StrategyItem => {
  const record = (item as Record<string, unknown>) ?? {};
  return {
    id: asOptionalString(record.id) ?? `item-${index + 1}`,
    title: asOptionalString(record.title) ?? `Strategi ${index + 1}`,
    description: toString(record.description),
    expected_impact: asOptionalString(record.expected_impact),
    expected_savings: asOptionalString(record.expected_savings),
  };
};

const normaliseStep = (step: unknown, index: number): StrategyStep => {
  const record = (step as Record<string, unknown>) ?? {};
  const safeId = asOptionalString(record.id) ?? `week-${index + 1}`;
  const tasks = ensureArray<Record<string, unknown>>(record.tasks).map((task, taskIndex) => ({
    id: asOptionalString(task.id) ?? `${safeId}-task-${taskIndex + 1}`,
    title: asOptionalString(task.title) ?? `Tugas ${taskIndex + 1}`,
    owner: asOptionalString(task.owner),
    metric: asOptionalString(task.metric),
  }));

  return {
    id: safeId,
    title: asOptionalString(record.title) ?? `Minggu ${index + 1}`,
    timeframe: asOptionalString(record.timeframe) ?? `Minggu ${index + 1}`,
    summary: toString(record.summary),
    tasks,
  };
};

const normaliseTask = (task: unknown, prefix: string, index: number): StrategyTask => {
  const record = (task as Record<string, unknown>) ?? {};
  return {
    id: asOptionalString(record.id) ?? `${prefix}-${index + 1}`,
    title: asOptionalString(record.title) ?? `Tugas ${index + 1}`,
    owner: asOptionalString(record.owner),
    metric: asOptionalString(record.metric),
    timeframe: asOptionalString(record.timeframe),
  };
};

const normalizeStrategyPlan = (raw: unknown): StrategyPlan => {
  const payload = (raw as Record<string, unknown>) ?? {};
  const analysis =
    (payload.analysis as Record<string, unknown>) ??
    (typeof payload.analysisSummary === "string"
      ? { summary: payload.analysisSummary }
      : {});
  const keyFocus = ensureArray(
    payload.key_focus ?? payload.keyFocus ?? payload.focusAreas ?? [],
  )
    .map((item) => toString(item).trim())
    .filter(Boolean);
  const actionsRaw = payload.actions ?? payload.actionItems ?? payload.action_list;
  const flatActions = ensureArray(actionsRaw).map((task, index) =>
    normaliseTask(task, "action", index),
  );

  const revenueRaw =
    payload.revenue_strategies ??
    payload.revenueStrategies ??
    payload.revenue_plan ??
    payload.revenue;

  const costRaw =
    payload.cost_strategies ??
    payload.costStrategies ??
    payload.cost_plan ??
    payload.efficiency;

  const actionPlanRaw = payload.action_plan ?? payload.actionPlan ?? payload.weekly_plan;
  const targetsRaw = payload.targets ?? payload.milestones ?? payload.goals;

  return {
    analysis: {
      summary:
        toString(analysis.summary) ||
        "AI berhasil menghasilkan strategi, namun ringkasan tidak tersedia.",
      key_metrics: ensureArray<Record<string, unknown>>(
        analysis.key_metrics ?? analysis.keyMetrics ?? payload.key_metrics ?? [],
      ).map(
        (metric, index) => ({
          label: toString(metric.label, `Metric ${index + 1}`),
          value: toString(metric.value, "-"),
        }),
      ),
    },
    revenue_strategies: ensureArray(revenueRaw).map((entry, index) => {
      const item = normaliseItem(entry, index);
      if (item.id === `item-${index + 1}`) {
        item.id = `rev-${index + 1}`;
      }
      return item;
    }),
    cost_strategies: ensureArray(costRaw).map((entry, index) => {
      const item = normaliseItem(entry, index);
      if (item.id === `item-${index + 1}`) {
        item.id = `cost-${index + 1}`;
      }
      return item;
    }),
    action_plan: ensureArray(actionPlanRaw).map(normaliseStep),
    targets: ensureArray<Record<string, unknown>>(targetsRaw).map((target, index) => ({
      label: asOptionalString(target.label) ?? `Target ${index + 1}`,
      value: asOptionalString(target.value) ?? '-',
    })),
    key_focus: keyFocus.length > 0 ? keyFocus : undefined,
    actions: flatActions.length > 0 ? flatActions : undefined,
    timeframe: asOptionalString(payload.timeframe ?? payload.timeFrame),
    version: asOptionalString(payload.version ?? payload.strategyVersion),
  };
};

const hashPayload = async (payload: unknown) => {
  const encoder = new TextEncoder();
  const raw = encoder.encode(JSON.stringify(payload));
  const buffer = await crypto.subtle.digest("SHA-256", raw);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const strategyResponseSchema = {
  type: "object",
  properties: {
    analysis: {
      type: "object",
      properties: {
        summary: { type: "string" },
        key_metrics: {
          type: "array",
          minItems: 3,
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "string" },
            },
            required: ["label", "value"],
          },
        },
      },
      required: ["summary", "key_metrics"],
    },
    revenue_strategies: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          expected_impact: { type: "string" },
        },
        required: ["title", "description"],
      },
    },
    cost_strategies: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          expected_savings: { type: "string" },
        },
        required: ["title", "description"],
      },
    },
    action_plan: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          timeframe: { type: "string" },
          summary: { type: "string" },
          tasks: {
            type: "array",
            minItems: 3,
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                owner: { type: "string" },
                metric: { type: "string" },
              },
              required: ["title"],
            },
          },
        },
        required: ["title", "timeframe", "tasks"],
      },
    },
    targets: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["label", "value"],
      },
    },
    key_focus: {
      type: "array",
      items: { type: "string" },
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          owner: { type: "string" },
          metric: { type: "string" },
          timeframe: { type: "string" },
        },
        required: ["title"],
      },
    },
    timeframe: { type: "string" },
    version: { type: "string" },
  },
  required: ["analysis", "revenue_strategies", "cost_strategies", "action_plan", "targets"],
} as const;

const buildPrompts = (
  profile: StrategyProfileInput,
  financialSummary: StrategyFinancialSummaryInput,
  goals: StrategyGoalInput,
) => {
  const systemPrompt = `Anda adalah konsultan bisnis UMKM di Indonesia. Gunakan Bahasa Indonesia yang ringkas dan fokus pada langkah praktis.

Format output JSON:
{
  "analysis": { "summary": string, "key_metrics": [{ "label": string, "value": string }] },
  "revenue_strategies": [{ "id": string, "title": string, "description": string, "expected_impact": string }],
  "cost_strategies": [{ "id": string, "title": string, "description": string, "expected_savings": string }],
  "action_plan": [
    { "id": string, "title": string, "timeframe": string, "summary": string, "tasks": [{ "id": string, "title": string, "owner": string, "metric": string }] }
  ],
  "targets": [{ "label": string, "value": string }]
}

Ketentuan: minimal 3 item di revenue_strategies & cost_strategies; action_plan wajib memuat minggu 1 s.d. 4 dengan ≥3 tugas per minggu; gunakan format Rupiah/persen.`;

  const userPrompt = `Profil usaha:
- Nama: ${profile.businessName || "Tidak diisi"}
- Sektor: ${profile.sector || "Tidak diisi"}
- Target pelanggan: ${profile.targetMarket || "Tidak diisi"}
- Tim: ${profile.teamSize || "Tidak diisi"}
- Keunggulan: ${profile.differentiator || "Tidak diisi"}

Ringkasan finansial tahun berjalan:
- Total pemasukan: Rp ${financialSummary.revenueYtd.toLocaleString("id-ID")}
- Total pengeluaran: Rp ${financialSummary.expenseYtd.toLocaleString("id-ID")}
- Laba bersih: Rp ${financialSummary.netProfitYtd.toLocaleString("id-ID")}
- Profit margin: ${financialSummary.profitMargin.toFixed(1)}%
- Catatan trend: ${financialSummary.noteworthyTrend || "-"}

Tujuan strategis:
- Tujuan utama: ${goals.primary || "-"}
- Prioritas pendukung: ${goals.secondary || "-"}
- Target waktu: ${goals.timeframe || "-"}
- Risiko / kendala: ${goals.risks || "-"}

Berikan strategi JSON sesuai format di atas untuk membantu UMKM mencapai target.`;

  return { systemPrompt, userPrompt };
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const geminiModel = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

    if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
      throw new Error(
        "Environment variables SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan GEMINI_API_KEY wajib diset",
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: StrategyRequestPayload;
    try {
      payload = (await req.json()) as StrategyRequestPayload;
    } catch (_err) {
      return new Response(JSON.stringify({ error: "Payload harus berupa JSON valid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload?.profile || !payload?.financialSummary || !payload?.goals) {
      return new Response(
        JSON.stringify({
          error: "Payload wajib menyertakan profile, financialSummary, dan goals",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payloadHash = await hashPayload({
      profile: payload.profile,
      financialSummary: payload.financialSummary,
      goals: payload.goals,
    });

    if (!payload.forceRefresh) {
      const { data: cached, error: cacheError } = await supabase
        .from("ai_strategy_runs")
        .select("id, strategy, raw_response, model, created_at")
        .eq("user_id", user.id)
        .eq("payload_hash", payloadHash)
        .maybeSingle<StrategyCacheRow>();

      if (cacheError && cacheError.code !== "PGRST116") {
        console.error("Failed to read cache", cacheError);
      }

      if (cached) {
        return new Response(
          JSON.stringify({
            runId: cached.id,
            cacheHit: true,
            strategy: cached.strategy,
            rawStrategy: cached.raw_response,
            model: cached.model,
            profile: payload.profile,
            financialSummary: payload.financialSummary,
            goals: payload.goals,
            createdAt: cached.created_at,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { systemPrompt, userPrompt } = buildPrompts(
      payload.profile,
      payload.financialSummary,
      payload.goals,
    );
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: todayCount, error: countError } = await supabase
      .from("ai_strategy_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfDay.toISOString());

    if (countError) {
      console.error("Failed to count daily runs", countError);
    } else if ((todayCount ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Batas harian tercapai. Coba lagi besok." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            role: "system",
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: strategyResponseSchema,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      if (geminiResponse.status === 429 || geminiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Limit penggunaan AI tercapai. Coba lagi nanti." }),
          { status: geminiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error("Gemini error:", geminiResponse.status, errorText);
      throw new Error(`Gemini error: ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const rawCandidate =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      geminiData?.candidates?.[0]?.output ??
      "";

    const rawStrategy = rawCandidate ? sanitizeJsonContent(rawCandidate) : "";
    let parsedStrategy: unknown = null;
    try {
      parsedStrategy = rawStrategy ? JSON.parse(rawStrategy) : null;
    } catch (error) {
      console.error("Failed to parse Gemini JSON payload", error, rawStrategy);
      throw new Error("Gemini mengembalikan format strategi yang tidak valid.");
    }
    console.log("Gemini raw output:", rawStrategy.slice(0, 500));

    if (!parsedStrategy) {
      throw new Error("Gemini tidak mengembalikan strategi yang dapat diproses.");
    }

    const normalizedStrategy = normalizeStrategyPlan(parsedStrategy);
    const modelName = geminiData?.model ?? geminiModel;

    const { data: upserted, error: upsertError } = await supabase
      .from("ai_strategy_runs")
      .upsert(
        {
          user_id: user.id,
          payload_hash: payloadHash,
          profile: payload.profile,
          financial_summary: payload.financialSummary,
          goals: payload.goals,
          strategy: normalizedStrategy,
          raw_response: rawStrategy,
          model: modelName,
        },
        { onConflict: "user_id,payload_hash" },
      )
      .select("id, created_at, model")
      .single();

    if (upsertError) {
      console.error("Failed to upsert ai_strategy_runs", upsertError);
      throw upsertError;
    }

    return new Response(
      JSON.stringify({
        runId: upserted.id,
        cacheHit: false,
        strategy: normalizedStrategy,
        rawStrategy,
        model: upserted.model,
        profile: payload.profile,
        financialSummary: payload.financialSummary,
        goals: payload.goals,
        createdAt: upserted.created_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("generate-business-strategy error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
