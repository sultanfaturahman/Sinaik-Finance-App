import { AppShell } from "@/app/AppShell";
import { Section } from "@/components/ui/Section";
import { ExcelExport } from "@/components/ExcelExport";
import { useToast } from "@/components/ui/use-toast";
import { ImportWizard, ImportRow } from "@/components/import/ImportWizard";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ImportExport = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCommit = async (rows: ImportRow[]) => {
    if (!user) {
      toast({ title: "Anda belum login", variant: "destructive" });
      return;
    }

    const payload = rows.map((row) => ({
      user_id: user.id,
      type: row.type,
      amount: row.amount,
      category: row.category ?? "Lainnya",
      date: row.date,
      note: row.note ?? null,
      source: "excel" as const,
    }));

    const supabase = await getSupabaseClient();
    const { error } = await supabase.from("transactions").insert(payload);
    if (error) {
      toast({
        title: "Gagal menyimpan",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Import selesai",
      description: `${payload.length} transaksi berhasil ditambahkan.`,
    });
  };

  return (
    <AppShell
      title="Import & Export"
      subtitle="Kelola data transaksi dalam jumlah besar secara efisien"
    >
      <div className="flex flex-col gap-6">
        <ImportWizard
          onCommit={handleCommit}
          dedupeKey={(row) =>
            [user?.id ?? "", row.date, row.type, row.amount, row.category ?? "", row.note ?? ""].join(
              "|"
            )
          }
        />

        <Section
          title="Export Transaksi"
          description="Unduh laporan transaksi untuk dibagikan atau dicadangkan."
        >
          <ExcelExport />
        </Section>
      </div>
    </AppShell>
  );
};

export default ImportExport;

