export type UMKMLevel = 'ultra_mikro' | 'super_mikro' | 'mikro' | 'kecil';

export interface UMKMRule {
  level: UMKMLevel;
  minRevenue: number;
  maxRevenue: number;
  label: string;
  description: string;
  color: string;
}

export const UMKM_RULES: UMKMRule[] = [
  {
    level: 'ultra_mikro',
    minRevenue: 0,
    maxRevenue: 50_000_000,
    label: 'Ultra Mikro',
    description: 'Omzet tahunan hingga Rp 50 juta',
    color: 'hsl(192, 82%, 28%)',
  },
  {
    level: 'super_mikro',
    minRevenue: 50_000_001,
    maxRevenue: 300_000_000,
    label: 'Super Mikro',
    description: 'Omzet tahunan Rp 50 juta - Rp 300 juta',
    color: 'hsl(192, 82%, 38%)',
  },
  {
    level: 'mikro',
    minRevenue: 300_000_001,
    maxRevenue: 2_500_000_000,
    label: 'Mikro',
    description: 'Omzet tahunan Rp 300 juta - Rp 2,5 miliar',
    color: 'hsl(142, 71%, 45%)',
  },
  {
    level: 'kecil',
    minRevenue: 2_500_000_001,
    maxRevenue: Infinity,
    label: 'Kecil',
    description: 'Omzet tahunan di atas Rp 2,5 miliar',
    color: 'hsl(142, 71%, 55%)',
  },
];

export const classifyUMKM = (annualRevenue: number): UMKMRule => {
  return UMKM_RULES.find(
    (rule) => annualRevenue >= rule.minRevenue && annualRevenue <= rule.maxRevenue
  ) || UMKM_RULES[0];
};

export const getNextLevel = (currentLevel: UMKMLevel): UMKMRule | null => {
  const currentIndex = UMKM_RULES.findIndex((r) => r.level === currentLevel);
  return currentIndex < UMKM_RULES.length - 1 ? UMKM_RULES[currentIndex + 1] : null;
};
