# Phase 1: Quick Wins - Implementation Guide

**Duration:** Weeks 1-4
**Status:** Ready to Start
**Priority:** P0 (Critical)

---

## Overview

This guide provides step-by-step implementation instructions for Phase 1 quick wins. Each feature includes file structure, code examples, and testing requirements.

---

## Week 1-2: Transaction Templates & Bulk Operations

### Feature 1A: Transaction Templates

**User Story:**
> As a UMKM owner, I want to save frequently used transactions as templates so I can quickly add recurring expenses like rent or utilities without re-entering all details.

#### Database Schema

Create migration: `supabase/migrations/20251030100000_transaction_templates.sql`

```sql
-- Transaction Templates
CREATE TABLE IF NOT EXISTS transaction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Sewa Bulanan", "Gaji Karyawan"
  type transaction_type NOT NULL,
  category TEXT NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
  next_occurrence TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE transaction_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON transaction_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON transaction_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON transaction_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON transaction_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_templates_user_id ON transaction_templates(user_id);
CREATE INDEX idx_templates_recurring ON transaction_templates(is_recurring, next_occurrence)
  WHERE is_recurring = TRUE;

-- Update trigger
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON transaction_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### TypeScript Types

Update `src/integrations/supabase/types.ts` (auto-generated after migration):

```typescript
export interface TransactionTemplate {
  id: string
  user_id: string
  name: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description?: string
  is_recurring: boolean
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  next_occurrence?: string
  created_at: string
  updated_at: string
}
```

#### React Components

**1. Template Dialog**

Create `src/components/transactions/TemplateDialog.tsx`:

```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const templateSchema = z.object({
  name: z.string().min(1, 'Nama template wajib diisi'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Kategori wajib diisi'),
  amount: z.coerce.number().positive('Jumlah harus positif'),
  description: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: TransactionTemplate
}

export const TemplateDialog = ({ open, onOpenChange, template }: TemplateDialogProps) => {
  const queryClient = useQueryClient()
  const isEdit = !!template

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: template || {
      type: 'expense',
      is_recurring: false,
    },
  })

  const isRecurring = watch('is_recurring')

  const saveTemplate = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session?.user) throw new Error('Not authenticated')

      const payload = {
        ...data,
        user_id: session.session.user.id,
        next_occurrence: data.is_recurring
          ? calculateNextOccurrence(data.recurring_frequency!)
          : null,
      }

      if (isEdit) {
        const { error } = await supabase
          .from('transaction_templates')
          .update(payload)
          .eq('id', template.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('transaction_templates')
          .insert([payload])

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-templates'] })
      toast.success(isEdit ? 'Template diperbarui' : 'Template berhasil disimpan')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Gagal menyimpan template: ' + error.message)
    },
  })

  const onSubmit = (data: TemplateFormData) => {
    saveTemplate.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Template' : 'Buat Template Baru'}</DialogTitle>
          <DialogDescription>
            Simpan transaksi berulang sebagai template untuk input cepat
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Template *</Label>
            <Input
              id="name"
              placeholder="contoh: Sewa Bulanan, Gaji Karyawan"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipe *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as 'income' | 'expense')}
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
              <Label htmlFor="amount">Jumlah (Rp) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                {...register('amount')}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Input
              id="category"
              placeholder="contoh: Operasional, Gaji"
              {...register('category')}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              placeholder="Catatan tambahan (opsional)"
              {...register('description')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="recurring">Transaksi Berulang</Label>
              <p className="text-sm text-muted-foreground">
                Otomatis ingatkan untuk transaksi rutin
              </p>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setValue('is_recurring', checked)}
            />
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label>Frekuensi</Label>
              <Select
                value={watch('recurring_frequency')}
                onValueChange={(value) =>
                  setValue('recurring_frequency', value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih frekuensi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saveTemplate.isPending}>
              {saveTemplate.isPending ? 'Menyimpan...' : 'Simpan Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function calculateNextOccurrence(frequency: string): string {
  const now = new Date()
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1)
      break
    case 'weekly':
      now.setDate(now.getDate() + 7)
      break
    case 'monthly':
      now.setMonth(now.getMonth() + 1)
      break
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1)
      break
  }
  return now.toISOString()
}
```

**2. Template List Component**

Create `src/components/transactions/TemplateList.tsx`:

```typescript
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Plus, Trash2, Edit, Copy } from 'lucide-react'
import { TemplateDialog } from './TemplateDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/calculations'

export const TemplateList = () => {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | undefined>()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['transaction-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as TransactionTemplate[]
    },
  })

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transaction_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-templates'] })
      toast.success('Template dihapus')
    },
  })

  const useTemplate = useMutation({
    mutationFn: async (template: TransactionTemplate) => {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session?.user) throw new Error('Not authenticated')

      const { error } = await supabase.from('transactions').insert([
        {
          user_id: session.session.user.id,
          type: template.type,
          category: template.category,
          amount: template.amount,
          description: template.description,
          transaction_date: new Date().toISOString(),
          source: 'pwa',
        },
      ])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transaksi ditambahkan dari template')
    },
  })

  if (isLoading) {
    return <div>Memuat template...</div>
  }

  if (!templates || templates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            title="Belum ada template"
            description="Buat template untuk transaksi yang sering berulang"
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Template Pertama
              </Button>
            }
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Template Transaksi</CardTitle>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Template Baru
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{template.name}</h4>
                    <Badge variant={template.type === 'income' ? 'default' : 'destructive'}>
                      {template.type === 'income' ? 'Masuk' : 'Keluar'}
                    </Badge>
                    {template.is_recurring && (
                      <Badge variant="outline">{template.recurring_frequency}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.category} • {formatCurrency(template.amount)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => useTemplate.mutate(template)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Gunakan
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTemplate(template)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteTemplate.mutate(template.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelectedTemplate(undefined)
        }}
        template={selectedTemplate}
      />
    </>
  )
}
```

**3. Add to Transactions Page**

Modify `src/pages/Transactions.tsx`:

```typescript
// Add import
import { TemplateList } from '@/components/transactions/TemplateList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// In the component, wrap content with tabs
return (
  <AppShell title="Transaksi" subtitle="Kelola pemasukan dan pengeluaran">
    <Tabs defaultValue="transactions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="transactions">Daftar Transaksi</TabsTrigger>
        <TabsTrigger value="templates">Template</TabsTrigger>
      </TabsList>

      <TabsContent value="transactions" className="space-y-4">
        {/* Existing transaction table/cards */}
      </TabsContent>

      <TabsContent value="templates">
        <TemplateList />
      </TabsContent>
    </Tabs>
  </AppShell>
)
```

---

### Feature 1B: Bulk Operations

**User Story:**
> As a UMKM owner, I want to select multiple transactions and perform actions like delete, categorize, or export all at once to save time.

#### Implementation

**1. Bulk Selection State**

Modify `src/components/transactions/TransactionTable.tsx`:

```typescript
import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'

// Add state
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

// Select all handler
const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    setSelectedIds(new Set(transactions.map(t => t.id)))
  } else {
    setSelectedIds(new Set())
  }
}

// Individual selection
const toggleSelect = (id: string, checked: boolean) => {
  const newSet = new Set(selectedIds)
  if (checked) {
    newSet.add(id)
  } else {
    newSet.delete(id)
  }
  setSelectedIds(newSet)
}

// In table header
<TableHead className="w-12">
  <Checkbox
    checked={selectedIds.size === transactions.length && transactions.length > 0}
    onCheckedChange={toggleSelectAll}
  />
</TableHead>

// In table row
<TableCell>
  <Checkbox
    checked={selectedIds.has(transaction.id)}
    onCheckedChange={(checked) => toggleSelect(transaction.id, checked)}
  />
</TableCell>
```

**2. Bulk Operations Toolbar**

Create `src/components/transactions/BulkOperationsToolbar.tsx`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2, Download, Tag } from 'lucide-react'
import { useState } from 'react'

interface BulkOperationsToolbarProps {
  selectedIds: Set<string>
  onClearSelection: () => void
}

export const BulkOperationsToolbar = ({
  selectedIds,
  onClearSelection,
}: BulkOperationsToolbarProps) => {
  const queryClient = useQueryClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const count = selectedIds.size

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', Array.from(selectedIds))

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success(`${count} transaksi berhasil dihapus`)
      onClearSelection()
      setDeleteDialogOpen(false)
    },
    onError: (error) => {
      toast.error('Gagal menghapus: ' + error.message)
    },
  })

  const bulkExport = async () => {
    // Fetch selected transactions
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .in('id', Array.from(selectedIds))

    if (error) {
      toast.error('Gagal mengekspor')
      return
    }

    // Convert to CSV
    const csv = convertToCSV(data)
    downloadCSV(csv, `transaksi-${count}-items.csv`)
    toast.success(`${count} transaksi diekspor`)
  }

  if (count === 0) return null

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
        <p className="text-sm font-medium">
          {count} transaksi dipilih
        </p>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={bulkExport}>
            <Download className="mr-2 h-4 w-4" />
            Ekspor
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>

          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Batal
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {count} transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Transaksi yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDelete.mutate()}
              className="bg-destructive text-destructive-foreground"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(header => JSON.stringify(row[header] || '')).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

---

## Week 2: PDF Export & Advanced Filters

### Feature 2A: PDF Export

**Installation:**

```bash
npm install jspdf jspdf-autotable
npm install -D @types/jspdf
```

**Implementation:**

Create `src/lib/pdfExport.ts`:

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { formatCurrency } from './calculations'

interface MonthlyReportData {
  month: string
  totalIncome: number
  totalExpense: number
  netProfit: number
  profitMargin: number
  transactions: Array<{
    date: string
    type: string
    category: string
    amount: number
    description: string
  }>
  topIncomeCategories: Array<{ category: string; amount: number }>
  topExpenseCategories: Array<{ category: string; amount: number }>
}

export const generateMonthlyReportPDF = (
  data: MonthlyReportData,
  businessName: string
) => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text('Laporan Keuangan Bulanan', 14, 22)

  doc.setFontSize(12)
  doc.text(businessName, 14, 30)
  doc.text(data.month, 14, 36)

  // Summary boxes
  const startY = 50
  doc.setFontSize(10)

  // Income box
  doc.setFillColor(220, 252, 231) // green-100
  doc.rect(14, startY, 60, 20, 'F')
  doc.text('Total Pemasukan', 16, startY + 6)
  doc.setFontSize(14)
  doc.text(formatCurrency(data.totalIncome), 16, startY + 14)

  // Expense box
  doc.setFillColor(254, 226, 226) // red-100
  doc.rect(80, startY, 60, 20, 'F')
  doc.setFontSize(10)
  doc.text('Total Pengeluaran', 82, startY + 6)
  doc.setFontSize(14)
  doc.text(formatCurrency(data.totalExpense), 82, startY + 14)

  // Profit box
  const profitColor = data.netProfit >= 0 ? [220, 252, 231] : [254, 226, 226]
  doc.setFillColor(...profitColor)
  doc.rect(146, startY, 60, 20, 'F')
  doc.setFontSize(10)
  doc.text('Laba Bersih', 148, startY + 6)
  doc.setFontSize(14)
  doc.text(formatCurrency(data.netProfit), 148, startY + 14)

  // Transaction table
  autoTable(doc, {
    startY: startY + 30,
    head: [['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Keterangan']],
    body: data.transactions.map(t => [
      format(new Date(t.date), 'dd MMM yyyy', { locale: idLocale }),
      t.type === 'income' ? 'Masuk' : 'Keluar',
      t.category,
      formatCurrency(t.amount),
      t.description || '-',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
  })

  // Category breakdown
  const finalY = (doc as any).lastAutoTable.finalY + 10

  doc.setFontSize(12)
  doc.text('Kategori Pemasukan Terbesar', 14, finalY)

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Kategori', 'Jumlah']],
    body: data.topIncomeCategories.map(c => [
      c.category,
      formatCurrency(c.amount),
    ]),
    theme: 'plain',
  })

  const expenseY = (doc as any).lastAutoTable.finalY + 10

  doc.setFontSize(12)
  doc.text('Kategori Pengeluaran Terbesar', 14, expenseY)

  autoTable(doc, {
    startY: expenseY + 5,
    head: [['Kategori', 'Jumlah']],
    body: data.topExpenseCategories.map(c => [
      c.category,
      formatCurrency(c.amount),
    ]),
    theme: 'plain',
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Dibuat dengan SiNaik • ${format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}`,
      14,
      doc.internal.pageSize.height - 10
    )
  }

  // Save
  doc.save(`laporan-${data.month}.pdf`)
}
```

---

*This implementation guide is extensive. Would you like me to continue with the remaining features (Advanced Filters, Error Handling, Testing Setup) or would you prefer to start implementing these features first and iterate?*

---

## Summary of Deliverables

### ✅ Completed Documents
1. **ROADMAP.md** - Complete strategic roadmap (Phases 1-5)
2. **TESTING_STRATEGY.md** - Comprehensive testing guide
3. **PHASE1_IMPLEMENTATION.md** - Detailed implementation guide (in progress)

### 📋 Next Steps
1. Review and approve roadmap
2. Set up testing infrastructure (vitest config)
3. Begin Phase 1 implementation
4. Weekly progress reviews

**Ready to start building? Let me know which feature you'd like to tackle first!**
