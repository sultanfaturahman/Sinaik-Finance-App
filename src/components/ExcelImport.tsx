import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ExcelRow {
  tanggal: string;
  jenis: string;
  kategori: string;
  jumlah: number;
  catatan?: string;
}

interface ParsedTransaction {
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note: string | null;
  isDuplicate: boolean;
  error?: string;
}

export const ExcelImport = ({ onImportComplete }: { onImportComplete: () => void }) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [importing, setImporting] = useState(false);

  const checkDuplicate = async (transaction: Omit<ParsedTransaction, 'isDuplicate' | 'error'>) => {
    if (!user) return false;

    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', transaction.date)
      .eq('type', transaction.type)
      .eq('category', transaction.category)
      .eq('amount', transaction.amount)
      .limit(1);

    if (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }

    return data && data.length > 0;
  };

  const parseExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

      if (jsonData.length === 0) {
        toast.error('File Excel kosong');
        return;
      }

      // Validate and parse each row
      const parsed: ParsedTransaction[] = [];

      for (const row of jsonData) {
        const transaction: Partial<ParsedTransaction> = {};
        let error: string | undefined;

        // Validate date
        if (!row.tanggal) {
          error = 'Tanggal tidak boleh kosong';
        } else {
          // Try to parse date in various formats
          let dateObj: Date;
          if (typeof row.tanggal === 'number') {
            // Excel serial date
            dateObj = XLSX.SSF.parse_date_code(row.tanggal);
          } else {
            dateObj = new Date(row.tanggal);
          }
          
          if (isNaN(dateObj.getTime())) {
            error = 'Format tanggal tidak valid';
          } else {
            transaction.date = dateObj.toISOString().split('T')[0];
          }
        }

        // Validate type
        if (!row.jenis) {
          error = 'Jenis tidak boleh kosong';
        } else {
          const jenis = row.jenis.toLowerCase().trim();
          if (jenis === 'pemasukan' || jenis === 'income') {
            transaction.type = 'income';
          } else if (jenis === 'pengeluaran' || jenis === 'expense') {
            transaction.type = 'expense';
          } else {
            error = 'Jenis harus "Pemasukan" atau "Pengeluaran"';
          }
        }

        // Validate category
        if (!row.kategori || row.kategori.trim() === '') {
          error = 'Kategori tidak boleh kosong';
        } else {
          transaction.category = row.kategori.trim();
        }

        // Validate amount
        if (!row.jumlah || isNaN(Number(row.jumlah)) || Number(row.jumlah) <= 0) {
          error = 'Jumlah harus berupa angka positif';
        } else {
          transaction.amount = Number(row.jumlah);
        }

        // Note is optional
        transaction.note = row.catatan?.trim() || null;

        // Check for duplicates only if no validation errors
        let isDuplicate = false;
        if (!error && transaction.date && transaction.type && transaction.category && transaction.amount !== undefined) {
          isDuplicate = await checkDuplicate({
            date: transaction.date,
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            note: transaction.note,
          });
        }

        parsed.push({
          date: transaction.date || '',
          type: transaction.type || 'income',
          category: transaction.category || '',
          amount: transaction.amount || 0,
          note: transaction.note || null,
          isDuplicate,
          error,
        });
      }

      setParsedData(parsed);
      setDialogOpen(true);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast.error('Gagal membaca file Excel');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Format file harus .xlsx atau .xls');
      return;
    }

    parseExcelFile(file);
    e.target.value = ''; // Reset input
  };

  const handleImport = async () => {
    if (!user) return;

    // Filter out duplicates and errors
    const validTransactions = parsedData.filter(t => !t.isDuplicate && !t.error);

    if (validTransactions.length === 0) {
      toast.error('Tidak ada transaksi valid untuk diimport');
      return;
    }

    setImporting(true);

    try {
      const transactionsToInsert = validTransactions.map(t => ({
        user_id: user.id,
        date: t.date,
        type: t.type,
        category: t.category,
        amount: t.amount,
        note: t.note,
        source: 'excel' as const,
      }));

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) {
        console.error('Error importing:', error);
        toast.error('Gagal mengimport transaksi');
        return;
      }

      toast.success(`Berhasil mengimport ${validTransactions.length} transaksi`);
      setDialogOpen(false);
      setParsedData([]);
      onImportComplete();
    } catch (error) {
      console.error('Error importing:', error);
      toast.error('Terjadi kesalahan saat import');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        tanggal: '2025-01-15',
        jenis: 'Pemasukan',
        kategori: 'Penjualan Produk',
        jumlah: 500000,
        catatan: 'Penjualan hari ini',
      },
      {
        tanggal: '2025-01-15',
        jenis: 'Pengeluaran',
        kategori: 'Beli Bahan Baku',
        jumlah: 200000,
        catatan: 'Bahan untuk produksi',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template-transaksi-sinaik.xlsx');
  };

  const validCount = parsedData.filter(t => !t.isDuplicate && !t.error).length;
  const duplicateCount = parsedData.filter(t => t.isDuplicate).length;
  const errorCount = parsedData.filter(t => t.error).length;

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={downloadTemplate}>
          <Upload className="h-4 w-4 mr-2" />
          Download Template
        </Button>
        <div className="relative">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Import Excel</DialogTitle>
            <DialogDescription>
              Review data sebelum diimport. Transaksi duplikat akan dilewati.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="default" className="bg-success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Valid: {validCount}
              </Badge>
              {duplicateCount > 0 && (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Duplikat: {duplicateCount}
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Error: {errorCount}
                </Badge>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((transaction, index) => (
                    <TableRow key={index} className={transaction.error ? 'bg-destructive/5' : transaction.isDuplicate ? 'bg-muted' : ''}>
                      <TableCell>
                        {transaction.error ? (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        ) : transaction.isDuplicate ? (
                          <Badge variant="secondary" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Duplikat
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-success text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{transaction.date || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </TableCell>
                      <TableCell className="text-sm">{transaction.category || '-'}</TableCell>
                      <TableCell className="text-sm font-medium">
                        Rp {transaction.amount.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transaction.error ? (
                          <span className="text-destructive">{transaction.error}</span>
                        ) : (
                          transaction.note || '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}
              >
                {importing ? 'Mengimport...' : `Import ${validCount} Transaksi`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
