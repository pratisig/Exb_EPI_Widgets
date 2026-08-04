import { ImmutableObject } from 'jimu-core'

export type Period = 'epi-week' | 'month' | 'quarter' | 'year'
export type WeekMode = 'iso' | 'outbreak'
export type DateConvention = 'dmy' | 'mdy' | 'auto'
export type Statistic = 'count' | 'sum' | 'mean' | 'median' | 'min' | 'max' | 'first' | 'last' | 'distinct'

export interface SourceConfig {
  dateField?: string
  valueField?: string
  valueType?: 'number' | 'date' | 'text'
  statistic: Statistic
  period: Period
  weekMode: WeekMode
  outbreakStart?: string
  dateConvention: DateConvention
  label?: string
  filterMode: 'single' | 'cumulative' | 'none'
}

export interface Config {
  period: Period
  weekMode: WeekMode
  dateConvention: DateConvention
  statistic: Statistic
  dateField?: string
  valueField?: string
  outbreakStart?: string
  locale: string
  sources?: { [dataSourceId: string]: SourceConfig }
}

export type IMConfig = ImmutableObject<Config>
