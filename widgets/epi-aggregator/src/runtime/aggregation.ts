/** Date and period utilities deliberately have no Experience Builder dependency.
 * They are also useful in tests and in future data-source adapters. */
import { Period, WeekMode, DateConvention, Statistic } from '../config'

export interface PeriodValue { key: string; label: string; start: Date; end: Date }

const pad = (n: number) => String(n).padStart(2, '0')
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d))

/** Handles ISO strings, US/EU dates, timestamps and Excel serial dates. */
export function parseEpiDate(value: unknown, convention: DateConvention = 'dmy'): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date && !isNaN(value.getTime())) return new Date(value.getTime())
  if (typeof value === 'number' && isFinite(value)) {
    // ArcGIS often returns epoch milliseconds; Excel serials are days since 1899-12-30.
    const d = value > 10000000000 ? new Date(value) : new Date(Date.UTC(1899, 11, 30) + value * 86400000)
    return isNaN(d.getTime()) ? null : d
  }
  const text = String(value).trim()
  if (!text) return null
  const native = new Date(text)
  // Resolve slash dates before the browser parser: 01/02/2023 is 1 February
  // for the field-team convention, whereas browser parsers usually make it January 2.
  let m = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:\s+(\d{1,2}):?(\d{2})?)?$/)
  if (m) {
    // Field teams commonly use day/month. The explicit setting avoids ambiguity.
    let day = +m[1]; let month = +m[2] - 1
    if (convention === 'mdy' || (convention === 'auto' && day <= 12 && +m[2] <= 12)) { day = +m[2]; month = +m[1] - 1 }
    // A component greater than 12 removes the ambiguity whatever the setting.
    if (+m[2] > 12) { day = +m[2]; month = +m[1] - 1 }
    const d = new Date(Date.UTC(+m[3], month, day, +(m[4] || 0), +(m[5] || 0)))
    return d.getUTCDate() === day && d.getUTCMonth() === month ? d : null
  }
  m = text.match(/^(\d{4})\s*[-/]?\s*(\d{1,2})$/) // useful for YYYY-MM epi labels
  if (m) return utc(+m[1], +m[2] - 1, 1)
  return isNaN(native.getTime()) ? null : native
}

function isoWeek(date: Date): { year: number, week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const year = d.getUTCFullYear()
  const first = new Date(Date.UTC(year, 0, 1))
  return { year, week: Math.ceil((((d.getTime() - first.getTime()) / 86400000) + 1) / 7) }
}

function weekStart(d: Date) { const x = new Date(d); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() - day + 1); return x }

export function periodFor(date: Date, period: Period, weekMode: WeekMode = 'iso', outbreak?: Date): PeriodValue {
  const y = date.getUTCFullYear(); const m = date.getUTCMonth()
  if (period === 'year') return { key: `${y}`, label: `${y}`, start: utc(y, 0, 1), end: utc(y + 1, 0, 1) }
  if (period === 'month') return { key: `${y}-${pad(m + 1)}`, label: `${y}-${pad(m + 1)}`, start: utc(y, m, 1), end: utc(y, m + 1, 1) }
  if (period === 'quarter') { const q = Math.floor(m / 3) + 1; return { key: `${y}-Q${q}`, label: `${y} T${q}`, start: utc(y, (q - 1) * 3, 1), end: utc(y, q * 3, 1) } }
  if (weekMode === 'outbreak' && outbreak) {
    const start = weekStart(outbreak); const current = weekStart(date)
    const week = Math.max(1, Math.floor((current.getTime() - start.getTime()) / (7 * 86400000)) + 1)
    const end = new Date(start.getTime() + week * 7 * 86400000)
    return { key: `EPI-W${week}`, label: `EPI W${week}`, start: new Date(start.getTime() + (week - 1) * 7 * 86400000), end }
  }
  const w = isoWeek(date)
  const start = weekStart(date); return { key: `${w.year}-W${pad(w.week)}`, label: `${w.year} S${w.week}`, start, end: new Date(start.getTime() + 7 * 86400000) }
}

export interface AggregateRow extends PeriodValue { count: number; value: any; records: any[] }

function numericValue(value: unknown): number | null {
  if (typeof value === 'number' && isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const normalized = value.replace(/\s/g, '').replace(',', '.')
    const n = Number(normalized); return isFinite(n) ? n : null
  }
  return null
}

function calculate(records: any[], valueField: string | undefined, statistic: Statistic, valueType: 'number' | 'date' | 'text' = 'number', metricMode: 'aggregate' | 'rate' = 'aggregate', numeratorField?: string, denominatorField?: string, rateFactor = 100): any {
  if (statistic === 'count' && metricMode !== 'rate') return records.length
  if (metricMode === 'rate') {
    const sum = (field?: string) => records.reduce((total, record) => { const attrs = record?.getData ? record.getData() : (record?.attributes || record); return total + (numericValue(field ? attrs?.[field] : null) || 0) }, 0)
    const denominator = sum(denominatorField); return denominator ? (sum(numeratorField) / denominator) * rateFactor : 0
  }
  const raw = records.map(record => { const attrs = record?.getData ? record.getData() : (record?.attributes || record); return valueField ? attrs?.[valueField] : null }).filter(v => v !== null && v !== undefined && v !== '')
  if (statistic === 'distinct') return new Set(raw.map(v => String(v))).size
  if (statistic === 'first' || statistic === 'last') return raw.length ? raw[statistic === 'first' ? 0 : raw.length - 1] : ''
  if (valueType === 'date' && (statistic === 'min' || statistic === 'max')) {
    const dates = raw.map(v => parseEpiDate(v)).filter((v): v is Date => !!v)
    if (!dates.length) return ''
    return new Date((statistic === 'min' ? Math.min : Math.max)(...dates.map(d => d.getTime()))).toISOString()
  }
  const values = raw.map(numericValue).filter((v): v is number => v !== null)
  if (!values.length) return 0
  if (statistic === 'sum') return values.reduce((a, b) => a + b, 0)
  if (statistic === 'mean') return values.reduce((a, b) => a + b, 0) / values.length
  if (statistic === 'min') return Math.min(...values)
  if (statistic === 'max') return Math.max(...values)
  const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function aggregate(records: any[], dateField: string, period: Period, weekMode: WeekMode, outbreakStart?: string, convention: DateConvention = 'dmy', statistic: Statistic = 'count', valueField?: string, valueType: 'number' | 'date' | 'text' = 'number', metricMode: 'aggregate' | 'rate' = 'aggregate', numeratorField?: string, denominatorField?: string, rateFactor = 100): { rows: AggregateRow[], invalid: number } {
  const outbreak = parseEpiDate(outbreakStart, convention); const groups = new Map<string, AggregateRow>(); let invalid = 0
  records.forEach(record => {
    const attrs = record?.getData ? record.getData() : (record?.attributes || record); const date = parseEpiDate(attrs?.[dateField], convention)
    if (!date) { invalid++; return }
    const p = periodFor(date, period, weekMode, outbreak || undefined); const existing = groups.get(p.key)
    if (existing) { existing.count++; existing.records.push(record) } else groups.set(p.key, { ...p, count: 1, value: 0, records: [record] })
  })
  const rows = Array.from(groups.values()).sort((a, b) => a.start.getTime() - b.start.getTime())
  rows.forEach(row => { row.value = calculate(row.records, valueField, statistic, valueType, metricMode, numeratorField, denominatorField, rateFactor) })
  return { rows, invalid }
}
