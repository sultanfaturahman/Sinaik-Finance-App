import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/app/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ONBOARDING_COMPLETED_KEY } from "@/constants/categoryPresets";
import { SignOutButton } from "@/components/SignOutButton";

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  businessName: z.string().min(2, "Nama usaha minimal 2 karakter"),
  businessType: z.string().min(1, "Pilih jenis usaha"),
  city: z.string().min(2, "Kota minimal 2 karakter"),
  phone: z
    .string()
    .min(8, "Nomor telepon minimal 8 karakter")
    .regex(/^[0-9+\s-]+$/, "Gunakan angka, spasi, atau tanda plus"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const BUSINESS_TYPES: Array<{ value: string; label: string }> = [
  { value: "fnb", label: "Makanan & Minuman" },
  { value: "retail", label: "Ritel & Toko" },
  { value: "services", label: "Jasa & Layanan" },
  { value: "manufacturing", label: "Produksi & Manufaktur" },
  { value: "online", label: "Bisnis Online & Kreatif" },
  { value: "other", label: "Lainnya" },
];

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, error } = useProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      businessName: "",
      businessType: "",
      city: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      name: profile.name ?? "",
      businessName: profile.business_name ?? "",
      businessType: profile.business_type ?? "",
      city: profile.city ?? "",
      phone: profile.phone ?? "",
    });
  }, [form, profile]);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isSetupFlow = searchParams.get("setup") === "1";
  const redirectTarget = (location.state as { from?: string } | null)?.from;

  const lastUpdatedLabel = useMemo(() => {
    const source =
      profile?.profile_completed_at ??
      profile?.updated_at ??
      profile?.created_at ??
      null;

    if (!source) return null;

    try {
      return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(source));
    } catch {
      return null;
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user) {
        throw new Error("Pengguna tidak ditemukan");
      }

      const timestamp = new Date().toISOString();

      const { data, error } = await supabase
        .from("profiles")
        .update({
          name: values.name,
          business_name: values.businessName,
          business_type: values.businessType,
          city: values.city,
          phone: values.phone,
          profile_completed: true,
          profile_completed_at: timestamp,
          onboarding_completed: true,
        })
        .eq("id", user.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      // Update Supabase auth metadata so the name stays in sync
      if (user.user_metadata?.name !== values.name) {
        const { error: authError } = await supabase.auth.updateUser({ data: { name: values.name } });
        if (authError) {
          console.warn("Gagal memperbarui metadata auth pengguna", authError);
        }
      }

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            `${ONBOARDING_COMPLETED_KEY}:${user.id}`,
            JSON.stringify(true),
          );
        } catch (storageError) {
          console.warn("Gagal menyimpan status onboarding ke localStorage", storageError);
        }
      }

      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile", user?.id], updated);
      form.reset({
        name: updated.name ?? "",
        businessName: updated.business_name ?? "",
        businessType: updated.business_type ?? "",
        city: updated.city ?? "",
        phone: updated.phone ?? "",
      });
      toast.success("Profil berhasil diperbarui");

      if (isSetupFlow) {
        navigate(redirectTarget ?? "/dashboard", { replace: true });
      }
    },
    onError: () => {
      toast.error("Gagal menyimpan profil. Coba lagi dalam beberapa saat.");
    },
  });

  return (
    <AppShell
      title="Profil Usaha"
      subtitle="Lengkapi data usaha agar insight dan laporan menjadi lebih relevan."
    >
      {error ? (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
          <AlertTitle>Profil tidak dapat dimuat</AlertTitle>
          <AlertDescription className="text-sm">
            Terjadi kesalahan saat mengambil data profil. Segarkan halaman atau coba lagi nanti.
          </AlertDescription>
        </Alert>
      ) : isLoading || !profile ? (
        <ProfileSkeleton />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle>Informasi Pemilik & Usaha</CardTitle>
              <CardDescription>
                Data ini membantu kami menyesuaikan rekomendasi dan laporan untuk usaha Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSetupFlow && (
                <Alert className="mb-6 border-primary/30 bg-primary/5">
                  <AlertTitle>Selamat bergabung di SiNaik!</AlertTitle>
                  <AlertDescription className="text-sm">
                    Lengkapi profil Anda terlebih dahulu sebelum mulai mencatat transaksi.
                  </AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Pemilik</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama lengkap pemilik usaha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Usaha</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Kopi Pagi Cilegon" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sektor Usaha</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih sektor usaha" />
                            </SelectTrigger>
                            <SelectContent>
                              {BUSINESS_TYPES.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>Kami pakai informasi ini untuk rekomendasi kategori.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domisili Usaha</FormLabel>
                          <FormControl>
                            <Input placeholder="Kota atau Kabupaten" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor WhatsApp / Telepon</FormLabel>
                          <FormControl>
                            <Input placeholder="+62 812-3456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Email akun</p>
                      <p className="text-sm font-medium text-foreground">{profile.email}</p>
                    </div>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan Profil"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border border-dashed border-border/70 bg-background/60">
            <CardHeader>
              <CardTitle>Status Profil</CardTitle>
              <CardDescription>Pantau kelengkapan data usaha Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2">
                <div>
                  <p className="font-medium text-foreground">Kelengkapan Profil</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.profile_completed
                      ? "Profil sudah lengkap dan siap digunakan."
                      : "Lengkapi semua data agar fitur berjalan maksimal."}
                  </p>
                </div>
                <Badge variant={profile.profile_completed ? "default" : "outline"}>
                  {profile.profile_completed ? "Lengkap" : "Belum Lengkap"}
                </Badge>
              </div>

              <div className="rounded-xl border border-border/60 bg-background px-3 py-2">
                <p className="font-medium text-foreground">Manfaat Profil Lengkap</p>
                <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <li>• Rekomendasi kategori transaksi sesuai jenis usaha.</li>
                  <li>• Insight margin dan target UMKM yang lebih akurat.</li>
                  <li>• Pengingat dan strategi AI yang dipersonalisasi.</li>
                </ul>
              </div>

              {lastUpdatedLabel && (
                <p className="text-xs text-muted-foreground">
                  Terakhir diperbarui: <span className="font-medium text-foreground">{lastUpdatedLabel}</span>
                </p>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-full">
            <SignOutButton
              label="Keluar dari akun"
              buttonVariant="outline"
              className="w-full justify-center border-destructive/40 text-destructive hover:bg-destructive/10"
              iconClassName="text-destructive"
            />
          </div>
        </div>
      )}
    </AppShell>
  );
};

const ProfileSkeleton = () => (
  <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </CardContent>
    </Card>
  </div>
);

export default ProfilePage;
