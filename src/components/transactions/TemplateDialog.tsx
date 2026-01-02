import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { TransactionTemplate } from "@/types/transaction-template";

const recurringOptions = ["daily", "weekly", "monthly", "yearly"] as const;

const templateSchema = z
  .object({
    name: z.string().min(1, "Nama template wajib diisi"),
    type: z.enum(["income", "expense"]),
    category: z.string().min(1, "Kategori wajib diisi"),
    amount: z.coerce
      .number({
        required_error: "Jumlah wajib diisi",
        invalid_type_error: "Jumlah harus berupa angka",
      })
      .positive("Jumlah harus lebih dari 0"),
    description: z
      .string()
      .max(300, "Deskripsi maksimal 300 karakter")
      .optional()
      .or(z.literal("")),
    is_recurring: z.boolean().default(false),
    recurring_frequency: z
      .enum(recurringOptions)
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_recurring && !data.recurring_frequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pilih frekuensi untuk template berulang",
        path: ["recurring_frequency"],
      });
    }
  });

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: TransactionTemplate;
}

export const TemplateDialog = ({ open, onOpenChange, template }: TemplateDialogProps) => {
  const queryClient = useQueryClient();

  const defaultValues = useMemo<TemplateFormData>(
    () => ({
      name: template?.name ?? "",
      type: template?.type ?? "expense",
      category: template?.category ?? "",
      amount: template?.amount ?? 0,
      description: template?.description ?? "",
      is_recurring: template?.is_recurring ?? false,
      recurring_frequency: template?.recurring_frequency ?? null,
    }),
    [template]
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const isRecurring = watch("is_recurring");

  const saveTemplate = useMutation({
    mutationFn: async (values: TemplateFormData) => {
      const supabase = await getSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        throw new Error("Pengguna belum masuk");
      }

      const payload = {
        user_id: userId,
        name: values.name.trim(),
        type: values.type,
        category: values.category.trim(),
        amount: values.amount,
        description: values.description?.trim() || null,
        is_recurring: values.is_recurring,
        recurring_frequency: values.is_recurring ? values.recurring_frequency : null,
        next_occurrence: values.is_recurring
          ? calculateNextOccurrence(values.recurring_frequency!)
          : null,
      };

      if (template) {
        const { error } = await supabase
          .from("transaction_templates")
          .update(payload)
          .eq("id", template.id);

        if (error) {
          throw error;
        }

        return { message: "Template diperbarui", userId };
      }

      const { error } = await supabase.from("transaction_templates").insert([payload]);
      if (error) {
        throw error;
      }

      return { message: "Template dibuat", userId };
    },
    onSuccess: ({ message, userId }) => {
      queryClient.invalidateQueries({ queryKey: ["transaction-templates"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-templates", userId] });
      toast.success(message);
      onOpenChange(false);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan template";
      toast.error(message);
    },
  });

  const onSubmit = (values: TemplateFormData) => {
    saveTemplate.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Template Baru"}</DialogTitle>
          <DialogDescription>
            Simpan transaksi rutin dan gunakan lagi hanya dengan satu klik.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nama Template *</Label>
            <Input id="template-name" placeholder="Contoh: Sewa Bulanan" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Jenis *</Label>
              <Select
                value={watch("type")}
                onValueChange={(value) => setValue("type", value as "income" | "expense")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-amount">Jumlah (Rp) *</Label>
              <Input
                id="template-amount"
                type="number"
                min="0"
                step="0.01"
                {...register("amount")}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-category">Kategori *</Label>
            <Input
              id="template-category"
              placeholder="Contoh: Operasional, Gaji"
              {...register("category")}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Deskripsi</Label>
            <Textarea
              id="template-description"
              placeholder="Catatan tambahan (opsional)"
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Transaksi Berulang</p>
              <p className="text-sm text-muted-foreground">
                Aktifkan untuk menjadwalkan pengingat transaksi rutin.
              </p>
            </div>

            <Switch
              checked={isRecurring}
              onCheckedChange={(checked) => {
                setValue("is_recurring", checked);
                if (checked && !watch("recurring_frequency")) {
                  setValue("recurring_frequency", "monthly");
                }
                if (!checked) {
                  setValue("recurring_frequency", null);
                }
              }}
            />
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label>Frekuensi Pengingat *</Label>
              <Select
                value={watch("recurring_frequency") ?? undefined}
                onValueChange={(value) =>
                  setValue("recurring_frequency", value as TemplateFormData["recurring_frequency"])
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
              {errors.recurring_frequency && (
                <p className="text-sm text-destructive">
                  {errors.recurring_frequency.message}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={saveTemplate.isPending}>
              {saveTemplate.isPending ? "Menyimpan..." : "Simpan Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const calculateNextOccurrence = (frequency: NonNullable<TemplateFormData["recurring_frequency"]>) => {
  const next = new Date();

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next.toISOString();
};
