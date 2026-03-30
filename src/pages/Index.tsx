import { useQuery } from '@tanstack/react-query';
import { fetchAuditData, AuditRecord } from '@/lib/auditData';
import { useMemo, useRef, useState } from 'react';
import DashboardFilters, { FilterState } from '@/components/dashboard/DashboardFilters';
import KPICards from '@/components/dashboard/KPICards';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import AutomaticInsights from '@/components/dashboard/AutomaticInsights';
import AuditTable from '@/components/dashboard/AuditTable';
import { Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const initialFilters: FilterState = {
  dateFrom: undefined,
  dateTo: undefined,
  sectors: [],
  shifts: [],
  accessTypes: [],
  responsibles: [],
};

export default function Index() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: records = [], isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['auditData'],
    queryFn: fetchAuditData,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    // Garante que o movimento seja perceptível mesmo com dados em cache
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return '--:--';
    return new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [dataUpdatedAt]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filters.dateFrom && r.parsedDate && r.parsedDate < filters.dateFrom) return false;
      if (filters.dateTo && r.parsedDate) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (r.parsedDate > endOfDay) return false;
      }
      if (filters.sectors.length > 0 && !filters.sectors.includes(r.sector)) return false;
      if (filters.shifts.length > 0 && !filters.shifts.includes(r.shift)) return false;
      if (filters.accessTypes.length > 0 && !filters.accessTypes.includes(r.accessType)) return false;
      if (filters.responsibles.length > 0 && !filters.responsibles.includes(r.responsible)) return false;
      return true;
    });
  }, [records, filters]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando dados da planilha...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border" style={{ background: 'var(--gradient-header)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/15 border border-primary/30 rounded-lg p-2 glow-primary">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Cateter Venoso e Sistema de Infusão</h1>
              <p className="text-xs text-muted-foreground">Auditoria Interna ( SCIH )</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Última Sincronização</span>
              <span className="text-xs font-medium text-muted-foreground">{lastUpdated}</span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleManualRefresh} 
              disabled={isFetching || isRefreshing}
              className="text-xs bg-secondary/50 border-border hover:bg-secondary transition-all active:scale-95 group relative overflow-hidden"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 transition-all duration-300 ${(isFetching || isRefreshing) ? 'animate-spin opacity-70' : 'group-hover:rotate-180'}`} /> 
              {(isFetching || isRefreshing) ? 'Sincronizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <DashboardFilters records={records} filters={filters} onChange={setFilters} />
        <KPICards records={filteredRecords} />
        <AutomaticInsights records={filteredRecords} />
        <DashboardCharts records={filteredRecords} />
        <AuditTable records={filteredRecords} />
      </main>
    </div>
  );
}
