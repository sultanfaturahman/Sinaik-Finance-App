# Sinaik Finance App

SiNaik (Sistem Informasi Naik Kelas) adalah aplikasi manajemen keuangan untuk UMKM di Cilegon. Aplikasi ini membantu pelaku usaha mencatat transaksi, memantau kesehatan keuangan, menyusun strategi pertumbuhan berbasis AI, hingga memahami status klasifikasi UMKM mereka dalam satu tempat yang terintegrasi dengan Supabase.

## Fitur Utama

- **Dashboard ringkas** – Menampilkan total pemasukan, pengeluaran, laba bersih, dan jumlah transaksi dengan konteks tambahan untuk memantau performa usaha secara cepat.
- **Pencatatan transaksi lengkap** – Tambahkan, ubah, hapus, atau impor transaksi pemasukan maupun pengeluaran. Mendukung kategorisasi dinamis, catatan rinci, tampilan tabel atau kartu, serta ekspor ke Excel.
- **Laporan keuangan** – Analisis pemasukan dan pengeluaran per kategori, grafik tren bulanan, ringkasan profitabilitas, dan rekomendasi tindakan.
- **Status UMKM** – Menghitung klasifikasi level usaha berdasarkan omzet dan memberikan langkah peningkatan level berikutnya.
- **Catatan bisnis** – Kelola catatan penting dan ide strategi dalam satu tempat yang selalu sinkron antar perangkat.
- **Strategi bisnis berbasis AI** – Memanfaatkan Supabase Edge Function `generate-business-strategy` yang terhubung ke Gemini API untuk membuat rencana pertumbuhan yang dapat ditindaklanjuti.
- **Pengaturan akun & sinkronisasi** – Autentikasi email/password melalui Supabase Auth, manajemen profil, dan opsi tema.
- **Dukungan impor/ekspor** – Integrasi dengan Excel untuk memigrasikan data historis dan membagikan laporan kepada pemangku kepentingan.

## Teknologi yang Digunakan

- [React](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) dan komponen [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) (Auth, Database, Edge Functions)
- [@tanstack/react-query](https://tanstack.com/query/latest) untuk data fetching
- [Vitest](https://vitest.dev/) & Testing Library untuk pengujian
- [Lucide](https://lucide.dev/) untuk ikon

## Persiapan Lingkungan

1. **Prasyarat**
   - Node.js 18 LTS atau lebih baru
   - npm 9+ atau bun/pnpm sesuai preferensi
   - Akun Supabase dan project yang aktif
   - (Opsional) [Supabase CLI](https://supabase.com/docs/guides/cli) untuk menjalankan Edge Function secara lokal

2. **Kloning repositori dan instal dependensi**

   ```bash
   git clone <repository-url>
   cd Sinaik-Finance-App
   npm install
   ```

3. **Konfigurasi variabel lingkungan**

   Buat berkas `.env` di root proyek dan isi dengan kredensial Supabase Anda:

   ```bash
   VITE_SUPABASE_URL=<https://YOUR-PROJECT.supabase.co>
   VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
   ```

   > **Catatan:** Aplikasi akan membaca `VITE_SUPABASE_ANON_KEY` atau `VITE_SUPABASE_PUBLISHABLE_KEY`. Pastikan salah satu tersedia.

4. **Rahasia Supabase Edge Function**

   Edge Function `generate-business-strategy` membutuhkan akses ke Gemini API. Setel secret berikut di project Supabase Anda:

   ```bash
   supabase secrets set GEMINI_API_KEY="<your-gemini-api-key>" GEMINI_MODEL="gemini-2.5-flash"
   ```

   Secrets ini akan tersedia saat fungsi dipanggil dari aplikasi atau saat Anda menjalankannya melalui Supabase CLI.

## Menjalankan Proyek

```bash
npm run dev
```

Server pengembangan akan berjalan di `http://localhost:5173`. Masuk atau buat akun baru untuk mulai menggunakan aplikasi.

### Skrip Tambahan

- `npm run build` – Membuat bundel produksi.
- `npm run build:dev` – Build mode development (berguna untuk debugging build).
- `npm run preview` – Menjalankan pratinjau build produksi.
- `npm run lint` – Menjalankan ESLint.
- `npm run test` – Menjalankan suite unit test menggunakan Vitest.
- `npm run test:ui` – Menjalankan Vitest dalam mode UI interaktif.

## Struktur Proyek

```
src/
├── app/                 # Komponen shell layout aplikasi
├── components/          # Komponen UI reusable (stat cards, tabel transaksi, dsb.)
├── hooks/               # Hooks kustom (auth, saran kategori, dll.)
├── integrations/        # Klien Supabase dan tipe database
├── pages/               # Halaman utama: Dashboard, Transactions, Reports, Status, dll.
├── utils/               # Helper format mata uang, konstanta, dan utilitas lainnya
└── tests/               # Pengujian berbasis Vitest/Testing Library
supabase/
├── functions/           # Edge Functions (mis. generate-business-strategy)
└── migrations/          # Skrip migrasi database Supabase
```

## Pengujian

1. Jalankan seluruh pengujian unit:

   ```bash
   npm run test
   ```

2. Untuk pengalaman debugging interaktif, gunakan:

   ```bash
   npm run test:ui
   ```

Pastikan Supabase CLI atau layanan backend tersedia jika pengujian membutuhkan interaksi jaringan.

## Deploy

Aplikasi dapat dideploy ke platform yang mendukung aplikasi Vite/React (mis. Vercel, Netlify, Render). Pastikan variabel lingkungan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` diatur di lingkungan produksi, serta Edge Function telah dideploy melalui Supabase CLI atau dashboard Supabase.

## Kontribusi

1. Fork dan buat branch fitur: `git checkout -b fitur/penambahan-x`.
2. Pastikan linting & pengujian berjalan: `npm run lint && npm run test`.
3. Ajukan Pull Request dan jelaskan perubahan yang dilakukan.

Selamat membangun solusi finansial untuk UMKM bersama SiNaik! 🚀
