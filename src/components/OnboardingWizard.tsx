import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Check, ChevronLeft, Plus, Sparkles } from 'lucide-react';
import {
  SECTOR_PRESETS,
  SectorId,
  SectorPreset,
} from '@/constants/categoryPresets';
import { useCategorySuggestions } from '@/hooks/useCategorySuggestions';

const STEPS = [
  {
    id: 0,
    title: 'Pilih Sektor Usaha',
    description: 'Sesuaikan preset kategori dengan jenis usaha utama Anda.',
  },
  {
    id: 1,
    title: 'Sesuaikan Kategori',
    description: 'Pilih kategori pemasukan dan pengeluaran yang paling sering digunakan.',
  },
  {
    id: 2,
    title: 'Siap Memulai',
    description: 'Kami siapkan tips dan panduan singkat agar pencatatan pertama lancar.',
  },
];

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

export const OnboardingWizard = ({
  open,
  onOpenChange,
  onCompleted,
}: OnboardingWizardProps) => {
  const {
    sector,
    setSector,
    completeOnboarding,
  } = useCategorySuggestions();

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedSector, setSelectedSector] = useState<SectorPreset | null>(sector);
  const [incomeSelection, setIncomeSelection] = useState<string[]>([]);
  const [expenseSelection, setExpenseSelection] = useState<string[]>([]);
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('income');
  const [newCategoryValue, setNewCategoryValue] = useState('');

  useEffect(() => {
    if (sector) {
      setSelectedSector(sector);
      setIncomeSelection(sector.incomeSuggestions);
      setExpenseSelection(sector.expenseSuggestions);
      setStepIndex(1);
    } else {
      setIncomeSelection([]);
      setExpenseSelection([]);
      setStepIndex(0);
    }
  }, [sector]);

  useEffect(() => {
    if (!open) {
      setStepIndex(sector ? 1 : 0);
      setNewCategoryValue('');
      setNewCategoryType('income');
    }
  }, [open, sector]);

  const progressValue = useMemo(() => ((stepIndex + 1) / STEPS.length) * 100, [stepIndex]);

  const handleSelectSector = (preset: SectorPreset) => {
    setSelectedSector(preset);
    setIncomeSelection(preset.incomeSuggestions);
    setExpenseSelection(preset.expenseSuggestions);
    setStepIndex(1);
  };

  const toggleCategory = (type: 'income' | 'expense', value: string) => {
    if (type === 'income') {
      setIncomeSelection((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
      );
    } else {
      setExpenseSelection((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
      );
    }
  };

  const handleAddNewCategory = () => {
    const trimmed = newCategoryValue.trim();
    if (!trimmed) return;

    toggleCategory(newCategoryType, trimmed);
    setNewCategoryValue('');
  };

  const goNext = () => {
    if (stepIndex === 0 && !selectedSector) return;
    if (stepIndex === 1 && incomeSelection.length === 0 && expenseSelection.length === 0) return;

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const goBack = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleFinish = () => {
    if (!selectedSector) return;

    setSector(selectedSector.id as SectorId);
    completeOnboarding([...incomeSelection, ...expenseSelection]);
    onCompleted?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{STEPS[stepIndex].title}</span>
            <Badge variant="outline" className="text-xs">
              Langkah {stepIndex + 1} dari {STEPS.length}
            </Badge>
          </DialogTitle>
          <DialogDescription>{STEPS[stepIndex].description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={progressValue} className="h-1.5" />

          {stepIndex === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {SECTOR_PRESETS.map((preset) => {
                const isSelected = selectedSector?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectSector(preset)}
                    className={`group rounded-xl border p-4 text-left transition hover:shadow-md focus:outline-none ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{preset.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
                      </div>
                      {isSelected && (
                        <Badge className="bg-primary">
                          <Check className="mr-1 h-3 w-3" /> Terpilih
                        </Badge>
                      )}
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      {preset.incomeSuggestions.length} pemasukan · {preset.expenseSuggestions.length} pengeluaran
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {stepIndex === 1 && selectedSector && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Kategori Pemasukan
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSector.incomeSuggestions.map((item) => {
                    const active = incomeSelection.includes(item);
                    return (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant={active ? 'default' : 'outline'}
                        onClick={() => toggleCategory('income', item)}
                        className={active ? '' : 'bg-muted'}
                      >
                        {item}
                      </Button>
                    );
                  })}
                  {incomeSelection
                    .filter((item) => !selectedSector.incomeSuggestions.includes(item))
                    .map((item) => (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => toggleCategory('income', item)}
                      >
                        {item}
                      </Button>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Kategori Pengeluaran
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSector.expenseSuggestions.map((item) => {
                    const active = expenseSelection.includes(item);
                    return (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant={active ? 'default' : 'outline'}
                        onClick={() => toggleCategory('expense', item)}
                        className={active ? '' : 'bg-muted'}
                      >
                        {item}
                      </Button>
                    );
                  })}
                  {expenseSelection
                    .filter((item) => !selectedSector.expenseSuggestions.includes(item))
                    .map((item) => (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => toggleCategory('expense', item)}
                      >
                        {item}
                      </Button>
                    ))}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Tambah kategori baru
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr,160px,120px]">
                  <div className="space-y-2">
                    <Label htmlFor="new-category">Nama kategori</Label>
                    <Input
                      id="new-category"
                      placeholder="Contoh: Delivery Gojek"
                      value={newCategoryValue}
                      onChange={(event) => setNewCategoryValue(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis</Label>
                    <Select
                      value={newCategoryType}
                      onValueChange={(value: 'income' | 'expense') => setNewCategoryType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Pemasukan</SelectItem>
                        <SelectItem value="expense">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button type="button" className="w-full" onClick={handleAddNewCategory}>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {stepIndex === 2 && selectedSector && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-primary/5 p-4">
                <h3 className="text-base font-semibold text-primary mb-2">Paket kategori siap pakai</h3>
                <p className="text-sm text-muted-foreground">
                  Kami telah menyiapkan <strong>{incomeSelection.length}</strong> kategori pemasukan
                  dan <strong>{expenseSelection.length}</strong> kategori pengeluaran untuk usaha{' '}
                  <strong>{selectedSector.title}</strong>. Anda selalu bisa menambah atau menghapus kategori kapan pun.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {selectedSector.highlights.map((tip) => (
                  <div key={tip} className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
                    {tip}
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Setelah selesai, kategori ini akan muncul sebagai rekomendasi otomatis saat Anda menambah transaksi,
                  sehingga pencatatan harian jadi lebih cepat dan konsisten.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Kembali
            </Button>
            <div className="flex gap-2">
              {stepIndex < STEPS.length - 1 && (
                <Button type="button" onClick={goNext} disabled={stepIndex === 0 && !selectedSector}>
                  Lanjut
                </Button>
              )}
              {stepIndex === STEPS.length - 1 && (
                <Button type="button" onClick={handleFinish}>
                  Selesai & Mulai Catat
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

