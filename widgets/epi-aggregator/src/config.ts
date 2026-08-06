import { ImmutableObject } from 'jimu-core'

export type Period = 'epi-week' | 'month' | 'quarter' | 'year'
export type WeekMode = 'iso' | 'outbreak'
export type DateConvention = 'dmy' | 'mdy' | 'auto'
export type Statistic = 'count' | 'sum' | 'mean' | 'median' | 'min' | 'max' | 'first' | 'last' | 'distinct'

export interface SourceConfig {
  dateField?: string
  boundaryField?: string
  valueField?: string
  valueType?: 'number' | 'date' | 'text'
  statistic: Statistic
  period: Period
  weekMode: WeekMode
  outbreakStart?: string
  dateConvention: DateConvention
  label?: string
  filterMode: 'single' | 'cumulative' | 'none'
  scaleMode?: 'dynamic' | 'fixed'
  fillMissingPeriods?: boolean
  decimalPlaces?: number
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
  accentColor?: string
  timelineColor?: string
  timelineSize?: 'small' | 'medium' | 'large'
  showDetails?: boolean
  boundarySourceId?: string
  sources?: { [dataSourceId: string]: SourceConfig }
}

export type IMConfig = ImmutableObject<Config>
