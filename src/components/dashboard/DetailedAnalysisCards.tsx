import { AuditRecord, getDressingContentsBreakdown, getDressingCompleteness, getInsertionSiteDistribution, getCatheterCoverageDistribution, getAsepsisTechniqueDistribution, getConformityByResponsible } from '@/lib/auditData';
import { useMemo } from 'react';
import { FileText, Syringe, Shield, Stethoscope, UserCheck, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Paleta unificada ─── */
const PALETTE = {
  primary: 'hsl(199, 89%, 48%)',
  teal: 'hsl(172, 66%, 50%)',
  indigo: 'hsl(226, 70%, 55%)',
  success: 'hsl(142, 71%, 45%)',
  warning: 'hsl(47, 96%, 53%)',
  danger: 'hsl(0, 72%, 55%)',
  muted: 'hsl(215, 15%, 52%)',
};

const SERIES = [PALETTE.primary, PALETTE.teal, PALETTE.indigo];

interface Props {
  records: AuditRecord[];
}

/* ─── Mini progress bar ─── */
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  );
}

/* ─── Reusable analysis card shell ─── */
function AnalysisCard({ title, subtitle, icon, accentColor, children }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-glass rounded-xl overflow-hidden animate-fade-in shadow-lg group hover:border-primary/30 transition-all duration-300">
      <div className="px-5 pt-5 pb-3 flex items-start gap-3">
        <div
          className="rounded-xl p-2.5 border flex-shrink-0"
          style={{ background: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wider leading-tight">{title}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}

/* ─── Dressing Contents Card ─── */
function DressingContentsCard({ records }: Props) {
  const breakdown = useMemo(() => getDressingContentsBreakdown(records), [records]);
  const completeness = useMemo(() => getDressingCompleteness(records), [records]);

  const completeRate = completeness.total > 0 ? (completeness.complete / completeness.total) * 100 : 0;

  const colors = SERIES;

  return (
    <AnalysisCard
      title="Conteúdo do Curativo"
      subtitle="O que consta registrado no curativo"
      icon={<FileText className="h-5 w-5" />}
      accentColor={PALETTE.primary}
    >
      {/* Completeness ring */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="relative h-16 w-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke={PALETTE.primary} strokeWidth="3"
              strokeDasharray={`${completeRate}, 100`}
              className="transition-all duration-1000" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
            {completeRate.toFixed(0)}%
          </span>
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">Completude do Registro</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {completeness.complete} completos · {completeness.partial} parciais · {completeness.empty} vazios
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">
            Completo = Data + Turno + Assinatura
          </p>
        </div>
      </div>

      {/* Items breakdown */}
      <div className="space-y-2.5">
        {breakdown.map((item, i) => (
          <div key={item.item} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground/80">{item.item}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">{item.count}x</span>
                <span className="font-bold text-foreground" style={{ color: colors[i % colors.length] }}>
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <ProgressBar value={item.percentage} color={colors[i % colors.length]} />
          </div>
        ))}
        {breakdown.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4">Sem dados disponíveis</p>
        )}
      </div>
    </AnalysisCard>
  );
}

/* ─── Insertion Site Card ─── */
function InsertionSiteCard({ records }: Props) {
  const distribution = useMemo(() => getInsertionSiteDistribution(records), [records]);
  const total = distribution.reduce((a, b) => a + b.count, 0);
  const healthyCount = distribution.find(d => d.condition.includes('Sem sinais'))?.count || 0;
  const healthyRate = total > 0 ? (healthyCount / total) * 100 : 0;

  return (
    <AnalysisCard
      title="Sítio de Inserção"
      subtitle="Condição do local de inserção do cateter"
      icon={<Syringe className="h-5 w-5" />}
      accentColor={PALETTE.teal}
    >
      {/* Health indicator */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl border"
        style={{
          background: healthyRate >= 80 ? 'hsla(142, 71%, 45%, 0.06)' : 'hsla(0, 72%, 55%, 0.06)',
          borderColor: healthyRate >= 80 ? 'hsla(142, 71%, 45%, 0.2)' : 'hsla(0, 72%, 55%, 0.2)',
        }}>
        <div className={cn(
          "h-3 w-3 rounded-full animate-pulse-dot flex-shrink-0",
          healthyRate >= 80 ? "bg-success" : "bg-danger"
        )} />
        <div>
          <p className="text-sm font-bold" style={{ color: healthyRate >= 80 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 55%)' }}>
            {healthyRate.toFixed(1)}% sem sinais flogísticos
          </p>
          <p className="text-[10px] text-muted-foreground">
            {healthyCount} de {total} avaliações sem alterações
          </p>
        </div>
      </div>

      {/* Conditions list */}
      <div className="space-y-2">
        {distribution.map((item) => {
          const isHealthy = item.condition.includes('Sem sinais');
          return (
            <div key={item.condition} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("h-2 w-2 rounded-full flex-shrink-0", isHealthy ? "bg-success" : "bg-danger")} />
                <span className="text-xs font-medium text-foreground/80 truncate">{item.condition}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono text-muted-foreground">{item.count}</span>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border",
                  isHealthy ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
                )}>
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
        {distribution.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4">Sem dados disponíveis</p>
        )}
      </div>
    </AnalysisCard>
  );
}

/* ─── Catheter Coverage Card ─── */
function CatheterCoverageCard({ records }: Props) {
  const distribution = useMemo(() => getCatheterCoverageDistribution(records), [records]);
  const total = distribution.reduce((a, b) => a + b.count, 0);

  const colorMap: Record<string, string> = {
    'Cobertura estéril transparente': PALETTE.primary,
    'Cobertura não estéril': PALETTE.indigo,
    'Cobertura com Gaze e filme estéril': PALETTE.teal,
  };

  return (
    <AnalysisCard
      title="Cobertura de Cateter"
      subtitle="Tipos de cobertura utilizados"
      icon={<Shield className="h-5 w-5" />}
      accentColor={PALETTE.indigo}
    >
      {/* Visual bar chart */}
      <div className="space-y-3">
        {distribution.map((item) => {
          const barColor = colorMap[item.type] || PALETTE.teal;
          return (
            <div key={item.type} className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium text-foreground/80 leading-tight">{item.type}</span>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: barColor }}>
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ProgressBar value={item.percentage} color={barColor} />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground w-8 text-right flex-shrink-0">{item.count}x</span>
              </div>
            </div>
          );
        })}
        {distribution.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4">Sem dados disponíveis</p>
        )}
      </div>

      {/* Summary */}
      {total > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total de registros</span>
          <span className="text-sm font-bold text-foreground">{total}</span>
        </div>
      )}
    </AnalysisCard>
  );
}

/* ─── Asepsis Technique Card ─── */
function AsepsisTechniqueCard({ records }: Props) {
  const distribution = useMemo(() => getAsepsisTechniqueDistribution(records), [records]);
  const total = distribution.reduce((a, b) => a + b.count, 0);

  const statusConfig: Record<string, { color: string; label: string }> = {
    'Conforme': { color: PALETTE.success, label: 'Conforme' },
    'Não avaliado': { color: PALETTE.muted, label: 'Não Avaliado' },
    'Não conforme': { color: PALETTE.danger, label: 'Não Conforme' },
  };

  return (
    <AnalysisCard
      title="Técnica de Assepsia"
      subtitle="Avaliação da técnica correta de assepsia"
      icon={<Stethoscope className="h-5 w-5" />}
      accentColor={PALETTE.primary}
    >
      {/* Status cards grid */}
      <div className="grid grid-cols-1 gap-2">
        {distribution.map((item) => {
          const config = statusConfig[item.status] || { color: 'hsl(215, 15%, 52%)', label: item.status };
          return (
            <div key={item.status} className="flex items-center justify-between p-3 rounded-xl border"
              style={{ background: `${config.color}08`, borderColor: `${config.color}20` }}>
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: config.color }} />
                <span className="text-xs font-semibold" style={{ color: config.color }}>
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-foreground">{item.count}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                  style={{ background: `${config.color}12`, borderColor: `${config.color}25`, color: config.color }}>
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
        {distribution.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4">Sem dados disponíveis</p>
        )}
      </div>

      {/* Stacked bar */}
      {total > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Distribuição Visual</p>
          <div className="h-4 w-full rounded-full overflow-hidden flex">
            {distribution.map((item) => {
              const config = statusConfig[item.status] || { color: 'hsl(215, 15%, 52%)', label: item.status };
              return (
                <div
                  key={item.status}
                  className="h-full transition-all duration-700"
                  style={{ width: `${item.percentage}%`, background: config.color }}
                  title={`${config.label}: ${item.percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>
        </div>
      )}
    </AnalysisCard>
  );
}

/* ─── Responsible Performance Card ─── */
function ResponsibleCard({ records }: Props) {
  const data = useMemo(() => getConformityByResponsible(records), [records]);
  const maxRate = data.length > 0 ? Math.max(...data.map(d => d.rate)) : 100;

  return (
    <AnalysisCard
      title="Desempenho por Responsável"
      subtitle="Ranking de conformidade por profissional"
      icon={<UserCheck className="h-5 w-5" />}
      accentColor={PALETTE.teal}
    >
      {/* Header */}
      <div className="flex items-center text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 pb-2 mb-1 border-b border-white/5">
        <span className="w-6">#</span>
        <span className="flex-1">Profissional</span>
        <span className="w-14 text-right">Aud.</span>
        <span className="w-20 text-right">Taxa</span>
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {data.map((person, i) => (
          <div
            key={person.name}
            className="flex items-center py-2.5 px-1 rounded-lg hover:bg-white/[0.03] transition-colors group"
          >
            {/* Rank */}
            <span className="w-6 text-[11px] font-bold text-muted-foreground/40 tabular-nums">
              {i + 1}
            </span>

            {/* Name + inline bar */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground/90 truncate">{person.name}</p>
              <div className="h-1 w-full rounded-full bg-white/[0.04] mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(person.rate / maxRate) * 100}%`,
                    background: PALETTE.primary,
                    opacity: 1 - i * 0.06,
                  }}
                />
              </div>
            </div>

            {/* Audits count */}
            <span className="w-14 text-right text-[11px] text-muted-foreground tabular-nums">
              {person.audits}
            </span>

            {/* Rate */}
            <span className="w-20 text-right text-xs font-bold tabular-nums" style={{ color: PALETTE.primary }}>
              {person.rate.toFixed(1)}%
            </span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4">Sem dados disponíveis</p>
        )}
      </div>
    </AnalysisCard>
  );
}

/* ─── Access Type Distribution Card ─── */
function AccessTypeCard({ records }: Props) {
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of records) {
      if (r.accessType && r.accessType.trim()) {
        counts[r.accessType] = (counts[r.accessType] || 0) + 1;
      }
    }
    const total = records.length;
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const colors = SERIES;

  return (
    <AnalysisCard
      title="Distribuição por Tipo de Acesso"
      subtitle="Proporção dos tipos de acesso venoso"
      icon={<ClipboardList className="h-5 w-5" />}
      accentColor={PALETTE.primary}
    >
      {/* Donut-like visual */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative h-20 w-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3.5" />
            {distribution.reduce((acc, item, i) => {
              const offset = acc.offset;
              acc.elements.push(
                <circle
                  key={item.type}
                  cx="18" cy="18" r="15.9155"
                  fill="none"
                  stroke={colors[i % colors.length]}
                  strokeWidth="3.5"
                  strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
                  strokeDashoffset={-offset}
                  className="transition-all duration-700"
                />
              );
              acc.offset += item.percentage;
              return acc;
            }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-foreground">
            {records.length}
          </span>
        </div>
        <div className="space-y-1.5 min-w-0 flex-1">
          {distribution.map((item, i) => (
            <div key={item.type} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: colors[i % colors.length] }} />
              <span className="text-[11px] text-foreground/80 truncate flex-1">{item.type}</span>
              <span className="text-[11px] font-bold text-foreground">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Percentage bars */}
      <div className="space-y-2">
        {distribution.map((item, i) => (
          <div key={item.type} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">{item.type}</span>
              <span className="text-[10px] font-bold" style={{ color: colors[i % colors.length] }}>{item.percentage.toFixed(1)}%</span>
            </div>
            <ProgressBar value={item.percentage} color={colors[i % colors.length]} />
          </div>
        ))}
      </div>
    </AnalysisCard>
  );
}

/* ─── Main Export ─── */
export default function DetailedAnalysisCards({ records }: Props) {
  return (
    <div className="space-y-5">

      {/* Row 1: 3 columns — cards com altura similar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <DressingContentsCard records={records} />
        <InsertionSiteCard records={records} />
        <CatheterCoverageCard records={records} />
      </div>

      {/* Row 2: Assepsia + Tipo de Acesso lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AsepsisTechniqueCard records={records} />
        <AccessTypeCard records={records} />
      </div>

      {/* Row 3: Responsável — card extenso em largura total */}
      <div className="grid grid-cols-1 gap-5">
        <ResponsibleCard records={records} />
      </div>
    </div>
  );
}
