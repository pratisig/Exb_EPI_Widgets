import { DateConvention, Period, Statistic, WeekMode } from '../config'
import { aggregate, AggregateRow } from './aggregation'

export interface BoundaryAggregateRow extends AggregateRow { boundary: string }

/** Aggregates a line-list by period and a boundary/category field. The geometry join is
 * deliberately kept outside this pure function so it can be used with a separate boundary layer. */
export function aggregateByBoundary(records: any[], dateField: string, boundaryField: string, period: Period, weekMode: WeekMode, statistic: Statistic, valueField?: string, valueType: 'number' | 'date' | 'text' = 'number', outbreakStart?: string, convention: DateConvention = 'dmy'): BoundaryAggregateRow[] {
  const groups = new Map<string, any[]>()
  records.forEach(record => { const attrs = record?.getData ? record.getData() : (record?.attributes || record); const key = attrs?.[boundaryField]; if (key !== null && key !== undefined && key !== '') { const name = String(key); groups.set(name, [...(groups.get(name) || []), record]) } })
  const output: BoundaryAggregateRow[] = []
  groups.forEach((groupRecords, boundary) => aggregate(groupRecords, dateField, period, weekMode, outbreakStart, convention, statistic, valueField, valueType, false).rows.forEach(row => output.push({ ...row, boundary })))
  return output.sort((a, b) => a.start.getTime() - b.start.getTime() || a.boundary.localeCompare(b.boundary))
}
