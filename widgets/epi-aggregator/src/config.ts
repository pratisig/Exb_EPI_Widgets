import { ImmutableObject } from 'jimu-core'

export type Period = 'epi-week' | 'month' | 'quarter' | 'year'
export type WeekMode = 'iso' | 'outbreak'
export type DateConvention = 'dmy' | 'mdy' | 'auto'
export type Statistic = 'count' | 'sum' | 'mean' | 'median' | 'min' | 'max' | 'first' | 'last' | 'distinct'

export interface Config {
  dataSource?: any
  dateField?: string
  valueField?: string
  statistic: Statistic
  period: Period
  weekMode: WeekMode
  outbreakStart?: string
  locale: string
  dateConvention: DateConvention
  emitField: boolean
}

export type IMConfig = ImmutableObject<Config>
