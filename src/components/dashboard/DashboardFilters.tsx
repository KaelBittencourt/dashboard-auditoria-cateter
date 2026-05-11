import { AuditRecord, getUniqueValues } from '@/lib/auditData';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { CalendarIcon, SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';
import { format, isValid, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface FilterState {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
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
            : "bg-white/[0.03] border-white/10 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground hover:border-white/20"
        )}>
          {hasSelection && <span className="h-4 w-4 rounded-full bg-primary text-[9px] font-black flex items-center justify-center text-white">{selected.length}</span>}
          {label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5 pointer-events-auto bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl" align="start">
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
                    : "text-foreground/80 hover:bg-white/5 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                  isSelected ? "bg-primary border-primary" : "border-white/20"
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

  const [fromInput, setFromInput] = useState(filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy') : '');
  const [toInput, setToInput] = useState(filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy') : '');

  useEffect(() => {
    setFromInput(filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy') : '');
  }, [filters.dateFrom]);

  useEffect(() => {
    setToInput(filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy') : '');
  }, [filters.dateTo]);

  const toggleItem = (field: keyof FilterState, value: string) => {
    const arr = filters[field] as string[];
    const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    onChange({ ...filters, [field]: newArr });
  };

  const maskDate = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 4) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
  };

  const handleDateInput = (val: string, type: 'from' | 'to') => {
    const masked = maskDate(val);
    if (type === 'from') setFromInput(masked);
    else setToInput(masked);

    if (masked.length === 10) {
      const parsed = parse(masked, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) {
        onChange({ ...filters, [type === 'from' ? 'dateFrom' : 'dateTo']: parsed });
      }
    } else if (masked === '') {
      onChange({ ...filters, [type === 'from' ? 'dateFrom' : 'dateTo']: undefined });
    }
  };

  const activeCount = [
    filters.dateFrom, filters.dateTo,
    filters.sectors.length > 0, filters.shifts.length > 0,
    filters.accessTypes.length > 0, filters.responsibles.length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => onChange({
    dateFrom: undefined, dateTo: undefined,
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
        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative group cursor-pointer">
                <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                <Input
                  placeholder="Início"
                  value={fromInput}
                  onChange={(e) => handleDateInput(e.target.value, 'from')}
                  className="h-9 w-[120px] pl-7 text-xs bg-white/[0.03] border-white/10 focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all cursor-text placeholder:text-muted-foreground/50"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom}
                onSelect={d => onChange({ ...filters, dateFrom: d })}
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <span className="text-[10px] text-muted-foreground/50 font-medium">até</span>

          <Popover>
            <PopoverTrigger asChild>
              <div className="relative group cursor-pointer">
                <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                <Input
                  placeholder="Término"
                  value={toInput}
                  onChange={(e) => handleDateInput(e.target.value, 'to')}
                  className="h-9 w-[120px] pl-7 text-xs bg-white/[0.03] border-white/10 focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all cursor-text placeholder:text-muted-foreground/50"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo}
                onSelect={d => onChange({ ...filters, dateTo: d })}
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/10 hidden sm:block" />

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
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
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
