import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { loadXlsx } from '@/lib/loadXlsx';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type MonthOption = 'all' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

interface ExcelExportProps extends ButtonProps {
  defaultYear?: number;
  defaultMonth?: MonthOption | number;
}

const monthOptions: { value: MonthOption; label: string }[] = [
  { value: 'all', label: 'Semua bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const monthLabelMap = new Map(monthOptions.map((option) => [option.value, option.label]));

export const ExcelExport = ({
  className,
  defaultYear,
  defaultMonth,
  ...buttonProps
}: ExcelExportProps) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(String(defaultYear ?? new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<MonthOption>('all');

  useEffect(() => {
    if (defaultYear) {
      setSelectedYear(String(defaultYear));
    }
  }, [defaultYear]);

  useEffect(() => {
    if (defaultMonth === undefined || defaultMonth === null) return;
    const normalized =
      typeof defaultMonth === 'number'
        ? (String(defaultMonth) as MonthOption)
        : defaultMonth;
    setSelectedMonth(normalized);
  }, [defaultMonth]);

  const periodLabel = useMemo(() => {
    const year = Number(selectedYear);
    if (!Number.isFinite(year)) return '';
    if (selectedMonth === 'all') return `Tahun ${year}`;
    const monthLabel = monthLabelMap.get(selectedMonth) ?? '';
    return `${monthLabel} ${year}`.trim();
  }, [selectedYear, selectedMonth]);

  const buildDateRange = () => {
    const year = Number(selectedYear);
    if (!Number.isFinite(year) || year < 1900) {
      return null;
    }

    if (selectedMonth === 'all') {
      const startDate = new Date(Date.UTC(year, 0, 1));
      const endDate = new Date(Date.UTC(year, 11, 31));
      return {
        year,
        month: null,
        start: startDate.toISOString().slice(0, 10),
        end: endDate.toISOString().slice(0, 10),
      };
    }

    const monthNumber = Number(selectedMonth);
    if (!Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return null;
    }
    const startDate = new Date(Date.UTC(year, monthNumber - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNumber, 0));
    return {
      year,
      month: monthNumber,
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
    };
  };

  const handleExport = async () => {
    if (!user) return;
    const range = buildDateRange();
    if (!range) {
      toast.error('Tahun atau bulan tidak valid');
      return;
    }

    try {
      setExporting(true);
      const XLSX = await loadXlsx();
      const supabase = await getSupabaseClient();
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, type, category, amount, note, source')
        .eq('user_id', user.id)
        .gte('date', range.start)
        .lte('date', range.end)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Gagal mengambil data transaksi');
        return;
      }

      if (!transactions || transactions.length === 0) {
        toast.error('Tidak ada transaksi pada periode ini');
        return;
      }

      // Format data untuk Excel
      let totalIncome = 0;
      let totalExpense = 0;

      const excelData = transactions.map(t => ({
        Tanggal: t.date,
        Jenis: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        Kategori: t.category,
        Jumlah: t.amount,
        Catatan: t.note || '',
        Sumber: t.source === 'manual' ? 'Input Manual' : t.source === 'excel' ? 'Import Excel' : 'PWA',
      }));

      transactions.forEach((transaction) => {
        const amount = Number(transaction.amount) || 0;
        if (transaction.type === 'income') {
          totalIncome += amount;
        } else {
          totalExpense += amount;
        }
      });

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // Tanggal
        { wch: 12 }, // Jenis
        { wch: 25 }, // Kategori
        { wch: 15 }, // Jumlah
        { wch: 30 }, // Catatan
        { wch: 15 }, // Sumber
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');

      const summaryData = [
        { Keterangan: 'Periode', Nilai: periodLabel },
        { Keterangan: 'Total transaksi', Nilai: transactions.length },
        { Keterangan: 'Total pemasukan', Nilai: totalIncome },
        { Keterangan: 'Total pengeluaran', Nilai: totalExpense },
        { Keterangan: 'Laba bersih', Nilai: totalIncome - totalExpense },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 22 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan');

      const filenameSuffix = range.month
        ? `${range.year}-${String(range.month).padStart(2, '0')}`
        : `${range.year}`;
      const filename = `transaksi-sinaik-${filenameSuffix}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      toast.success('Data berhasil diexport!');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Gagal mengexport data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn('w-full lg:w-auto', className)}
          {...buttonProps}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Transaksi</DialogTitle>
          <DialogDescription>
            Pilih periode agar file Excel berisi transaksi sesuai tahun dan bulan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="export-year">Tahun</Label>
            <Input
              id="export-year"
              type="number"
              min={1900}
              max={2100}
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Bulan</Label>
            <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(value as MonthOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {periodLabel && (
            <p className="text-xs text-muted-foreground">
              Periode export: {periodLabel}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
            Batal
          </Button>
          <Button type="button" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Menyiapkan...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
