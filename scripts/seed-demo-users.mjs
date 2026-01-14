import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? "Demo1234!";
const ROOT_DIR = process.cwd();

const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  const contents = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }

  return entries;
};

const env = {
  ...readEnvFile(path.join(ROOT_DIR, ".env")),
  ...readEnvFile(path.join(ROOT_DIR, ".env.local")),
  ...process.env,
};

const supabaseUrl =
  env.SUPABASE_URL || env.VITE_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia di env.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const parseDateInput = (value, label) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} harus format YYYY-MM-DD`);
  }
  return parsed;
};

const seedStartInput = env.SEED_START_DATE;
const seedEndInput = env.SEED_END_DATE;
const bulkCountRaw = Number(env.SEED_BULK_COUNT ?? "10");
const bulkCount =
  Number.isFinite(bulkCountRaw) && bulkCountRaw > 0
    ? Math.floor(bulkCountRaw)
    : 10;
const bulkForce =
  env.SEED_BULK_FORCE === "true" || env.SEED_BULK_FORCE === "1";
const updateSeedDates = env.SEED_UPDATE_SEED_DATES !== "false";

const defaultStart = new Date();
defaultStart.setDate(defaultStart.getDate() - 30);
defaultStart.setHours(0, 0, 0, 0);

const defaultEnd = new Date();
defaultEnd.setHours(23, 59, 59, 999);

const seedStart = parseDateInput(seedStartInput, "SEED_START_DATE") ?? defaultStart;
const seedEnd = parseDateInput(seedEndInput, "SEED_END_DATE") ?? defaultEnd;

if (seedStart > seedEnd) {
  throw new Error("SEED_START_DATE tidak boleh setelah SEED_END_DATE");
}

const randomDateString = () => {
  const start = seedStart.getTime();
  const end = seedEnd.getTime();
  const range = Math.max(1, end - start);
  const time = start + Math.random() * range;
  return new Date(time).toISOString().slice(0, 10);
};

const users = [
  {
    email: "fauzan1@gmail.com",
    ownerName: "Fauzan Anggit Prakoso",
    businessName: "Cireng Kuah Creamy",
    city: "PCI Blok C, Cilegon, Banten",
  },
  {
    email: "ekirhn@gmail.com",
    ownerName: "Eki Raihan",
    businessName: "Mobil Bekas Gue",
    city: "Kramatwatu",
  },
  {
    email: "rifqifahrezi310@gmail.com",
    ownerName: "Rifqi Fahrezi",
    businessName: "Nasi uduk bahagia pagi sore",
    city: "Cibeber",
  },
  {
    email: "debyrosellini@gmail.com",
    ownerName: "Deby rosselini",
    businessName: "rosselini library",
    city: "Temuputih, Cilegon, Banten",
  },
  {
    email: "pancakesusuclg@gmail.com",
    ownerName: "Rina Febriani",
    businessName: "Watashi Pancake Susu",
    city: "Bundaran Perumnas, Cibeber, Cilegon, Banten",
  },
  {
    email: "halfcilegon25@gmail.com",
    ownerName: "Rangga Ariq",
    businessName: "Kopi Half",
    city: "Jl.Garuda, Cibeber, Cilegon, Banten",
  },
  {
    email: "ryofebrianto@gmail.com",
    ownerName: "Ryo Febrianto",
    businessName: "Jus Thailand Ciwaduk",
    city: "Jl. H Syukur, kel.Tamanbaru, citangkil, Cilegon, Banten",
  },
  {
    email: "nayya28@gmail.com",
    ownerName: "Nayya Mauldina",
    businessName: "Nay's Flowers",
    city: "Cilegon",
  },
];

const hashPayload = (payload) =>
  crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

const buildStrategyPlan = (businessName) => ({
  analysis: {
    summary: `Strategi awal untuk ${businessName}.`,
    key_metrics: [
      { label: "Omzet bulanan", value: "Rp 12.000.000" },
      { label: "Margin laba", value: "35%" },
      { label: "Repeat order", value: "20%" },
    ],
  },
  revenue_strategies: [
    {
      id: "rev-1",
      title: "Perluas kanal penjualan",
      description: "Aktifkan penjualan online dan titip jual di lokasi ramai.",
      expected_impact: "+15% omzet",
    },
    {
      id: "rev-2",
      title: "Paket bundling produk",
      description: "Tawarkan bundling untuk menaikkan nilai transaksi.",
      expected_impact: "+10% nilai transaksi",
    },
    {
      id: "rev-3",
      title: "Program loyalitas sederhana",
      description: "Diskon kecil setelah pembelian ke-5.",
      expected_impact: "+12% repeat order",
    },
  ],
  cost_strategies: [
    {
      id: "cost-1",
      title: "Negosiasi bahan baku",
      description: "Cari pemasok alternatif untuk menurunkan biaya.",
      expected_savings: "-5% biaya",
    },
    {
      id: "cost-2",
      title: "Optimasi stok",
      description: "Batasi stok lambat agar biaya penyimpanan turun.",
      expected_savings: "-3% biaya",
    },
    {
      id: "cost-3",
      title: "Jadwal operasional efektif",
      description: "Atur jam ramai untuk efisiensi tenaga kerja.",
      expected_savings: "-4% biaya",
    },
  ],
  action_plan: [
    {
      id: "week-1",
      title: "Minggu 1",
      timeframe: "Minggu 1",
      summary: "Audit produk terlaris dan biaya utama.",
      tasks: [
        {
          id: "week-1-task-1",
          title: "Catat produk terlaris 7 hari terakhir",
          owner: "Pemilik",
          metric: "Daftar produk",
        },
        {
          id: "week-1-task-2",
          title: "Hitung biaya bahan baku per produk",
          owner: "Pemilik",
          metric: "Sheet biaya",
        },
        {
          id: "week-1-task-3",
          title: "Susun target omzet mingguan",
          owner: "Pemilik",
          metric: "Target mingguan",
        },
      ],
    },
    {
      id: "week-2",
      title: "Minggu 2",
      timeframe: "Minggu 2",
      summary: "Luncurkan bundling dan promo ringan.",
      tasks: [
        {
          id: "week-2-task-1",
          title: "Buat 2 paket bundling",
          owner: "Pemilik",
          metric: "Paket aktif",
        },
        {
          id: "week-2-task-2",
          title: "Uji harga promo selama 3 hari",
          owner: "Pemilik",
          metric: "Data penjualan",
        },
        {
          id: "week-2-task-3",
          title: "Catat respon pelanggan",
          owner: "Pemilik",
          metric: "Catatan feedback",
        },
      ],
    },
    {
      id: "week-3",
      title: "Minggu 3",
      timeframe: "Minggu 3",
      summary: "Perkuat kanal online dan promosi lokal.",
      tasks: [
        {
          id: "week-3-task-1",
          title: "Aktifkan 1 kanal online",
          owner: "Pemilik",
          metric: "Kanal aktif",
        },
        {
          id: "week-3-task-2",
          title: "Buat konten promosi 3 kali",
          owner: "Pemilik",
          metric: "Konten terbit",
        },
        {
          id: "week-3-task-3",
          title: "Evaluasi biaya promosi",
          owner: "Pemilik",
          metric: "Laporan biaya",
        },
      ],
    },
    {
      id: "week-4",
      title: "Minggu 4",
      timeframe: "Minggu 4",
      summary: "Review hasil dan siapkan langkah lanjutan.",
      tasks: [
        {
          id: "week-4-task-1",
          title: "Bandingkan omzet vs target",
          owner: "Pemilik",
          metric: "Laporan omzet",
        },
        {
          id: "week-4-task-2",
          title: "Tentukan fokus bulan berikutnya",
          owner: "Pemilik",
          metric: "Rencana fokus",
        },
        {
          id: "week-4-task-3",
          title: "Susun daftar prioritas perbaikan",
          owner: "Pemilik",
          metric: "Checklist prioritas",
        },
      ],
    },
  ],
  targets: [
    { label: "Omzet 3 bulan", value: "Rp 15.000.000" },
    { label: "Margin laba", value: "35%" },
    { label: "Repeat order", value: "25%" },
  ],
  key_focus: ["Penjualan", "Margin", "Retensi"],
  timeframe: "90 hari",
  version: "seed-1",
});

const buildPayload = (user, index) => {
  const revenue = 10000000 + index * 750000;
  const expense = 6000000 + index * 350000;
  const netProfit = revenue - expense;
  const profitMargin = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0;

  return {
    profile: {
      businessName: user.businessName,
      sector: "Umum",
      targetMarket: "Pelanggan lokal",
      teamSize: "1-3 orang",
      differentiator: "Pelayanan cepat",
    },
    financialSummary: {
      revenueYtd: revenue,
      expenseYtd: expense,
      netProfitYtd: netProfit,
      profitMargin,
      noteworthyTrend: "Stabil",
    },
    goals: {
      primary: "Naikkan omzet 15%",
      secondary: "Perbaiki margin",
      timeframe: "3 bulan",
      risks: "Biaya bahan baku naik",
    },
  };
};

const buildTransactions = (userId, index) => {
  return [
    {
      user_id: userId,
      type: "income",
      amount: 1500000 + index * 100000,
      category: "Penjualan",
      date: randomDateString(),
      note: "Seed demo",
      source: "manual",
    },
    {
      user_id: userId,
      type: "expense",
      amount: 600000 + index * 50000,
      category: "Bahan baku",
      date: randomDateString(),
      note: "Seed demo",
      source: "manual",
    },
    {
      user_id: userId,
      type: "expense",
      amount: 250000 + index * 25000,
      category: "Operasional",
      date: randomDateString(),
      note: "Seed demo",
      source: "manual",
    },
  ];
};

const bulkNoteFor = (type, category) => {
  if (type === "income") {
    if (category === "Online") return "Penjualan online";
    if (category === "Bundling") return "Penjualan paket";
    return "Penjualan produk";
  }

  if (category === "Bahan baku") return "Pembelian bahan baku";
  if (category === "Marketing") return "Biaya pemasaran";
  if (category === "Operasional") return "Biaya operasional";
  return "Biaya lainnya";
};

const buildBulkTransactions = (userId, index, count) => {
  const incomeCategories = ["Penjualan", "Online", "Bundling"];
  const expenseCategories = ["Bahan baku", "Operasional", "Marketing"];
  const rows = [];

  for (let i = 0; i < count; i += 1) {
    const isIncome = i % 2 === 0;
    const category = isIncome
      ? incomeCategories[i % incomeCategories.length]
      : expenseCategories[i % expenseCategories.length];
    const amount = isIncome
      ? 250000 + index * 50000 + i * 20000
      : 120000 + index * 30000 + i * 15000;

    rows.push({
      user_id: userId,
      type: isIncome ? "income" : "expense",
      amount,
      category,
      date: randomDateString(),
      note: bulkNoteFor(isIncome ? "income" : "expense", category),
      source: "manual",
    });
  }

  return rows;
};

const findUserByEmail = async (email) => {
  const normalizedEmail = email.toLowerCase();
  const perPage = 200;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find(
      (user) => user.email && user.email.toLowerCase() === normalizedEmail,
    );
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
};

const ensureUser = async (user) => {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { name: user.ownerName },
  });

  if (data?.user) {
    return { user: data.user, created: true };
  }

  if (error) {
    const existing = await findUserByEmail(user.email);
    if (existing) {
      return { user: existing, created: false };
    }
    throw error;
  }

  throw new Error(`Gagal membuat user untuk ${user.email}`);
};

const bulkNotes = [
  "Penjualan online",
  "Penjualan paket",
  "Penjualan produk",
  "Pembelian bahan baku",
  "Biaya pemasaran",
  "Biaya operasional",
  "Biaya lainnya",
];

const seedNotes = ["Seed demo", "Seed demo bulk", ...bulkNotes];

const updateSeedTransactionDates = async (userId) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, category, note")
    .eq("user_id", userId)
    .in("note", seedNotes);

  if (error) throw error;
  if (!data?.length) return 0;

  for (const row of data) {
    const shouldUpdateNote = row.note === "Seed demo bulk";
    const nextNote = shouldUpdateNote
      ? bulkNoteFor(row.type, row.category)
      : row.note;
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ date: randomDateString(), note: nextNote })
      .eq("id", row.id);
    if (updateError) throw updateError;
  }

  return data.length;
};

const main = async () => {
  const nowIso = new Date().toISOString();

  for (let index = 0; index < users.length; index += 1) {
    const entry = users[index];
    const { user, created } = await ensureUser(entry);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: entry.ownerName,
        email: entry.email,
        business_name: entry.businessName,
        city: entry.city,
        onboarding_completed: true,
        profile_completed: true,
        profile_completed_at: nowIso,
      })
      .eq("id", user.id);

    if (profileError) throw profileError;

    const { count: transactionCount, error: transactionCountError } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (transactionCountError) throw transactionCountError;

    if (updateSeedDates) {
      const updated = await updateSeedTransactionDates(user.id);
      if (updated > 0) {
        console.log(`updated dates: ${updated} transaksi (${entry.email})`);
      }
    }

    if ((transactionCount ?? 0) === 0) {
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(buildTransactions(user.id, index));
      if (transactionError) throw transactionError;
    }

    const { count: bulkExisting, error: bulkCountError } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("note", ["Seed demo bulk", ...bulkNotes]);

    if (bulkCountError) throw bulkCountError;

    const bulkMissing = bulkForce
      ? bulkCount
      : Math.max(0, bulkCount - (bulkExisting ?? 0));

    if (bulkMissing > 0) {
      const { error: bulkInsertError } = await supabase
        .from("transactions")
        .insert(buildBulkTransactions(user.id, index, bulkMissing));
      if (bulkInsertError) throw bulkInsertError;
      console.log(`bulk insert: ${bulkMissing} transaksi (${entry.email})`);
    }

    const payload = buildPayload(entry, index);
    const payloadHash = hashPayload({
      profile: payload.profile,
      financialSummary: payload.financialSummary,
      goals: payload.goals,
    });
    const strategyPlan = buildStrategyPlan(entry.businessName);

    const { error: aiError } = await supabase.from("ai_strategy_runs").upsert(
      {
        user_id: user.id,
        payload_hash: payloadHash,
        profile: payload.profile,
        financial_summary: payload.financialSummary,
        goals: payload.goals,
        strategy: strategyPlan,
        raw_response: JSON.stringify(strategyPlan),
        model: "seed",
      },
      { onConflict: "user_id,payload_hash" },
    );

    if (aiError) throw aiError;

    console.log(
      `${created ? "created" : "existing"}: ${entry.email} (${entry.businessName})`,
    );
  }

  console.log(`Seed selesai untuk ${users.length} user.`);
};

await main();
