import { useEffect, useState } from "react";
import { AppShell } from "@/app/AppShell";
import { Section } from "@/components/ui/Section";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

const Settings = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [language, setLanguage] = useState("id");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <AppShell title="Pengaturan" subtitle="Sesuaikan preferensi tampilan dan notifikasi">
      <div className="flex flex-col gap-6">
        <Section title="Tampilan" description="Sesuaikan tema dan pengalaman penggunaan.">
          <div className="rounded-2xl border bg-background p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Mode Gelap</p>
                <p className="text-xs text-muted-foreground">
                  Aktifkan tema gelap untuk kenyamanan di malam hari.
                </p>
              </div>
              <Switch
                checked={isDark}
                disabled={!mounted}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Toggle dark mode"
              />
            </div>
          </div>
          <div className="rounded-2xl border bg-background p-4">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Bahasa aplikasi
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Section title="Notifikasi" description="Atur ringkasan laporan yang ingin Anda terima.">
          <div className="rounded-2xl border bg-background p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Ringkasan mingguan</p>
                <p className="text-xs text-muted-foreground">
                  Kirimkan insight penjualan dan pengeluaran ke email saya.
                </p>
              </div>
              <Switch
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
                aria-label="Toggle weekly digest"
              />
            </div>
          </div>
        </Section>

        <Section title="Keamanan" description="Kelola sesi dan data tersimpan di perangkat ini.">
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" className="h-auto justify-start rounded-2xl border-dashed bg-background px-4 py-3">
              Bersihkan cache perangkat
            </Button>
            <Button variant="outline" className="h-auto justify-start rounded-2xl border-dashed bg-background px-4 py-3">
              Kelola perangkat masuk
            </Button>
          </div>
        </Section>
      </div>
    </AppShell>
  );
};

export default Settings;

