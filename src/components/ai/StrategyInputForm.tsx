import { StrategyFormState } from "@/types/strategy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReactNode } from "react";

interface StrategyInputFormProps {
  value: StrategyFormState;
  onChange: (next: StrategyFormState) => void;
  disabled?: boolean;
  onTouch?: () => void;
}

const SectionGroup = ({ title, description, children }: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <div className="space-y-3 rounded-2xl border border-border/70 bg-background p-4">
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground leading-snug mt-1">{description}</p>
      )}
    </div>
    <div className="grid gap-3">{children}</div>
  </div>
);

export const StrategyInputForm = ({
  value,
  onChange,
  disabled,
  onTouch,
}: StrategyInputFormProps) => {
  const updateValue = (updater: (current: StrategyFormState) => StrategyFormState) => {
    onChange(updater(value));
    onTouch?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesuaikan Konteks Bisnis</CardTitle>
        <CardDescription>
          Informasi ini akan dipakai sebagai ringkasan input AI agar strategi yang dihasilkan relevan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionGroup
          title="Profil Usaha"
          description="Gambaran singkat tentang bisnis dan pelanggan utama."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-business-name">Nama usaha</Label>
              <Input
                id="profile-business-name"
                value={value.profile.businessName}
                onChange={(event) =>
                  updateValue((current) => ({
                    ...current,
                    profile: { ...current.profile, businessName: event.target.value },
                  }))
                }
                placeholder="Contoh: Warung Kopi SiNaik"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-sector">Sektor / industri</Label>
              <Input
                id="profile-sector"
                value={value.profile.sector}
                onChange={(event) =>
                  updateValue((current) => ({
                    ...current,
                    profile: { ...current.profile, sector: event.target.value },
                  }))
                }
                placeholder="Contoh: Food & Beverage"
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-target-market">Target pelanggan utama</Label>
              <Input
                id="profile-target-market"
                value={value.profile.targetMarket}
                onChange={(event) =>
                  updateValue((current) => ({
                    ...current,
                    profile: { ...current.profile, targetMarket: event.target.value },
                  }))
                }
                placeholder="Contoh: Pekerja kantoran di Cilegon"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-team-size">Jumlah tim</Label>
              <Input
                id="profile-team-size"
                value={value.profile.teamSize}
                onChange={(event) =>
                  updateValue((current) => ({
                    ...current,
                    profile: { ...current.profile, teamSize: event.target.value },
                  }))
                }
                placeholder="Contoh: 5 orang"
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-differentiator">Keunggulan utama</Label>
            <Textarea
              id="profile-differentiator"
              value={value.profile.differentiator}
              onChange={(event) =>
                updateValue((current) => ({
                  ...current,
                  profile: { ...current.profile, differentiator: event.target.value },
                }))
              }
              placeholder="Contoh: Menu kopi berbahan lokal dengan kemasan ramah lingkungan."
              disabled={disabled}
            />
          </div>
        </SectionGroup>

        <SectionGroup
          title="Ringkasan Finansial"
          description="Isi angka terbaru agar AI memahami kondisi keuangan secara cepat."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="financial-revenue">Total pemasukan YTD</Label>
              <Input
                id="financial-revenue"
                inputMode="numeric"
                value={value.financialSummary.revenueYtd}
                onChange={(event) =>
                  updateValue((current) => ({
                    ...current,
                    financialSummary: {
                      ...current.financialSummary,
                      revenueYtd: event.target.value,
                    },
                  }))
                }
                placeholder="Contoh: 150000000"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financial-expense">Total pengeluaran YTD</Label>
              <Input
                id="financial-expense"
                inputMode="numeric"
                value={value.financialSummary.expenseYtd}
                onChange={(event) =>
                  updateValue((current) => ({
                    ...current,
                    financialSummary: {
                      ...current.financialSummary,
                      expenseYtd: event.target.value,
                    },
                  }))
                }
                placeholder="Contoh: 90000000"
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="financial-net-profit">Laba bersih YTD</Label>
              <Input
                id="financial-net-profit"
                inputMode="numeric"
                value={value.financialSummary.netProfitYtd}
                onChange={(event) =>
                  updateValue((current) => ({
                    ...current,
                    financialSummary: {
                      ...current.financialSummary,
                      netProfitYtd: event.target.value,
                    },
                  }))
                }
                placeholder="Contoh: 60000000"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financial-margin">Profit margin (%)</Label>
              <Input
                id="financial-margin"
                inputMode="decimal"
                value={value.financialSummary.profitMargin}
                onChange={(event) =>
                  updateValue((current) => ({
                    ...current,
                    financialSummary: {
                      ...current.financialSummary,
                      profitMargin: event.target.value,
                    },
                  }))
                }
                placeholder="Contoh: 28"
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="financial-trend">Catatan trend penting</Label>
            <Textarea
              id="financial-trend"
              value={value.financialSummary.noteworthyTrend}
              onChange={(event) =>
                updateValue((current) => ({
                  ...current,
                  financialSummary: {
                    ...current.financialSummary,
                    noteworthyTrend: event.target.value,
                  },
                }))
              }
              placeholder="Contoh: Penjualan online naik 15% dalam 2 bulan terakhir, biaya iklan melonjak."
              disabled={disabled}
            />
          </div>
        </SectionGroup>

        <SectionGroup
          title="Tujuan Strategis"
          description="Beritahu AI arah yang ingin dicapai dalam 1-3 bulan ke depan."
        >
          <div className="space-y-2">
            <Label htmlFor="goals-primary">Tujuan utama (SMART)</Label>
            <Textarea
              id="goals-primary"
              value={value.goals.primary}
              onChange={(event) =>
                updateValue((current) => ({
                  ...current,
                  goals: { ...current.goals, primary: event.target.value },
                }))
              }
              placeholder="Contoh: Tingkatkan omzet bulanan 25% dalam 3 bulan dengan fokus penjualan online."
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goals-secondary">Prioritas pendukung</Label>
            <Textarea
              id="goals-secondary"
              value={value.goals.secondary}
              onChange={(event) =>
                updateValue((current) => ({
                  ...current,
                  goals: { ...current.goals, secondary: event.target.value },
                }))
              }
              placeholder="Contoh: Stabilkan cashflow dan kurangi stok mengendap."
              disabled={disabled}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="goals-timeframe">Target waktu</Label>
              <Input
                id="goals-timeframe"
                value={value.goals.timeframe}
                onChange={(event) =>
                  updateValue((current) => ({
                    ...current,
                    goals: { ...current.goals, timeframe: event.target.value },
                  }))
                }
                placeholder="Contoh: 3 bulan"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals-risks">Risiko / kendala utama</Label>
              <Input
                id="goals-risks"
                value={value.goals.risks}
                onChange={(event) =>
                  updateValue((current) => ({
                    ...current,
                    goals: { ...current.goals, risks: event.target.value },
                  }))
                }
                placeholder="Contoh: Modal promosi terbatas, SDM sales minim."
                disabled={disabled}
              />
            </div>
          </div>
        </SectionGroup>
      </CardContent>
    </Card>
  );
};
