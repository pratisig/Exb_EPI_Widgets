import { DateConvention, Period, Statistic, WeekMode } from '../config'
import { aggregate, parseEpiDate, periodFor } from './aggregation'

export interface ComparisonRow { periodKey: string; label: string; values: { [year: number]: number }; change?: number; changePct?: number }

/** Aligns the same epi period across years, e.g. S01 2023 vs S01 2024. */
export function compareYears(records: any[], dateField: string, period: Period, years: number[], weekMode: WeekMode, statistic: Statistic, valueField?: string, valueType: 'number' | 'date' | 'text' = 'number', convention: DateConvention = 'dmy', outbreakStart?: string, referenceYear?: number): ComparisonRow[] {
  const selected = years.filter(year => isFinite(year)).sort((a, b) => a - b); const groups = new Map<string, ComparisonRow>()
  selected.forEach(year => {
    const yearRecords = records.filter(record => { const attrs = record?.getData ? record.getData() : (record?.attributes || record); const date = parseEpiDate(attrs?.[dateField], convention); return date?.getUTCFullYear() === year })
    const result = aggregate(yearRecords, dateField, period, weekMode, outbreakStart, convention, statistic, valueField, valueType, false)
    result.rows.forEach(row => { const comparisonKey = period === 'year' ? 'year' : period === 'month' ? row.key.slice(5) : period === 'quarter' ? row.key.slice(5) : row.key.slice(row.key.indexOf('-W') + 1); const existing = groups.get(comparisonKey) || { periodKey: comparisonKey, label: period === 'epi-week' ? `S${comparisonKey}` : row.label, values: {} }; existing.values[year] = Number(row.value) || 0; groups.set(comparisonKey, existing) })
  })
  const ref = referenceYear || selected[selected.length - 1]; return Array.from(groups.values()).sort((a, b) => a.periodKey.localeCompare(b.periodKey, undefined, { numeric: true })).map(row => { const base = row.values[ref]; const current = row.values[selected[selected.length - 1]]; return { ...row, change: base !== undefined && current !== undefined ? current - base : undefined, changePct: base ? ((current - base) / base) * 100 : undefined } })
}
