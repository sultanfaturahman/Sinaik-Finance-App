"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./globals.d.ts" />
var server_ts_1 = require("https://deno.land/std@0.168.0/http/server.ts");
var supabase_js_2_39_3_1 = require("https://esm.sh/@supabase/supabase-js@2.39.3");
var DAILY_STRATEGY_LIMIT = 10;
var corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};
var sanitizeJsonContent = function (content) {
    var trimmed = content.trim();
    if (trimmed.startsWith("```")) {
        var lines = trimmed.split("\n");
        return lines.slice(1, lines[lines.length - 1].startsWith("```") ? -1 : undefined).join("\n");
    }
    return trimmed;
};
var toString = function (value, fallback) {
    if (fallback === void 0) { fallback = ""; }
    if (typeof value === "string")
        return value;
    if (typeof value === "number" || typeof value === "boolean")
        return String(value);
    return fallback;
};
var ensureArray = function (value) {
    if (Array.isArray(value))
        return value;
    if (value === undefined || value === null)
        return [];
    return [value];
};
var asOptionalString = function (value) {
    var str = toString(value).trim();
    return str.length > 0 ? str : undefined;
};
var normaliseItem = function (item, index) {
    var _a, _b, _c;
    var record = (_a = item) !== null && _a !== void 0 ? _a : {};
    return {
        id: (_b = asOptionalString(record.id)) !== null && _b !== void 0 ? _b : "item-".concat(index + 1),
        title: (_c = asOptionalString(record.title)) !== null && _c !== void 0 ? _c : "Strategi ".concat(index + 1),
        description: toString(record.description),
        expected_impact: asOptionalString(record.expected_impact),
        expected_savings: asOptionalString(record.expected_savings),
    };
};
var normaliseStep = function (step, index) {
    var _a, _b, _c, _d;
    var record = (_a = step) !== null && _a !== void 0 ? _a : {};
    var safeId = (_b = asOptionalString(record.id)) !== null && _b !== void 0 ? _b : "week-".concat(index + 1);
    var tasks = ensureArray(record.tasks).map(function (task, taskIndex) {
        var _a, _b;
        return ({
            id: (_a = asOptionalString(task.id)) !== null && _a !== void 0 ? _a : "".concat(safeId, "-task-").concat(taskIndex + 1),
            title: (_b = asOptionalString(task.title)) !== null && _b !== void 0 ? _b : "Tugas ".concat(taskIndex + 1),
            owner: asOptionalString(task.owner),
            metric: asOptionalString(task.metric),
        });
    });
    return {
        id: safeId,
        title: (_c = asOptionalString(record.title)) !== null && _c !== void 0 ? _c : "Minggu ".concat(index + 1),
        timeframe: (_d = asOptionalString(record.timeframe)) !== null && _d !== void 0 ? _d : "Minggu ".concat(index + 1),
        summary: toString(record.summary),
        tasks: tasks,
    };
};
var normaliseTask = function (task, prefix, index) {
    var _a, _b, _c;
    var record = (_a = task) !== null && _a !== void 0 ? _a : {};
    return {
        id: (_b = asOptionalString(record.id)) !== null && _b !== void 0 ? _b : "".concat(prefix, "-").concat(index + 1),
        title: (_c = asOptionalString(record.title)) !== null && _c !== void 0 ? _c : "Tugas ".concat(index + 1),
        owner: asOptionalString(record.owner),
        metric: asOptionalString(record.metric),
        timeframe: asOptionalString(record.timeframe),
    };
};
var normalizeStrategyPlan = function (raw) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    var payload = (_a = raw) !== null && _a !== void 0 ? _a : {};
    var analysis = (_b = payload.analysis) !== null && _b !== void 0 ? _b : (typeof payload.analysisSummary === "string"
        ? { summary: payload.analysisSummary }
        : {});
    var keyFocus = ensureArray((_e = (_d = (_c = payload.key_focus) !== null && _c !== void 0 ? _c : payload.keyFocus) !== null && _d !== void 0 ? _d : payload.focusAreas) !== null && _e !== void 0 ? _e : [])
        .map(function (item) { return toString(item).trim(); })
        .filter(Boolean);
    var actionsRaw = (_g = (_f = payload.actions) !== null && _f !== void 0 ? _f : payload.actionItems) !== null && _g !== void 0 ? _g : payload.action_list;
    var flatActions = ensureArray(actionsRaw).map(function (task, index) {
        return normaliseTask(task, "action", index);
    });
    var revenueRaw = (_k = (_j = (_h = payload.revenue_strategies) !== null && _h !== void 0 ? _h : payload.revenueStrategies) !== null && _j !== void 0 ? _j : payload.revenue_plan) !== null && _k !== void 0 ? _k : payload.revenue;
    var costRaw = (_o = (_m = (_l = payload.cost_strategies) !== null && _l !== void 0 ? _l : payload.costStrategies) !== null && _m !== void 0 ? _m : payload.cost_plan) !== null && _o !== void 0 ? _o : payload.efficiency;
    var actionPlanRaw = (_q = (_p = payload.action_plan) !== null && _p !== void 0 ? _p : payload.actionPlan) !== null && _q !== void 0 ? _q : payload.weekly_plan;
    var targetsRaw = (_s = (_r = payload.targets) !== null && _r !== void 0 ? _r : payload.milestones) !== null && _s !== void 0 ? _s : payload.goals;
    return {
        analysis: {
            summary: toString(analysis.summary) ||
                "AI berhasil menghasilkan strategi, namun ringkasan tidak tersedia.",
            key_metrics: ensureArray((_v = (_u = (_t = analysis.key_metrics) !== null && _t !== void 0 ? _t : analysis.keyMetrics) !== null && _u !== void 0 ? _u : payload.key_metrics) !== null && _v !== void 0 ? _v : []).map(function (metric, index) { return ({
                label: toString(metric.label, "Metric ".concat(index + 1)),
                value: toString(metric.value, "-"),
            }); }),
        },
        revenue_strategies: ensureArray(revenueRaw).map(function (entry, index) {
            var item = normaliseItem(entry, index);
            if (item.id === "item-".concat(index + 1)) {
                item.id = "rev-".concat(index + 1);
            }
            return item;
        }),
        cost_strategies: ensureArray(costRaw).map(function (entry, index) {
            var item = normaliseItem(entry, index);
            if (item.id === "item-".concat(index + 1)) {
                item.id = "cost-".concat(index + 1);
            }
            return item;
        }),
        action_plan: ensureArray(actionPlanRaw).map(normaliseStep),
        targets: ensureArray(targetsRaw).map(function (target, index) {
            var _a, _b;
            return ({
                label: (_a = asOptionalString(target.label)) !== null && _a !== void 0 ? _a : "Target ".concat(index + 1),
                value: (_b = asOptionalString(target.value)) !== null && _b !== void 0 ? _b : '-',
            });
        }),
        key_focus: keyFocus.length > 0 ? keyFocus : undefined,
        actions: flatActions.length > 0 ? flatActions : undefined,
        timeframe: asOptionalString((_w = payload.timeframe) !== null && _w !== void 0 ? _w : payload.timeFrame),
        version: asOptionalString((_x = payload.version) !== null && _x !== void 0 ? _x : payload.strategyVersion),
    };
};
var hashPayload = function (payload) { return __awaiter(void 0, void 0, void 0, function () {
    var encoder, raw, buffer;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                encoder = new TextEncoder();
                raw = encoder.encode(JSON.stringify(payload));
                return [4 /*yield*/, crypto.subtle.digest("SHA-256", raw)];
            case 1:
                buffer = _a.sent();
                return [2 /*return*/, Array.from(new Uint8Array(buffer))
                        .map(function (byte) { return byte.toString(16).padStart(2, "0"); })
                        .join("")];
        }
    });
}); };
var strategyResponseSchema = {
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
};
var buildPrompts = function (profile, financialSummary, goals) {
    var systemPrompt = "Anda adalah konsultan bisnis UMKM di Indonesia. Gunakan Bahasa Indonesia yang ringkas dan fokus pada langkah praktis.\n\nFormat output JSON:\n{\n  \"analysis\": { \"summary\": string, \"key_metrics\": [{ \"label\": string, \"value\": string }] },\n  \"revenue_strategies\": [{ \"id\": string, \"title\": string, \"description\": string, \"expected_impact\": string }],\n  \"cost_strategies\": [{ \"id\": string, \"title\": string, \"description\": string, \"expected_savings\": string }],\n  \"action_plan\": [\n    { \"id\": string, \"title\": string, \"timeframe\": string, \"summary\": string, \"tasks\": [{ \"id\": string, \"title\": string, \"owner\": string, \"metric\": string }] }\n  ],\n  \"targets\": [{ \"label\": string, \"value\": string }]\n}\n\nKetentuan: minimal 3 item di revenue_strategies & cost_strategies; action_plan wajib memuat minggu 1 s.d. 4 dengan \u22653 tugas per minggu; gunakan format Rupiah/persen.";
    var userPrompt = "Profil usaha:\n- Nama: ".concat(profile.businessName || "Tidak diisi", "\n- Sektor: ").concat(profile.sector || "Tidak diisi", "\n- Target pelanggan: ").concat(profile.targetMarket || "Tidak diisi", "\n- Tim: ").concat(profile.teamSize || "Tidak diisi", "\n- Keunggulan: ").concat(profile.differentiator || "Tidak diisi", "\n\nRingkasan finansial tahun berjalan:\n- Total pemasukan: Rp ").concat(financialSummary.revenueYtd.toLocaleString("id-ID"), "\n- Total pengeluaran: Rp ").concat(financialSummary.expenseYtd.toLocaleString("id-ID"), "\n- Laba bersih: Rp ").concat(financialSummary.netProfitYtd.toLocaleString("id-ID"), "\n- Profit margin: ").concat(financialSummary.profitMargin.toFixed(1), "%\n- Catatan trend: ").concat(financialSummary.noteworthyTrend || "-", "\n\nTujuan strategis:\n- Tujuan utama: ").concat(goals.primary || "-", "\n- Prioritas pendukung: ").concat(goals.secondary || "-", "\n- Target waktu: ").concat(goals.timeframe || "-", "\n- Risiko / kendala: ").concat(goals.risks || "-", "\n\nBerikan strategi JSON sesuai format di atas untuk membantu UMKM mencapai target.");
    return { systemPrompt: systemPrompt, userPrompt: userPrompt };
};
(0, server_ts_1.serve)(function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var supabaseUrl, supabaseKey, geminiApiKey, geminiModel, supabase, authHeader, token, _a, user, userError, payload, _err_1, payloadHash, _b, cached, cacheError, _c, systemPrompt, userPrompt, startOfDay, _d, todayCount, countError, geminiResponse, errorText, geminiData, rawCandidate, rawStrategy, parsedStrategy, normalizedStrategy, modelName, _e, upserted, upsertError, error_1;
    var _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    return __generator(this, function (_s) {
        switch (_s.label) {
            case 0:
                if (req.method === "OPTIONS") {
                    return [2 /*return*/, new Response(null, { status: 204, headers: corsHeaders })];
                }
                _s.label = 1;
            case 1:
                _s.trys.push([1, 16, , 17]);
                supabaseUrl = Deno.env.get("SUPABASE_URL");
                supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
                geminiApiKey = Deno.env.get("GEMINI_API_KEY");
                geminiModel = (_f = Deno.env.get("GEMINI_MODEL")) !== null && _f !== void 0 ? _f : "gemini-2.5-flash";
                if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
                    throw new Error("Environment variables SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan GEMINI_API_KEY wajib diset");
                }
                supabase = (0, supabase_js_2_39_3_1.createClient)(supabaseUrl, supabaseKey);
                authHeader = req.headers.get("Authorization");
                if (!authHeader) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: "Unauthorized" }), {
                            status: 401,
                            headers: __assign(__assign({}, corsHeaders), { "Content-Type": "application/json" }),
                        })];
                }
                token = authHeader.replace("Bearer ", "");
                return [4 /*yield*/, supabase.auth.getUser(token)];
            case 2:
                _a = _s.sent(), user = _a.data.user, userError = _a.error;
                if (userError || !user) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: "Unauthorized" }), {
                            status: 401,
                            headers: __assign(__assign({}, corsHeaders), { "Content-Type": "application/json" }),
                        })];
                }
                payload = void 0;
                _s.label = 3;
            case 3:
                _s.trys.push([3, 5, , 6]);
                return [4 /*yield*/, req.json()];
            case 4:
                payload = (_s.sent());
                return [3 /*break*/, 6];
            case 5:
                _err_1 = _s.sent();
                return [2 /*return*/, new Response(JSON.stringify({ error: "Payload harus berupa JSON valid" }), {
                        status: 400,
                        headers: __assign(__assign({}, corsHeaders), { "Content-Type": "application/json" }),
                    })];
            case 6:
                if (!(payload === null || payload === void 0 ? void 0 : payload.profile) || !(payload === null || payload === void 0 ? void 0 : payload.financialSummary) || !(payload === null || payload === void 0 ? void 0 : payload.goals)) {
                    return [2 /*return*/, new Response(JSON.stringify({
                            error: "Payload wajib menyertakan profile, financialSummary, dan goals",
                        }), { status: 400, headers: __assign(__assign({}, corsHeaders), { "Content-Type": "application/json" }) })];
                }
                return [4 /*yield*/, hashPayload({
                        profile: payload.profile,
                        financialSummary: payload.financialSummary,
                        goals: payload.goals,
                    })];
            case 7:
                payloadHash = _s.sent();
                if (!!payload.forceRefresh) return [3 /*break*/, 9];
                return [4 /*yield*/, supabase
                        .from("ai_strategy_runs")
                        .select("id, strategy, raw_response, model, created_at")
                        .eq("user_id", user.id)
                        .eq("payload_hash", payloadHash)
                        .maybeSingle()];
            case 8:
                _b = _s.sent(), cached = _b.data, cacheError = _b.error;
                if (cacheError && cacheError.code !== "PGRST116") {
                    console.error("Failed to read cache", cacheError);
                }
                if (cached) {
                    return [2 /*return*/, new Response(JSON.stringify({
                            runId: cached.id,
                            cacheHit: true,
                            strategy: cached.strategy,
                            rawStrategy: cached.raw_response,
                            model: cached.model,
                            profile: payload.profile,
                            financialSummary: payload.financialSummary,
                            goals: payload.goals,
                            createdAt: cached.created_at,
                        }), { status: 200, headers: __assign(__assign({}, corsHeaders), { "Content-Type": "application/json" }) })];
                }
                _s.label = 9;
            case 9:
                _c = buildPrompts(payload.profile, payload.financialSummary, payload.goals), systemPrompt = _c.systemPrompt, userPrompt = _c.userPrompt;
                startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                return [4 /*yield*/, supabase
                        .from("ai_strategy_runs")
                        .select("id", { count: "exact", head: true })
                        .eq("user_id", user.id)
                        .gte("created_at", startOfDay.toISOString())];
            case 10:
                _d = _s.sent(), todayCount = _d.count, countError = _d.error;
                if (countError) {
                    console.error("Failed to count daily runs", countError);
                }
                else if ((todayCount !== null && todayCount !== void 0 ? todayCount : 0) >= DAILY_STRATEGY_LIMIT) {
                    return [2 /*return*/, new Response(JSON.stringify({
                            error: "Batas harian tercapai. Coba lagi besok atau hubungi admin untuk meningkatkan limit (maks ".concat(DAILY_STRATEGY_LIMIT, " kali/hari)."),
                        }), { status: 429, headers: __assign(__assign({}, corsHeaders), { "Content-Type": "application/json" }) })];
                }
                return [4 /*yield*/, fetch("https://generativelanguage.googleapis.com/v1beta/models/".concat(geminiModel, ":generateContent?key=").concat(geminiApiKey), {
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
                    })];
            case 11:
                geminiResponse = _s.sent();
                if (!!geminiResponse.ok) return [3 /*break*/, 13];
                return [4 /*yield*/, geminiResponse.text()];
            case 12:
                errorText = _s.sent();
                if (geminiResponse.status === 429 || geminiResponse.status === 402) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: "Limit penggunaan AI tercapai. Coba lagi nanti." }), { status: geminiResponse.status, headers: __assign(__assign({}, corsHeaders), { "Content-Type": "application/json" }) })];
                }
                console.error("Gemini error:", geminiResponse.status, errorText);
                throw new Error("Gemini error: ".concat(errorText));
            case 13: return [4 /*yield*/, geminiResponse.json()];
            case 14:
                geminiData = _s.sent();
                rawCandidate = (_q = (_m = (_l = (_k = (_j = (_h = (_g = geminiData === null || geminiData === void 0 ? void 0 : geminiData.candidates) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.content) === null || _j === void 0 ? void 0 : _j.parts) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.text) !== null && _m !== void 0 ? _m : (_p = (_o = geminiData === null || geminiData === void 0 ? void 0 : geminiData.candidates) === null || _o === void 0 ? void 0 : _o[0]) === null || _p === void 0 ? void 0 : _p.output) !== null && _q !== void 0 ? _q : "";
                rawStrategy = rawCandidate ? sanitizeJsonContent(rawCandidate) : "";
                parsedStrategy = null;
                try {
                    parsedStrategy = rawStrategy ? JSON.parse(rawStrategy) : null;
                }
                catch (error) {
                    console.error("Failed to parse Gemini JSON payload", error, rawStrategy);
                    throw new Error("Gemini mengembalikan format strategi yang tidak valid.");
                }
                console.log("Gemini raw output:", rawStrategy.slice(0, 500));
                if (!parsedStrategy) {
                    throw new Error("Gemini tidak mengembalikan strategi yang dapat diproses.");
                }
                normalizedStrategy = normalizeStrategyPlan(parsedStrategy);
                modelName = (_r = geminiData === null || geminiData === void 0 ? void 0 : geminiData.model) !== null && _r !== void 0 ? _r : geminiModel;
                return [4 /*yield*/, supabase
                        .from("ai_strategy_runs")
                        .upsert({
                        user_id: user.id,
                        payload_hash: payloadHash,
                        profile: payload.profile,
                        financial_summary: payload.financialSummary,
                        goals: payload.goals,
                        strategy: normalizedStrategy,
                        raw_response: rawStrategy,
                        model: modelName,
                    }, { onConflict: "user_id,payload_hash" })
                        .select("id, created_at, model")
                        .single()];
            case 15:
                _e = _s.sent(), upserted = _e.data, upsertError = _e.error;
                if (upsertError) {
                    console.error("Failed to upsert ai_strategy_runs", upsertError);
                    throw upsertError;
                }
                return [2 /*return*/, new Response(JSON.stringify({
                        runId: upserted.id,
                        cacheHit: false,
                        strategy: normalizedStrategy,
                        rawStrategy: rawStrategy,
                        model: upserted.model,
                        profile: payload.profile,
                        financialSummary: payload.financialSummary,
                        goals: payload.goals,
                        createdAt: upserted.created_at,
                    }), { status: 200, headers: __assign(__assign({}, corsHeaders), { "Content-Type": "application/json" }) })];
            case 16:
                error_1 = _s.sent();
                console.error("generate-business-strategy error", error_1);
                return [2 /*return*/, new Response(JSON.stringify({ error: error_1 instanceof Error ? error_1.message : "Unknown error" }), { status: 500, headers: __assign(__assign({}, corsHeaders), { "Content-Type": "application/json" }) })];
            case 17: return [2 /*return*/];
        }
    });
}); });
