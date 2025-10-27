import { useMemo, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type Step = "upload" | "preview" | "commit";

export interface ImportRow {
  date: string;
  type: "income" | "expense";
  amount: number;
  category?: string;
  note?: string | null;
  raw?: Record<string, unknown>;
}

interface ValidatedRow extends ImportRow {
  error?: string;
  duplicate?: boolean;
}

interface ImportWizardProps {
  onCommit: (rows: ImportRow[]) => Promise<void> | void;
  dedupeKey?: (row: ImportRow) => string;
}

export const ImportWizard = ({ onCommit, dedupeKey }: ImportWizardProps) => {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => {
    const total = rows.length;
    const errors = rows.filter((row) => row.error).length;
    const duplicates = rows.filter((row) => row.duplicate).length;
    const valid = total - errors - duplicates;
    return { total, valid, errors, duplicates };
  }, [rows]);

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(firstSheet, {
        raw: false,
        defval: "",
      });

      const validated: ValidatedRow[] = jsonRows.map((row) => validateRow(row));
      const seen = new Set<string>();

      const dedupeFn =
        dedupeKey ??
        ((item: ImportRow) =>
          [item.date, item.type, item.amount, item.category ?? "", item.note ?? ""].join("|"));

      const deduped = validated.map((row) => {
        if (row.error) {
          return row;
        }
        const key = dedupeFn(row);
        if (seen.has(key)) {
          return { ...row, duplicate: true };
        }
        seen.add(key);
        return row;
      });

      setRows(deduped);
      setStep("preview");
    } catch (error) {
      console.error("Import error:", error);
      setRows([
        {
          date: "",
          type: "income",
          amount: 0,
          error: "Tidak dapat membaca file. Pastikan format sesuai template.",
        },
      ]);
      setStep("preview");
    }
  };

  const handleCommit = async () => {
    setIsSubmitting(true);
    try {
      const validRows = rows.filter((row) => !row.error && !row.duplicate);
      await onCommit(validRows);
      setStep("commit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-2xl border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Import Transaksi</CardTitle>
        <CardDescription>
          Ikuti tiga langkah sederhana untuk menambahkan transaksi massal dari Excel atau CSV.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <StepIndicator currentStep={step} />

        {step === "upload" && (
          <UploadStep
            onUpload={handleFileUpload}
          />
        )}

        {step === "preview" && (
          <PreviewStep
            rows={rows}
            summary={summary}
            onBack={() => setStep("upload")}
            onNext={handleCommit}
            disableNext={summary.valid === 0}
            isSubmitting={isSubmitting}
          />
        )}

        {step === "commit" && <CommitStep summary={summary} />}
      </CardContent>
    </Card>
  );
};

const StepIndicator = ({ currentStep }: { currentStep: Step }) => {
  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Upload" },
    { id: "preview", label: "Preview" },
    { id: "commit", label: "Selesai" },
  ];

  const index = steps.findIndex((step) => step.id === currentStep);

  return (
    <ol className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground md:text-sm">
      {steps.map((step, idx) => (
        <li
          key={step.id}
          className={cn(
            "flex flex-1 items-center gap-2",
            idx <= index ? "text-brand" : "text-muted-foreground/60"
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm",
              idx <= index ? "border-brand bg-brand/10" : "border-border bg-muted/60"
            )}
          >
            {idx + 1}
          </span>
          <span>{step.label}</span>
          {idx < steps.length - 1 && (
            <span className="flex-1 border-t border-dashed border-border/70" />
          )}
        </li>
      ))}
    </ol>
  );
};

const UploadStep = ({ onUpload }: { onUpload: (file: File | null) => void }) => (
  <div className="space-y-4">
    <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Upload className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-foreground">Pilih file Excel / CSV</p>
      <p className="text-xs text-muted-foreground">
        Gunakan template resmi SiNaik. Format kolom minimal: tanggal, jenis, amount.
      </p>
    </div>
    <div className="grid grid-cols-1 gap-2 md:flex md:items-center">
      <Button
        variant="secondary"
        className="h-11 w-full justify-center gap-2 rounded-2xl focus-visible:ring-brand"
        asChild
      >
        <label className="cursor-pointer">
          Pilih File
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
          />
        </label>
      </Button>
      <Button
        variant="outline"
        className="h-11 w-full rounded-2xl border-dashed focus-visible:ring-brand md:w-auto"
        onClick={() => downloadTemplate()}
      >
        Unduh Template
      </Button>
    </div>
  </div>
);

const PreviewStep = ({
  rows,
  summary,
  onBack,
  onNext,
  disableNext,
  isSubmitting,
}: {
  rows: ValidatedRow[];
  summary: { total: number; valid: number; errors: number; duplicates: number };
  onBack: () => void;
  onNext: () => void;
  disableNext: boolean;
  isSubmitting: boolean;
}) => (
  <div className="space-y-4">
    <div className="rounded-2xl border bg-background p-4">
      <p className="text-sm font-medium text-foreground">Ringkasan</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground md:grid-cols-4">
        <SummaryPill label="Total baris" value={summary.total} />
        <SummaryPill label="Valid" value={summary.valid} tone="success" />
        <SummaryPill label="Error" value={summary.errors} tone="destructive" />
        <SummaryPill label="Duplikat" value={summary.duplicates} tone="warning" />
      </div>
    </div>
    <div className="rounded-2xl border bg-background">
      <div className="max-h-[300px] overflow-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="sticky top-0 bg-muted/70 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Jenis</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium text-right">Jumlah</th>
              <th className="px-4 py-3 font-medium">Catatan</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={`${row.date}-${idx}`}
                className={cn(
                  "border-t border-border/60",
                  row.error && "bg-destructive/10",
                  row.duplicate && "bg-warning/10"
                )}
              >
                <td className="px-4 py-2">{row.date}</td>
                <td className="px-4 py-2 capitalize">{row.type}</td>
                <td className="px-4 py-2">{row.category ?? "-"}</td>
                <td className="px-4 py-2 text-right">
                  {row.amount.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}
                </td>
                <td className="px-4 py-2">{row.note ?? "-"}</td>
                <td className="px-4 py-2">
                  {row.error ? (
                    <span className="text-xs font-medium text-destructive">{row.error}</span>
                  ) : row.duplicate ? (
                    <span className="text-xs font-medium text-warning">Duplikat</span>
                  ) : (
                    <span className="text-xs font-medium text-success">Siap diimport</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-2 md:flex md:justify-between">
      <Button
        variant="ghost"
        className="h-11 w-full gap-2 rounded-2xl md:w-auto"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Button>
      <div className="grid grid-cols-1 gap-2 md:flex md:items-center">
        <Button
          className="h-11 w-full gap-2 rounded-2xl bg-brand text-white hover:bg-brand/90 focus-visible:ring-brand md:w-auto"
          onClick={onNext}
          disabled={disableNext || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengimport...
            </>
          ) : (
            <>
              Lanjutkan Import
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
);

const CommitStep = ({ summary }: { summary: { valid: number } }) => (
  <div className="space-y-4 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
      <CheckCircle2 className="h-7 w-7" />
    </div>
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-foreground">Import Berhasil</h3>
      <p className="text-sm text-muted-foreground">
        {summary.valid} transaksi berhasil ditambahkan ke database Anda.
      </p>
    </div>
    <div className="rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground">
      Periksa halaman Transaksi untuk melihat data terbaru atau tambahkan lagi jika diperlukan.
    </div>
  </div>
);

const SummaryPill = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "destructive" | "warning";
}) => (
  <div
    className={cn(
      "rounded-2xl border px-4 py-3 text-left",
      tone === "success" && "border-success/30 bg-success/10 text-success",
      tone === "destructive" && "border-destructive/30 bg-destructive/10 text-destructive",
      tone === "warning" && "border-warning/30 bg-warning/10 text-warning"
    )}
  >
    <p className="text-xs uppercase tracking-wide">{label}</p>
    <p className="text-base font-semibold text-foreground">{value}</p>
  </div>
);

const requiredColumns = ["date", "type", "amount"] as const;

function validateRow(row: Record<string, unknown>): ValidatedRow {
  const normalised: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalised[key.toLowerCase().trim()] = value;
  });

  for (const col of requiredColumns) {
    if (!normalised[col]) {
      return {
        date: "",
        type: "income",
        amount: 0,
        error: `Kolom ${col} wajib diisi.`,
        raw: row,
      };
    }
  }

  const parsedDate = normalised.date ? new Date(normalised.date as string) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return {
      date: String(normalised.date ?? ""),
      type: "income",
      amount: 0,
      error: "Tanggal tidak valid",
      raw: row,
    };
  }

  const isoDate = parsedDate.toISOString().split("T")[0] ?? "";
  const typeString = String(normalised.type ?? "").toLowerCase().trim();
  const transactionType = typeString === "income" || typeString === "pemasukan" ? "income" : typeString === "expense" || typeString === "pengeluaran" ? "expense" : null;

  if (!transactionType) {
    return {
      date: isoDate,
      type: "income",
      amount: 0,
      error: "Jenis harus income/pemasukan atau expense/pengeluaran",
      raw: row,
    };
  }

  const amountNumber = Number(normalised.amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    return {
      date: isoDate,
      type: transactionType,
      amount: 0,
      error: "Jumlah harus angka positif",
      raw: row,
    };
  }

  return {
    date: isoDate,
    type: transactionType,
    amount: amountNumber,
    category: String(normalised.category ?? "").trim() || undefined,
    note: String(normalised.note ?? "").trim() || undefined,
    raw: row,
  };
}

function downloadTemplate() {
  const header = ["date", "type", "amount", "category", "note"];
  const exampleRow = ["2025-01-01", "income", "250000", "Penjualan Online", "Catatan opsional"];
  const worksheet = XLSX.utils.aoa_to_sheet([header, exampleRow]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, "template-import-sinaik.xlsx");
}

