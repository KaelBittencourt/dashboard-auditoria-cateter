import { AuditRecord } from '@/lib/auditData';
import { useMemo } from 'react';
import { ClipboardCheck, AlertTriangle, CheckCircle2, BarChart3, Percent } from 'lucide-react';

interface KPICardsProps {
  records: AuditRecord[];
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'success' | 'danger' | 'primary' | 'warning';
}

function KPICard({ title, value, subtitle, icon, color }: KPICardProps) {
  const glowClass = {
    success: 'hover:glow-success',
    danger: 'hover:glow-danger',
    primary: 'hover:glow-primary',
    warning: '',
  };

  const iconBg = {
    success: 'bg-success/15 text-success border-success/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    primary: 'bg-primary/15 text-primary border-primary/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
  };

  return (
    <div className={`card-glass rounded-xl p-5 flex items-center gap-4 transition-all duration-300 hover:border-primary/30 ${glowClass[color]} animate-fade-in`}>
      <div className={`rounded-xl p-3 border ${iconBg[color]} flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function KPICards({ records }: KPICardsProps) {
  const stats = useMemo(() => {
    const total = records.length;
    const totalEvaluated = records.reduce((acc, r) => acc + r.totalEvaluated, 0);
    const totalConform = records.reduce((acc, r) => acc + r.totalConform, 0);
    const conformRate = totalEvaluated > 0 ? (totalConform / totalEvaluated) * 100 : 0;
    const nonConformRate = 100 - conformRate;
    const avgPerAudit = total > 0 ? records.reduce((acc, r) => acc + r.conformRate, 0) / total : 0;

    return { total, totalEvaluated, conformRate, nonConformRate, avgPerAudit };
  }, [records]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <KPICard
        title="Auditorias"
        value={stats.total}
        subtitle="Total realizadas"
        icon={<ClipboardCheck className="h-8 w-8" />}
        color="primary"
      />
      <KPICard
        title="Conformidade"
        value={`${stats.conformRate.toFixed(1)}%`}
        subtitle="Taxa geral"
        icon={<CheckCircle2 className="h-8 w-8" />}
        color="success"
      />
      <KPICard
        title="Não Conformidade"
        value={`${stats.nonConformRate.toFixed(1)}%`}
        subtitle="Taxa geral"
        icon={<AlertTriangle className="h-8 w-8" />}
        color="danger"
      />
      <KPICard
        title="Itens Avaliados"
        value={stats.totalEvaluated}
        subtitle="Total de itens"
        icon={<BarChart3 className="h-8 w-8" />}
        color="warning"
      />
      <KPICard
        title="Média por Auditoria"
        value={`${stats.avgPerAudit.toFixed(1)}%`}
        subtitle="Percentual médio"
        icon={<Percent className="h-8 w-8" />}
        color="primary"
      />
    </div>
  );
}
