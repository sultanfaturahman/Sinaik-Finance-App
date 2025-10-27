import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

interface ReportFiltersProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export const ReportFilters = ({ years, selectedYear, onYearChange }: ReportFiltersProps) => {
  const [open, setOpen] = useState(false);

  if (years.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between px-3 py-3 md:px-4 md:border-b md:border-border/60">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filter Laporan</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="report-filters-mobile"
        >
          {open ? "Tutup" : "Atur"}
        </Button>
      </div>
      <div
        id="report-filters-mobile"
        className="grid gap-3 px-3 py-3 md:grid-cols-[200px] md:px-4 md:py-4"
      >
        <div className="hidden md:block">
          <FilterSelect years={years} selectedYear={selectedYear} onYearChange={onYearChange} />
        </div>
        {open && (
          <div className="md:hidden">
            <FilterSelect years={years} selectedYear={selectedYear} onYearChange={(year) => {
              onYearChange(year);
              setOpen(false);
            }} />
          </div>
        )}
      </div>
    </div>
  );
};

const FilterSelect = ({
  years,
  selectedYear,
  onYearChange,
}: {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}) => (
  <div className="space-y-2">
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tahun</p>
    <Select
      value={String(selectedYear)}
      onValueChange={(value) => onYearChange(Number(value))}
    >
      <SelectTrigger className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <SelectValue placeholder="Pilih tahun" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
