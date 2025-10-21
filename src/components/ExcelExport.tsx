import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const ExcelExport = () => {
  const { user } = useAuth();

  const handleExport = async () => {
    if (!user) return;

    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, type, category, amount, note, source')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast.error('Gagal mengambil data transaksi');
        return;
      }

      if (!transactions || transactions.length === 0) {
        toast.error('Tidak ada transaksi untuk diexport');
        return;
      }

      // Format data untuk Excel
      const excelData = transactions.map(t => ({
        Tanggal: t.date,
        Jenis: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        Kategori: t.category,
        Jumlah: t.amount,
        Catatan: t.note || '',
        Sumber: t.source === 'manual' ? 'Input Manual' : t.source === 'excel' ? 'Import Excel' : 'PWA',
      }));

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

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `transaksi-sinaik-${date}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      toast.success('Data berhasil diexport!');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Gagal mengexport data');
    }
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export Excel
    </Button>
  );
};
