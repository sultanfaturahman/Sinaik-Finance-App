import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Info, Settings, PlusCircle, X, NotebookPen } from 'lucide-react';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/app/AppShell';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListSkeleton } from '@/components/ui/ListSkeleton';
import { ExcelImport } from '@/components/ExcelImport';
import { ExcelExport } from '@/components/ExcelExport';
import { useCategorySuggestions } from '@/hooks/useCategorySuggestions';
import { useIsMobile } from '@/hooks/use-mobile';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionItemCard } from '@/components/transactions/TransactionItemCard';
import { TemplateList } from '@/components/transactions/TemplateList';
import { BulkOperationsToolbar } from '@/components/transactions/BulkOperationsToolbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Transaction } from '@/types/transaction';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { suggestions, addSuggestion, bulkAddSuggestions, removeSuggestion } = useCategorySuggestions();
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const supabase = await getSupabaseClient();
    const { data, error: queryError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (queryError) {
      console.error('Error fetching transactions', queryError);
      setError('Gagal memuat transaksi');
    } else if (data) {
      setTransactions(data as Transaction[]);
      bulkAddSuggestions(data.map((transaction) => transaction.category));
      setSelectedIds(new Set());
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const transactionData = {
      user_id: user.id,
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category.trim(),
      date: formData.date,
      note: formData.note || null,
      source: 'manual' as const,
    };

    if (!transactionData.category) {
      toast.error('Kategori tidak boleh kosong');
      return;
    }

    const supabase = await getSupabaseClient();
    if (editingId) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', editingId);

      if (updateError) {
        toast.error('Gagal memperbarui transaksi');
        return;
      }

      toast.success('Transaksi berhasil diperbarui');
      addSuggestion(transactionData.category);
    } else {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (insertError) {
        toast.error('Gagal menambahkan transaksi');
        return;
      }

      toast.success('Transaksi berhasil ditambahkan');
      addSuggestion(transactionData.category);
    }

    setDialogOpen(false);
    resetForm();
    fetchTransactions();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      date: transaction.date,
      note: transaction.note || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;

    const supabase = await getSupabaseClient();
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      toast.error('Gagal menghapus transaksi');
      return;
    }

    toast.success('Transaksi berhasil dihapus');
    fetchTransactions();
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(transactions.map((transaction) => transaction.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setEditingId(null);
  };

  const bottomAction = isMobile ? (
    <Button
      className="w-full gap-2 rounded-2xl py-4 text-base font-semibold"
      onClick={() => setDialogOpen(true)}
    >
      <Plus className="h-5 w-5" />
      Tambah Transaksi
    </Button>
  ) : undefined;

  return (
    <AppShell
      title="Transaksi"
      subtitle="Kelola pemasukan dan pengeluaran harian Anda"
      bottomAction={bottomAction}
    >
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Daftar Transaksi</TabsTrigger>
          <TabsTrigger value="templates">Template</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex min-w-0 flex-col gap-6">
            <Section
              title="Catatan Harian / Bulanan"
              description="Ringkasan cepat kini dipindahkan ke modul Catatan agar tidak bercampur dengan transaksi manual atau impor."
              actions={
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/notes">
                    <NotebookPen className="h-4 w-4" />
                    <span>Buka Modul Catatan</span>
                  </Link>
                </Button>
              }
            >
              <Alert className="border-dashed border-brand/30 bg-brand/5">
                <Info className="h-4 w-4 text-brand" />
                <AlertDescription className="text-sm text-muted-foreground">
                  Gunakan tombol di atas untuk menyimpan ringkasan pemasukan/pengeluaran tanpa mengganggu transaksi.
                </AlertDescription>
              </Alert>
            </Section>

            <Section
              title="Aksi Cepat"
              description="Gunakan import untuk upload massal atau export untuk backup laporan."
              actions={
                <div className="grid grid-cols-1 gap-2 md:flex md:items-center">
                  <ExcelExport className="w-full md:w-auto" />
                  <ExcelImport
                    onImportComplete={fetchTransactions}
                    onCategoriesImported={bulkAddSuggestions}
                  />
                </div>
              }
            >
              <Alert className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm text-muted-foreground">
                  <strong>Tips:</strong> Sistem otomatis mendeteksi duplikat berdasarkan tanggal, jenis,
                  kategori, dan jumlah yang sama.
                </AlertDescription>
              </Alert>
            </Section>

            <Section
              title="Daftar Transaksi"
              actions={
                !isMobile && (
                  <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Tambah Transaksi</span>
                  </Button>
                )
              }
            >
              {loading ? (
                <ListSkeleton rows={5} columns={7} />
              ) : error ? (
                <ErrorState
                  description={error}
                  action={
                    <Button onClick={fetchTransactions} className="w-full md:w-auto">
                      Coba Lagi
                    </Button>
                  }
                />
              ) : transactions.length === 0 ? (
                <EmptyState
                  icon={<Info className="h-5 w-5" />}
                  title="Belum ada transaksi"
                  description="Tambahkan transaksi manual atau import dari Excel untuk mulai memantau arus kas."
                  action={
                    <>
                      <Button onClick={() => setDialogOpen(true)} className="w-full">
                        Tambah Manual
                      </Button>
                      <ExcelImport
                        onImportComplete={fetchTransactions}
                        onCategoriesImported={bulkAddSuggestions}
                      />
                    </>
                  }
                />
              ) : (
                <>
                  <BulkOperationsToolbar
                    selectedIds={selectedIds}
                    availableCategories={suggestions}
                    onClearSelection={clearSelection}
                    onActionComplete={fetchTransactions}
                  />
                  {isMobile ? (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <TransactionItemCard
                          key={transaction.id}
                          transaction={transaction}
                          selected={selectedIds.has(transaction.id)}
                          onToggleSelect={toggleSelect}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  ) : (
                    <TransactionTable
                      data={transactions}
                      selectedIds={selectedIds}
                      onToggleSelect={toggleSelect}
                      onToggleSelectAll={toggleSelectAll}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  )}
                </>
              )}
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <TemplateList onTransactionCreated={fetchTransactions} />
        </TabsContent>
      </Tabs>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
        editingId={editingId}
        formData={formData}
        suggestions={suggestions}
        onFormChange={setFormData}
        onSubmit={handleSubmit}
        onOpenCategoryManager={() => setCategoryManagerOpen(true)}
      />

      <CategoryManagerDialog
        open={categoryManagerOpen}
        onOpenChange={(open) => {
          setCategoryManagerOpen(open);
          if (!open) setNewSuggestion('');
        }}
        suggestions={suggestions}
        newSuggestion={newSuggestion}
        onSuggestionChange={setNewSuggestion}
        addSuggestion={addSuggestion}
        removeSuggestion={removeSuggestion}
      />
    </AppShell>
  );
};

interface TransactionDialogProps {
  open: boolean;
  editingId: string | null;
  formData: {
    type: 'income' | 'expense';
    amount: string;
    category: string;
    date: string;
    note: string;
  };
  suggestions: string[];
  onFormChange: (value: TransactionDialogProps['formData']) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onOpenChange: (open: boolean) => void;
  onOpenCategoryManager: () => void;
}

const TransactionDialog = ({
  open,
  editingId,
  formData,
  suggestions,
  onFormChange,
  onSubmit,
  onOpenChange,
  onOpenCategoryManager,
}: TransactionDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>
      <span />
    </DialogTrigger>
    <DialogContent className="max-w-[95vw] sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{editingId ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Jenis</Label>
          <Select
            value={formData.type}
            onValueChange={(value: 'income' | 'expense') =>
              onFormChange({ ...formData, type: value })
            }
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
        <div className="space-y-2">
          <Label>Jumlah</Label>
          <Input
            type="number"
            placeholder="100000"
            value={formData.amount}
            onChange={(event) => onFormChange({ ...formData, amount: event.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Kategori</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onOpenCategoryManager}
            >
              <Settings className="mr-1 h-3.5 w-3.5" />
              Kelola
            </Button>
          </div>
          <Input
            type="text"
            placeholder="Penjualan produk"
            value={formData.category}
            onChange={(event) => onFormChange({ ...formData, category: event.target.value })}
            required
            list="category-suggestions"
          />
          {suggestions.length > 0 && (
            <>
              <datalist id="category-suggestions">
                {suggestions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.slice(0, 10).map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onFormChange({ ...formData, category })}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="space-y-2">
          <Label>Tanggal</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(event) => onFormChange({ ...formData, date: event.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Catatan (opsional)</Label>
          <Input
            type="text"
            placeholder="Catatan tambahan"
            value={formData.note}
            onChange={(event) => onFormChange({ ...formData, note: event.target.value })}
          />
        </div>
        <Button type="submit" className="w-full">
          {editingId ? 'Perbarui' : 'Simpan'}
        </Button>
      </form>
    </DialogContent>
  </Dialog>
);

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: string[];
  newSuggestion: string;
  onSuggestionChange: (value: string) => void;
  addSuggestion: (category: string) => void;
  removeSuggestion: (category: string) => void;
}

const CategoryManagerDialog = ({
  open,
  onOpenChange,
  suggestions,
  newSuggestion,
  onSuggestionChange,
  addSuggestion,
  removeSuggestion,
}: CategoryManagerDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[95vw] sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Kelola Kategori Transaksi</DialogTitle>
        <DialogDescription>
          Tambahkan kategori baru agar muncul sebagai rekomendasi cepat saat mencatat transaksi
          berikutnya.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr,auto]">
          <Input
            placeholder="Masukkan kategori baru"
            value={newSuggestion}
            onChange={(event) => onSuggestionChange(event.target.value)}
          />
          <Button
            type="button"
            onClick={() => {
              const trimmed = newSuggestion.trim();
              if (!trimmed) {
                toast.error('Nama kategori tidak boleh kosong');
                return;
              }
              addSuggestion(trimmed);
              onSuggestionChange('');
              toast.success('Kategori berhasil ditambahkan');
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah
          </Button>
        </div>

        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada kategori. Tambahkan minimal satu kategori agar lebih cepat saat mencatat
            transaksi.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((category) => (
              <Button
                key={category}
                type="button"
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  removeSuggestion(category);
                  toast.success(`Kategori "${category}" dihapus`);
                }}
              >
                {category}
                <X className="h-3 w-3" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export default Transactions;
