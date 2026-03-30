import { AuditRecord, getNonConformityRanking, getConformityBySector, getMonthlyConformity } from '@/lib/auditData';
import { useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Trophy, Lightbulb } from 'lucide-react';

interface AutomaticInsightsProps {
  records: AuditRecord[];
}

interface InsightItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'positive' | 'negative' | 'neutral';
}

function InsightItem({ title, description, icon, type }: InsightItemProps) {
  const bgStyles = {
    positive: 'bg-[hsl(172,66%,50%)]/10 border-[hsl(172,66%,50%)]/20 text-[hsl(172,66%,50%)]',
    negative: 'bg-[hsl(226,70%,50%)]/10 border-[hsl(226,70%,50%)]/20 text-[hsl(226,70%,50%)]',
    neutral: 'bg-[hsl(199,89%,48%)]/10 border-[hsl(199,89%,48%)]/20 text-[hsl(199,89%,48%)]',
  };

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all hover:scale-[1.02] duration-300 ${bgStyles[type]}`}>
      <div className="mt-0.5 p-2 rounded-lg bg-white/5 border border-current/10">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold leading-tight mb-1">{title}</h4>
        <p className="text-xs opacity-90 leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}

export default function AutomaticInsights({ records }: AutomaticInsightsProps) {
  const insights = useMemo(() => {
    if (records.length === 0) return [];

    const results: InsightItemProps[] = [];

    // 1. Most frequent non-conformity (Ponto de Atenção)
    const nonConformities = getNonConformityRanking(records);
    if (nonConformities.length > 0) {
      results.push({
        title: 'Principal Ponto de Atenção',
        description: `O item "${nonConformities[0].label}" é a maior causa de não conformidade com ${nonConformities[0].count} ocorrências.`,
        icon: <AlertCircle className="h-5 w-5" />,
        type: 'negative',
      });
    }

    // 2. Best performing sector (Melhor Desempenho)
    const sectorConformity = getConformityBySector(records);
    if (sectorConformity.length > 0) {
      const bestSector = [...sectorConformity].sort((a, b) => b.rate - a.rate)[0];
      if (bestSector && bestSector.rate > 0) {
        results.push({
          title: 'Melhor Desempenho',
          description: `O setor "${bestSector.sector}" lidera em conformidade com uma taxa de ${bestSector.rate.toFixed(1)}%.`,
          icon: <Trophy className="h-5 w-5" />,
          type: 'positive',
        });
      }
    }

    // 3. Monthly Trend (Tendência)
    const monthlyData = getMonthlyConformity(records);
    if (monthlyData.length >= 2) {
      const current = monthlyData[monthlyData.length - 1];
      const previous = monthlyData[monthlyData.length - 2];
      const diff = current.rate - previous.rate;

      if (Math.abs(diff) > 0.5) {
        results.push({
          title: `Tendência ${current.month}`,
          description: `A conformidade ${diff > 0 ? 'subiu' : 'caiu'} ${Math.abs(diff).toFixed(1)}% em relação ao mês anterior (${previous.month}).`,
          icon: diff > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />,
          type: diff > 0 ? 'positive' : 'negative',
        });
      }
    }

    // 4. General Tip (Insight Adicional)
    const totalEvaluated = records.reduce((acc, r) => acc + r.totalEvaluated, 0);
    const totalConform = records.reduce((acc, r) => acc + r.totalConform, 0);
    const overallRate = totalEvaluated > 0 ? (totalConform / totalEvaluated) * 100 : 0;

    if (overallRate < 85) {
      results.push({
        title: 'Oportunidade de Melhoria',
        description: 'A taxa geral está abaixo da meta recomendada de 90%. Considere treinamentos focados nos itens críticos.',
        icon: <Lightbulb className="h-5 w-5" />,
        type: 'neutral',
      });
    } else {
      results.push({
        title: 'Excelente Trabalho',
        description: 'A equipe está mantendo altos padrões de conformidade. Continue o monitoramento preventivo.',
        icon: <Sparkles className="h-5 w-5" />,
        type: 'positive',
      });
    }

    return results.slice(0, 4); // Limit to 4 insights
  }, [records]);

  if (insights.length === 0) return null;

  return (
    <div className="card-glass rounded-xl p-5 animate-fade-in border-t-2 border-t-[hsl(199,89%,48%)]/20">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-[hsl(199,89%,48%)]" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Insights Automáticos</h3>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {insights.map((insight, index) => (
          <InsightItem key={index} {...insight} />
        ))}
      </div>
    </div>
  );
}
