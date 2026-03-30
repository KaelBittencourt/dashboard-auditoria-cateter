import { AuditRecord, getUniqueValues } from '@/lib/auditData';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Filter, X } from 'lucide-react';
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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 min-w-[160px] justify-between text-sm bg-secondary border-border text-foreground hover:bg-secondary/80 hover:text-primary transition-colors">
          <span className="truncate">{selected.length > 0 ? `${label} (${selected.length})` : label}</span>
          <Filter className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 pointer-events-auto bg-card border-border" align="start">
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                selected.includes(opt)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-white/10 hover:text-white"
              )}
            >
              {opt}
            </button>
          ))}
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

  const hasActiveFilters = filters.dateFrom || filters.dateTo ||
    filters.sectors.length > 0 || filters.shifts.length > 0 ||
    filters.accessTypes.length > 0 || filters.responsibles.length > 0;

  const clearFilters = () => onChange({
    dateFrom: undefined, dateTo: undefined,
    sectors: [], shifts: [], accessTypes: [], responsibles: [],
  });

  return (
    <div className="card-glass rounded-xl p-4 animate-slide-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" /> Filtros
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3 mr-1" /> Limpar
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {/* De */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase text-muted-foreground px-1 tracking-wider">Início</label>
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative group cursor-pointer">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                <Input
                  placeholder="DD/MM/AAAA"
                  value={fromInput}
                  onChange={(e) => handleDateInput(e.target.value, 'from')}
                  className="h-10 w-40 pl-9 bg-secondary border-border text-sm focus-visible:ring-primary/20 transition-all cursor-text"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto bg-card border-border shadow-2xl" align="start">
              <Calendar 
                mode="single" 
                selected={filters.dateFrom} 
                onSelect={d => onChange({ ...filters, dateFrom: d })} 
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Até */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase text-muted-foreground px-1 tracking-wider">Término</label>
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative group cursor-pointer">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                <Input
                  placeholder="DD/MM/AAAA"
                  value={toInput}
                  onChange={(e) => handleDateInput(e.target.value, 'to')}
                  className="h-10 w-40 pl-9 bg-secondary border-border text-sm focus-visible:ring-primary/20 transition-all cursor-text"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto bg-card border-border shadow-2xl" align="start">
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

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase text-muted-foreground px-1 tracking-wider">Outros Filtros</label>
          <div className="flex flex-wrap gap-2">
            <MultiSelect label="Setor" options={sectors} selected={filters.sectors} onToggle={v => toggleItem('sectors', v)} />
            <MultiSelect label="Turno" options={shifts} selected={filters.shifts} onToggle={v => toggleItem('shifts', v)} />
            <MultiSelect label="Tipo de Acesso" options={accessTypes} selected={filters.accessTypes} onToggle={v => toggleItem('accessTypes', v)} />
            <MultiSelect label="Responsável" options={responsibles} selected={filters.responsibles} onToggle={v => toggleItem('responsibles', v)} />
          </div>
        </div>
      </div>
    </div>
  );
}
