/** Date and period utilities deliberately have no Experience Builder dependency.
 * They are also useful in tests and in future data-source adapters. */
import { Period, WeekMode } from '../config'

export interface PeriodValue { key: string; label: string; start: Date; end: Date }

const pad = (n: number) => String(n).padStart(2, '0')
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d))

/** Handles ISO strings, US/EU dates, timestamps and Excel serial dates. */
export function parseEpiDate(value: unknown): Date | null {
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
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text) && !isNaN(native.getTime())) return native
  let m = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:\s+(\d{1,2}):?(\d{2})?)?$/)
  if (m) {
    // Ambiguous slash dates are interpreted as day/month, the convention used by most field teams.
    let day = +m[1]; let month = +m[2] - 1
    // If the second component cannot be a month, accept the US month/day form.
    if (day <= 12 && +m[2] > 12) { day = +m[2]; month = +m[1] - 1 }
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

export interface AggregateRow extends PeriodValue { count: number; records: any[] }
export function aggregate(records: any[], dateField: string, period: Period, weekMode: WeekMode, outbreakStart?: string): { rows: AggregateRow[], invalid: number } {
  const outbreak = parseEpiDate(outbreakStart)
  const groups = new Map<string, AggregateRow>(); let invalid = 0
  records.forEach(record => {
    const attrs = record?.getData ? record.getData() : (record?.attributes || record)
    const date = parseEpiDate(attrs?.[dateField])
    if (!date) { invalid++; return }
    const p = periodFor(date, period, weekMode, outbreak || undefined); const existing = groups.get(p.key)
    if (existing) { existing.count++; existing.records.push(record) } else groups.set(p.key, { ...p, count: 1, records: [record] })
  })
  return { rows: Array.from(groups.values()).sort((a, b) => a.start.getTime() - b.start.getTime()), invalid }
}
