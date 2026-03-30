import Papa from 'papaparse';

const SHEET_ID = '1pDcgWoYvSo0nd-zigheYnt_wBWcJBco0jSBDtPaO7Vo';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

// Column mapping for conformity fields (first evaluation)
const CONFORMITY_FIELDS_1 = [
  'Curativo Integro',
  'Curativo está datado e válido',
  'Equipos e conexão rotuladas',
  'Equipos e conexão dentro da validade',
  ' Solução rotuladas',
  'Enfermeiro sabe o motivo de permanencia do cateter? ',
  'Existe indicação de permanência?',
] as const;

// Labels for display
const CONFORMITY_LABELS: Record<string, string> = {
  'Curativo Integro': 'Curativo Íntegro',
  'Curativo está datado e válido': 'Curativo Datado e Válido',
  'Equipos e conexão rotuladas': 'Equipos/Conexão Rotulados',
  'Equipos e conexão dentro da validade': 'Equipos Dentro da Validade',
  ' Solução rotuladas': 'Solução Rotulada',
  'Enfermeiro sabe o motivo de permanencia do cateter? ': 'Motivo de Permanência',
  'Existe indicação de permanência?': 'Indicação de Permanência',
};

export interface AuditRecord {
  timestamp: string;
  date: string;
  parsedDate: Date | null;
  sector: string;
  shift: string;
  responsible: string;
  accessType: string;
  observations1: string;
  observations2: string;
  conformityItems: { label: string; value: string }[];
  conformRate: number;
  totalEvaluated: number;
  totalConform: number;
  totalNonConform: number;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function isConform(value: string): boolean | null {
  if (!value || value.trim() === '' || value === 'Não avaliado') return null;
  return value.trim().toLowerCase() === 'sim';
}

function parseRow(row: Record<string, string>): AuditRecord {
  const keys = Object.keys(row);
  const conformityItems: { label: string; value: string }[] = [];

  // We need to handle duplicate column names - papaparse adds suffixes like "_1"
  // First evaluation columns
  for (const field of CONFORMITY_FIELDS_1) {
    const val = row[field];
    if (val !== undefined) {
      conformityItems.push({
        label: CONFORMITY_LABELS[field] || field.trim(),
        value: val,
      });
    }
  }

  // Second evaluation columns (duplicates get _1 suffix from papaparse)
  for (const field of CONFORMITY_FIELDS_1) {
    const dupeKey = keys.find(k => k === field + '_1') || keys.find(k => k.startsWith(field.trim()) && k !== field && !k.endsWith('_1'));
    // papaparse handles dupes differently - let's check by index
    const val = row[field + '_1'];
    if (val !== undefined && val.trim() !== '') {
      conformityItems.push({
        label: (CONFORMITY_LABELS[field] || field.trim()) + ' (2ª avaliação)',
        value: val,
      });
    }
  }

  let totalEvaluated = 0;
  let totalConform = 0;

  for (const item of conformityItems) {
    const result = isConform(item.value);
    if (result !== null) {
      totalEvaluated++;
      if (result) totalConform++;
    }
  }

  const conformRate = totalEvaluated > 0 ? (totalConform / totalEvaluated) * 100 : 0;

  return {
    timestamp: row['Carimbo de data/hora'] || '',
    date: row['1. Data da auditoria'] || '',
    parsedDate: parseDate(row['1. Data da auditoria'] || ''),
    sector: (row['2. Setor Auditado'] || '').replace('Unidade de Internação', 'Internação'),
    shift: row['3. Turno:'] || '',
    responsible: row['4. Responsável pela unidade'] || '',
    accessType: row['5. Tipo de acesso'] || '',
    observations1: row['Observações'] || '',
    observations2: row['Observações_1'] || '',
    conformityItems,
    conformRate,
    totalEvaluated,
    totalConform,
    totalNonConform: totalEvaluated - totalConform,
  };
}

let cache: { data: AuditRecord[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchAuditData(): Promise<AuditRecord[]> {
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  const response = await fetch(CSV_URL);
  const csvText = await response.text();

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const records = result.data.map(parseRow).filter(r => r.date);
  cache = { data: records, timestamp: Date.now() };
  return records;
}

export function getUniqueValues(records: AuditRecord[], field: keyof AuditRecord): string[] {
  const values = new Set<string>();
  for (const r of records) {
    const v = r[field];
    if (typeof v === 'string' && v.trim()) values.add(v.trim());
  }
  return Array.from(values).sort();
}

export function getNonConformityRanking(records: AuditRecord[]): { label: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of records) {
    for (const item of r.conformityItems) {
      const result = isConform(item.value);
      if (result === false) {
        const label = item.label.replace(' (2ª avaliação)', '');
        counts[label] = (counts[label] || 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function getMonthlyConformity(records: AuditRecord[]): { month: string; rate: number; total: number }[] {
  const grouped: Record<string, { total: number; conform: number }> = {};
  for (const r of records) {
    if (!r.parsedDate) continue;
    const key = `${r.parsedDate.getFullYear()}-${String(r.parsedDate.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = { total: 0, conform: 0 };
    grouped[key].total += r.totalEvaluated;
    grouped[key].conform += r.totalConform;
  }
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: formatMonth(month),
      rate: data.total > 0 ? (data.conform / data.total) * 100 : 0,
      total: data.total,
    }));
}

function formatMonth(key: string): string {
  const [year, month] = key.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[Number(month) - 1]}/${year.slice(2)}`;
}

export function getConformityBySector(records: AuditRecord[]): { sector: string; rate: number }[] {
  const grouped: Record<string, { total: number; conform: number }> = {};
  for (const r of records) {
    if (!grouped[r.sector]) grouped[r.sector] = { total: 0, conform: 0 };
    grouped[r.sector].total += r.totalEvaluated;
    grouped[r.sector].conform += r.totalConform;
  }
  return Object.entries(grouped).map(([sector, data]) => ({
    sector,
    rate: data.total > 0 ? (data.conform / data.total) * 100 : 0,
  }));
}

export function getConformityByShift(records: AuditRecord[]): { shift: string; conform: number; nonConform: number }[] {
  const grouped: Record<string, { total: number; conform: number }> = {};
  for (const r of records) {
    if (!grouped[r.shift]) grouped[r.shift] = { total: 0, conform: 0 };
    grouped[r.shift].total += r.totalEvaluated;
    grouped[r.shift].conform += r.totalConform;
  }
  return Object.entries(grouped).map(([shift, data]) => ({
    shift,
    conform: data.conform,
    nonConform: data.total - data.conform,
  }));
}

export function getConformityByAccessType(records: AuditRecord[]): { type: string; rate: number }[] {
  const grouped: Record<string, { total: number; conform: number }> = {};
  for (const r of records) {
    if (!r.accessType) continue;
    if (!grouped[r.accessType]) grouped[r.accessType] = { total: 0, conform: 0 };
    grouped[r.accessType].total += r.totalEvaluated;
    grouped[r.accessType].conform += r.totalConform;
  }
  return Object.entries(grouped).map(([type, data]) => ({
    type,
    rate: data.total > 0 ? (data.conform / data.total) * 100 : 0,
  }));
}
