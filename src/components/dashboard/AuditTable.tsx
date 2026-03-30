import { AuditRecord } from '@/lib/auditData';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, X, Calendar, MapPin, Clock, User, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuditTableProps {
  records: AuditRecord[];
}

const PAGE_SIZE = 10;

export default function AuditTable({ records }: AuditTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r =>
      r.date.toLowerCase().includes(q) ||
      r.sector.toLowerCase().includes(q) ||
      r.shift.toLowerCase().includes(q) ||
      r.responsible.toLowerCase().includes(q) ||
      r.accessType.toLowerCase().includes(q)
    );
  }, [records, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRecords = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="card-glass rounded-xl animate-fade-in mb-8">
      <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest">Detalhamento das Auditorias</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 h-9 w-64 bg-secondary border-border focus:ring-primary/20"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Setor</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground mobile-hide">Turno</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Responsável</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground mobile-hide">Tipo Acesso</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Conformidade</th>
            </tr>
          </thead>
          <tbody>
            {pageRecords.map((r, i) => (
              <tr 
                key={i} 
                className="border-b border-border last:border-0 hover:bg-primary/[0.03] transition-colors cursor-pointer group"
                onClick={() => setSelectedRecord(r)}
              >
                <td className="px-4 py-3 text-foreground font-medium">{r.date}</td>
                <td className="px-4 py-3 text-foreground">{r.sector}</td>
                <td className="px-4 py-3 text-foreground mobile-hide">{r.shift}</td>
                <td className="px-4 py-3 text-foreground">{r.responsible}</td>
                <td className="px-4 py-3 text-foreground mobile-hide">{r.accessType}</td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all group-hover:scale-105",
                    r.conformRate >= 80
                      ? "bg-success/15 text-success border-success/30"
                      : r.conformRate >= 60
                      ? "bg-warning/15 text-warning border-warning/30"
                      : "bg-danger/15 text-danger border-danger/30"
                  )}>
                    {r.conformRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
            {pageRecords.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-medium italic">Nenhum registro encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{filtered.length} registro(s)</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-bold px-2">{page + 1} / {Math.max(totalPages, 1)}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-3xl card-glass border-primary/20 text-foreground p-0 overflow-hidden outline-none">
          <DialogHeader className="p-6 bg-secondary/50 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Detalhes da Auditoria
              </DialogTitle>
            </div>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Header Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><Calendar className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Data da Auditoria</p>
                      <p className="font-semibold">{selectedRecord.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Setor</p>
                      <p className="font-semibold">{selectedRecord.sector}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><Clock className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Turno</p>
                      <p className="font-semibold">{selectedRecord.shift}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><User className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Responsável</p>
                      <p className="font-semibold">{selectedRecord.responsible}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><CheckCircle2 className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Tipo de Acesso</p>
                      <p className="font-semibold">{selectedRecord.accessType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border border-primary/20 rounded-xl p-3 bg-primary/5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Taxa de Conformidade</p>
                      <p className={cn(
                        "text-3xl font-black",
                        selectedRecord.conformRate >= 80 ? "text-success" : selectedRecord.conformRate >= 60 ? "text-warning" : "text-danger"
                      )}>
                        {selectedRecord.conformRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Evaluation */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                  Itens Avaliados
                  <div className="h-px flex-1 bg-border/50"></div>
                </h4>
                
                <div className="grid grid-cols-1 gap-2">
                  {selectedRecord.conformityItems.map((item, idx) => {
                    const isConform = item.value.toLowerCase() === 'sim';
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <span className="text-sm font-medium">{item.label}</span>
                        <div className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
                          isConform ? "bg-success/15 text-success border-success/30" : "bg-danger/15 text-danger border-danger/30"
                        )}>
                          {isConform ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          {item.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observations */}
              {(selectedRecord.observations1 || selectedRecord.observations2) && (
                <div className="mt-8 space-y-4">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                    Observações
                    <div className="h-px flex-1 bg-border/50"></div>
                  </h4>
                  {selectedRecord.observations1 && (
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                      <p className="text-xs font-bold text-orange-500/70 mb-1 uppercase">1ª Avaliação</p>
                      <p className="text-sm italic">{selectedRecord.observations1}</p>
                    </div>
                  )}
                  {selectedRecord.observations2 && (
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                      <p className="text-xs font-bold text-blue-500/70 mb-1 uppercase">2ª Avaliação</p>
                      <p className="text-sm italic">{selectedRecord.observations2}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
