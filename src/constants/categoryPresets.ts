export type SectorId = 'fnb' | 'retail' | 'services' | 'online';

export interface SectorPreset {
  id: SectorId;
  title: string;
  description: string;
  incomeSuggestions: string[];
  expenseSuggestions: string[];
  highlights: string[];
}

export const SECTOR_PRESETS: SectorPreset[] = [
  {
    id: 'fnb',
    title: 'Makanan & Minuman',
    description: 'Warung makan, katering, kedai kopi, usaha makanan ringan.',
    incomeSuggestions: [
      'Penjualan Makanan',
      'Penjualan Minuman',
      'Pesanan Online',
      'Catering',
      'Penjualan Titip Jual',
    ],
    expenseSuggestions: [
      'Bahan Baku',
      'Kemasan',
      'Gaji Karyawan',
      'Utilitas Dapur',
      'Promosi Online',
    ],
    highlights: [
      'Pantau biaya bahan baku harian',
      'Catat penjualan online dan dine-in terpisah',
      'Gunakan margin minimal 30% untuk menu populer',
    ],
  },
  {
    id: 'retail',
    title: 'Ritel & Toko',
    description: 'Minimarket, toko kelontong, fashion, elektronik.',
    incomeSuggestions: [
      'Penjualan Toko',
      'Penjualan Online',
      'Penjualan Grosir',
      'Penjualan Konsinyasi',
    ],
    expenseSuggestions: [
      'Belanja Stok',
      'Sewa Toko',
      'Gaji Karyawan',
      'Operasional Toko',
      'Pengiriman',
    ],
    highlights: [
      'ROTASI stok sehat jika < 30 hari',
      'Pisahkan pemasukan online vs offline',
      'Catat biaya admin marketplace',
    ],
  },
  {
    id: 'services',
    title: 'Jasa & Layanan',
    description: 'Salon, bengkel, laundry, konsultan, kursus.',
    incomeSuggestions: [
      'Jasa Utama',
      'Jasa Tambahan',
      'Produk Pendukung',
      'Langganan Bulanan',
    ],
    expenseSuggestions: [
      'Gaji Tenaga Jasa',
      'Peralatan',
      'Sewa Tempat',
      'Bahan Penunjang',
      'Pemasaran',
    ],
    highlights: [
      'Catat utilisasi tenaga kerja',
      'Tawarkan paket bundling mingguan',
      'Anggarkan perawatan peralatan rutin',
    ],
  },
  {
    id: 'online',
    title: 'Bisnis Online & Kreatif',
    description: 'Dropship, konten kreator, digital agency, software.',
    incomeSuggestions: [
      'Penjualan Produk Digital',
      'Jasa Desain',
      'Pendapatan Iklan',
      'Subscription',
      'Affiliate',
    ],
    expenseSuggestions: [
      'Biaya Platform',
      'Software & Tools',
      'Iklan Berbayar',
      'Komisi Mitra',
      'Produksi Konten',
    ],
    highlights: [
      'Pantau biaya iklan vs omzet mingguan',
      'Siapkan dana untuk upgrade tools',
      'Catat komisi partner terpisah',
    ],
  },
];

export const ONBOARDING_COMPLETED_KEY = 'sinaik:onboardingCompleted';
export const SELECTED_SECTOR_KEY = 'sinaik:selectedSector';
export const CATEGORY_SUGGESTIONS_KEY = 'sinaik:categorySuggestions';

