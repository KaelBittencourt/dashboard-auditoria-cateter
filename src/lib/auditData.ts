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
  // New fields from additional columns
  dressingContents1: string;   // "No curativo consta:" (1ª avaliação)
  dressingContents2: string;   // "No curativo consta:" (2ª avaliação)
  insertionSite1: string;      // "Sitio da Inserção apresenta" (1ª avaliação)
  insertionSite2: string;      // "Sitio da Inserção apresenta" (2ª avaliação)
  catheterCoverage1: string;   // "17. Cobertura de cateter" (1ª avaliação)
  catheterCoverage2: string;   // "17. Cobertura de cateter" (2ª avaliação)
  asepsisTechnique1: string;   // "18. Técnica Correta de assepsia" (1ª avaliação)
  asepsisTechnique2: string;   // "18. Técnica Correta de assepsia" (2ª avaliação)
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
    // New fields - additional columns
    dressingContents1: row['No curativo consta:'] || '',
    dressingContents2: row['No curativo consta:_1'] || '',
    insertionSite1: row['Sitio da Inserção apresenta'] || '',
    insertionSite2: row['Sitio da Inserção apresenta_1'] || '',
    catheterCoverage1: row['17.  Cobertura de cateter'] || '',
    catheterCoverage2: row['17.  Cobertura de cateter_1'] || '',
    asepsisTechnique1: row['18. Técnica Correta de assepsia '] || '',
    asepsisTechnique2: row['18. Técnica Correta de assepsia _1'] || '',
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
    if (!r.sector || !r.sector.trim()) continue;
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

// =============================================
// New analytical functions for additional columns
// =============================================

/** 
 * Parse multi-value column like "Data, Turno, Assinatura" into individual items 
 */
function parseMultiValue(value: string): string[] {
  if (!value || value.trim() === '') return [];
  return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
}

/**
 * "No curativo consta:" — Breakdown of what items the dressing contains
 * Returns counts for Data, Turno, Assinatura individually
 */
export function getDressingContentsBreakdown(records: AuditRecord[]): { item: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {};
  let totalRecordsWithData = 0;

  for (const r of records) {
    const values = [r.dressingContents1, r.dressingContents2].filter(v => v.trim());
    for (const v of values) {
      totalRecordsWithData++;
      const items = parseMultiValue(v);
      for (const item of items) {
        counts[item] = (counts[item] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([item, count]) => ({
      item,
      count,
      percentage: totalRecordsWithData > 0 ? (count / totalRecordsWithData) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * "No curativo consta:" — Completeness analysis (has all 3: Data, Turno, Assinatura)
 */
export function getDressingCompleteness(records: AuditRecord[]): { complete: number; partial: number; empty: number; total: number } {
  let complete = 0;
  let partial = 0;
  let empty = 0;

  // Only consider records that have an access (not "Sem Acesso")
  const relevantRecords = records.filter(r => r.accessType && r.accessType !== 'Sem Acesso');

  for (const r of relevantRecords) {
    const allValues = [r.dressingContents1, r.dressingContents2].filter(v => v.trim());
    if (allValues.length === 0) {
      empty++;
      continue;
    }
    for (const val of allValues) {
      const items = parseMultiValue(val);
      const hasData = items.some(i => i.toLowerCase() === 'data');
      const hasTurno = items.some(i => i.toLowerCase() === 'turno');
      const hasAssinatura = items.some(i => i.toLowerCase() === 'assinatura');
      if (hasData && hasTurno && hasAssinatura) {
        complete++;
      } else {
        partial++;
      }
    }
  }

  return { complete, partial, empty, total: complete + partial + empty };
}

/**
 * "Sitio da Inserção apresenta" — Distribution of insertion site conditions
 */
export function getInsertionSiteDistribution(records: AuditRecord[]): { condition: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const r of records) {
    const values = [r.insertionSite1, r.insertionSite2].filter(v => v.trim());
    for (const v of values) {
      total++;
      counts[v.trim()] = (counts[v.trim()] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([condition, count]) => ({
      condition,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * "17. Cobertura de cateter" — Distribution of catheter coverage types
 */
export function getCatheterCoverageDistribution(records: AuditRecord[]): { type: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {};
  let totalRecordsWithData = 0;

  for (const r of records) {
    const values = [r.catheterCoverage1, r.catheterCoverage2].filter(v => v.trim());
    for (const v of values) {
      totalRecordsWithData++;
      const items = parseMultiValue(v);
      for (const item of items) {
        counts[item] = (counts[item] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: totalRecordsWithData > 0 ? (count / totalRecordsWithData) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * "18. Técnica Correta de assepsia" — Distribution of asepsis technique evaluations
 */
export function getAsepsisTechniqueDistribution(records: AuditRecord[]): { status: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const r of records) {
    const values = [r.asepsisTechnique1, r.asepsisTechnique2].filter(v => v.trim());
    for (const v of values) {
      total++;
      counts[v.trim()] = (counts[v.trim()] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * "Responsável pela unidade" — Audits count and conformity per responsible person
 */
export function getConformityByResponsible(records: AuditRecord[]): { name: string; audits: number; rate: number; totalEvaluated: number }[] {
  const grouped: Record<string, { audits: number; total: number; conform: number }> = {};
  for (const r of records) {
    const name = r.responsible.trim();
    if (!name) continue;
    if (!grouped[name]) grouped[name] = { audits: 0, total: 0, conform: 0 };
    grouped[name].audits++;
    grouped[name].total += r.totalEvaluated;
    grouped[name].conform += r.totalConform;
  }
  return Object.entries(grouped)
    .map(([name, data]) => ({
      name,
      audits: data.audits,
      rate: data.total > 0 ? (data.conform / data.total) * 100 : 0,
      totalEvaluated: data.total,
    }))
    .sort((a, b) => b.audits - a.audits);
}

/**
 * Coverage type combined with access type correlation
 */
export function getCoverageByAccessType(records: AuditRecord[]): { accessType: string; coverageType: string; count: number }[] {
  const counts: Record<string, number> = {};

  for (const r of records) {
    if (!r.accessType || r.accessType === 'Sem Acesso') continue;
    const coverages = [r.catheterCoverage1, r.catheterCoverage2].filter(v => v.trim());
    for (const cov of coverages) {
      const items = parseMultiValue(cov);
      for (const item of items) {
        const key = `${r.accessType}|||${item}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([key, count]) => {
      const [accessType, coverageType] = key.split('|||');
      return { accessType, coverageType, count };
    })
    .sort((a, b) => b.count - a.count);
}
