import { AuditRecord, getMonthlyConformity, getConformityBySector, getNonConformityRanking, getConformityByShift, getConformityByAccessType } from '@/lib/auditData';
import { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Label, LabelList,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface ChartsProps {
  records: AuditRecord[];
}

const chartConfig = {
  rate: {
    label: "Conformidade",
    color: "hsl(172, 66%, 50%)",  // Professional Healthcare Teal
  },
  total: {
    label: "Volume Total",
    color: "hsl(199, 89%, 48%)",  // Deep Clinical Blue
  },
  conform: {
    label: "Conforme",
    color: "hsl(172, 66%, 50%)",
  },
  nonConform: {
    label: "Não Conforme",
    color: "hsl(226, 70%, 50%)",    // Professional Indigo
  },
} satisfies ChartConfig;

// Chart palette from design system
const CHART_COLORS = [
  'hsl(199, 89%, 48%)',  // --chart-1 blue
  'hsl(172, 66%, 50%)',  // --chart-2 teal
  'hsl(142, 71%, 45%)',  // --chart-7 green
  'hsl(47, 96%, 53%)',   // --chart-3 yellow
  'hsl(25, 95%, 53%)',   // --chart-4 orange
  'hsl(0, 72%, 55%)',    // --chart-5 red
  'hsl(280, 65%, 50%)',  // --chart-6 purple
  'hsl(328, 86%, 70%)',  // --chart-8 pink
];

const SEMANTIC = {
  conform: 'hsl(172, 66%, 50%)',
  nonconform: 'hsl(226, 70%, 50%)',
  primary: 'hsl(199, 89%, 48%)',
};

const axisStyle = {
  fill: 'hsl(215, 15%, 52%)',
  fontSize: 11,
  fontWeight: 500,
};

export default function DashboardCharts({ records }: ChartsProps) {
  const monthlyData = useMemo(() => getMonthlyConformity(records), [records]);
  const sectorData = useMemo(() => getConformityBySector(records), [records]);
  const rankingData = useMemo(() => getNonConformityRanking(records).slice(0, 7), [records]);
  const shiftData = useMemo(() => getConformityByShift(records), [records]);
  const accessData = useMemo(() => getConformityByAccessType(records), [records]);

  const totalVolume = useMemo(
    () => monthlyData.reduce((acc, curr) => acc + curr.total, 0).toLocaleString(),
    [monthlyData]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Volume mensal - Area Chart */}
      <Card className="lg:col-span-2 card-glass border-none overflow-hidden animate-fade-in shadow-lg">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-white/5 p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle className="text-sm font-bold text-foreground/80 uppercase tracking-widest">
              Volume Mensal de Auditorias
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Total de itens avaliados no período
            </CardDescription>
          </div>
          <div className="flex">
            <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left sm:border-l sm:border-white/5 sm:px-8 sm:py-6 bg-primary/5">
              <span className="text-[10px] uppercase font-semibold tracking-tighter text-muted-foreground">
                Volume Total Geral
              </span>
              <span className="text-2xl font-bold leading-none sm:text-3xl text-foreground">
                {totalVolume}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6 pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart
              data={monthlyData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <defs>
                <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={32}
                tick={axisStyle}
              />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--color-total)', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={
                  <ChartTooltipContent
                    className="w-[180px] card-glass border-white/10"
                    labelFormatter={(value) => `Mês: ${value}`}
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <div
                            className="h-2 w-2 rounded-[2px]"
                            style={{ backgroundColor: 'var(--color-total)' }}
                          />
                          <span className="text-muted-foreground">Volume de Auditorias</span>
                        </div>
                        <span className="font-mono font-medium text-foreground">
                          {value}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#fillArea)"
                animationDuration={1500}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-glass border-none animate-fade-in shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground/80 uppercase tracking-widest">
            Conformidade por Setor
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Desempenho comparativo entre unidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
            <BarChart
              data={sectorData}
              layout="vertical"
              margin={{
                left: 0,
                right: 40,
              }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <YAxis
                dataKey="sector"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ ...axisStyle, fontSize: 10 }}
                width={120}
              />
              <XAxis type="number" domain={[0, 100]} hide />
              <ChartTooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                content={
                  <ChartTooltipContent
                    className="card-glass border-white/10"
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Conformidade</span>
                        <span className="font-mono font-medium text-foreground">{`${Number(value).toFixed(1)}%`}</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="rate"
                layout="vertical"
                fill={SEMANTIC.primary}
                radius={[0, 4, 4, 0]}
                barSize={18}
                animationDuration={1000}
              >
                <LabelList
                  dataKey="rate"
                  position="right"
                  offset={10}
                  className="fill-muted-foreground font-semibold text-[10px]"
                  formatter={(value: number) => `${value.toFixed(0)}%`}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-glass border-none animate-fade-in shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground/80 uppercase tracking-widest">
            Não Conformidades Mais Frequentes
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Principais causas de falhas no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
            <BarChart
              data={rankingData}
              layout="vertical"
              margin={{
                left: -20,
                right: 45,
                top: 0,
                bottom: 0
              }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{
                  fill: 'hsl(var(--foreground))',
                  fontSize: 11,
                  fontWeight: 500,
                  opacity: 0.9
                }}
                width={180}
              />
              <XAxis type="number" hide />
              <ChartTooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                content={
                  <ChartTooltipContent
                    className="card-glass border-white/10"
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Ocorrências</span>
                        <span className="font-mono font-medium text-foreground">{value}</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="count"
                layout="vertical"
                fill={SEMANTIC.nonconform}
                radius={[0, 4, 4, 0]}
                barSize={16}
                animationDuration={1000}
              >
                <LabelList
                  dataKey="count"
                  position="right"
                  offset={12}
                  className="fill-muted-foreground font-bold text-[11px]"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-glass border-none animate-fade-in shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground/80 uppercase tracking-widest">
            Comparativo por Turno
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Conformidade vs Não Conformidade por período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
            <BarChart data={shiftData} margin={{ top: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="shift" tick={axisStyle} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <ChartTooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                content={
                  <ChartTooltipContent
                    className="w-[180px] card-glass border-white/10 gap-2.5"
                    indicator="dot"
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="conform" fill={SEMANTIC.conform} name="Conforme" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1000} />
              <Bar dataKey="nonConform" fill={SEMANTIC.nonconform} name="Não Conforme" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1000} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-glass border-none animate-fade-in shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground/80 uppercase tracking-widest">
            Tipo de Acesso vs Conformidade
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Taxa de conformidade por tecnologia Cateter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
            <RadarChart
              data={accessData}
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="card-glass border-white/10"
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Conformidade</span>
                        <span className="font-mono font-medium text-foreground">{`${Number(value).toFixed(1)}%`}</span>
                      </div>
                    )}
                  />
                }
              />
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis
                dataKey="type"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, opacity: 0.7 }}
              />
              <Radar
                name={chartConfig.rate.label}
                dataKey="rate"
                stroke="hsl(172, 66%, 50%)"
                fill="hsl(172, 66%, 50%)"
                fillOpacity={0.4}
                dot={{
                  r: 4,
                  fillOpacity: 1,
                }}
                animationDuration={2000}
              />
            </RadarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
