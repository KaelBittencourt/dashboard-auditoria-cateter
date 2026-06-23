import { AuditRecord, getUniqueValues } from '@/lib/auditData';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  months: string[];
  years: string[];
  sectors: string[];
  shifts: string[];
  accessTypes: string[];
  responsibles: string[];
}

interface FiltersProps {
  records: AuditRecord[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function MultiSelect({ label, options, selected, onToggle }: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  const hasSelection = selected.length > 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-200 border whitespace-nowrap",
          hasSelection
            ? "bg-primary/15 border-primary/30 text-primary hover:bg-primary/20"
            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
        )}>
          {hasSelection && <span className="h-4 w-4 rounded-full bg-primary text-[9px] font-black flex items-center justify-center text-primary-foreground">{selected.length}</span>}
          {label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5 pointer-events-auto bg-card/95 backdrop-blur-xl border-border shadow-2xl" align="start">
        <div className="space-y-0.5 max-h-52 overflow-y-auto">
          {options.map(opt => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className={cn(
                  "w-full text-left px-2.5 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                  isSelected
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                  isSelected ? "bg-primary border-primary" : "border-border"
                )}>
                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className="truncate">{opt}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function DashboardFilters({ records, filters, onChange }: FiltersProps) {
  const sectors = useMemo(() => getUniqueValues(records, 'sector'), [records]);
  const shifts = useMemo(() => getUniqueValues(records, 'shift'), [records]);
  const accessTypes = useMemo(() => getUniqueValues(records, 'accessType'), [records]);
  const responsibles = useMemo(() => getUniqueValues(records, 'responsible'), [records]);

  const availableMonths = useMemo(() => {
    const monthSet = new Set<number>();
    for (const r of records) {
      if (r.parsedDate) monthSet.add(r.parsedDate.getMonth());
    }
    return Array.from(monthSet)
      .sort((a, b) => a - b)
      .map(m => MONTH_NAMES[m]);
  }, [records]);

  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    for (const r of records) {
      if (r.parsedDate) yearSet.add(String(r.parsedDate.getFullYear()));
    }
    return Array.from(yearSet).sort();
  }, [records]);

  const toggleItem = (field: keyof FilterState, value: string) => {
    const arr = filters[field] as string[];
    const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    onChange({ ...filters, [field]: newArr });
  };

  const activeCount = [
    filters.months.length > 0, filters.years.length > 0,
    filters.sectors.length > 0, filters.shifts.length > 0,
    filters.accessTypes.length > 0, filters.responsibles.length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => onChange({
    months: [], years: [],
    sectors: [], shifts: [], accessTypes: [], responsibles: [],
  });

  return (
    <div className="card-glass rounded-xl p-4 animate-slide-in">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Icon + label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider hidden sm:inline">Filtros</span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Month + Year selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelect label="Mês" options={availableMonths} selected={filters.months} onToggle={v => toggleItem('months', v)} />
          <MultiSelect label="Ano" options={availableYears} selected={filters.years} onToggle={v => toggleItem('years', v)} />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Multi-selects */}
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelect label="Setor" options={sectors} selected={filters.sectors} onToggle={v => toggleItem('sectors', v)} />
          <MultiSelect label="Turno" options={shifts} selected={filters.shifts} onToggle={v => toggleItem('shifts', v)} />
          <MultiSelect label="Acesso" options={accessTypes} selected={filters.accessTypes} onToggle={v => toggleItem('accessTypes', v)} />
          <MultiSelect label="Responsável" options={responsibles} selected={filters.responsibles} onToggle={v => toggleItem('responsibles', v)} />
        </div>

        {/* Clear button */}
        {activeCount > 0 && (
          <>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2.5 text-[11px] text-danger/80 hover:text-danger hover:bg-danger/10 transition-all gap-1"
            >
              <X className="h-3 w-3" />
              Limpar ({activeCount})
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
