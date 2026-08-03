import { ImmutableObject } from 'jimu-core'

export type Period = 'epi-week' | 'month' | 'quarter' | 'year'
export type WeekMode = 'iso' | 'outbreak'

export interface Config {
  dataSource?: any
  dateField?: string
  period: Period
  weekMode: WeekMode
  outbreakStart?: string
  locale: string
  emitField: boolean
}

export type IMConfig = ImmutableObject<Config>
