import { React, AllWidgetProps, DataSourceComponent, DataSource } from 'jimu-core'
import { Button, Label, Select, Option, TextInput, Alert } from 'jimu-ui'
import { IMConfig, SourceConfig, Statistic } from '../config'
import { aggregate, AggregateRow } from './aggregation'
import './style.css'

const fallback: SourceConfig = { dateField: '', valueField: '', statistic: 'count', period: 'epi-week', weekMode: 'iso', dateConvention: 'dmy', outbreakStart: '' }
const t = (fr: boolean, en: string, f: string) => fr ? f : en
const format = (n: number, fr: boolean) => Number.isInteger(n) ? n.toLocaleString(fr ? 'fr-FR' : 'en-US') : n.toLocaleString(fr ? 'fr-FR' : 'en-US', { maximumFractionDigits: 2 })

interface SourceViewProps { ds: DataSource; sourceId: string; source: SourceConfig; props: AllWidgetProps<IMConfig>; fr: boolean }
function SourceView({ ds, sourceId, source, props, fr }: SourceViewProps) {
  const c = { ...fallback, ...(source || {}) }; const field = c.dateField || ''
  const [rows, setRows] = React.useState<AggregateRow[]>([]); const [invalid, setInvalid] = React.useState(0); const [selected, setSelected] = React.useState(''); const [playing, setPlaying] = React.useState(false); const [speed, setSpeed] = React.useState(1200); const [cumulative, setCumulative] = React.useState(false); const timer = React.useRef<any>(null)
  React.useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])
  React.useEffect(() => { if (!playing || !rows.length) return; timer.current = setInterval(() => setSelected(current => { const i = rows.findIndex(r => r.key === current); return rows[(i + 1) % rows.length].key }), speed); return () => clearInterval(timer.current) }, [playing, rows, speed])
  React.useEffect(() => {
    let cancelled = false
    if (!field) { setRows([]); setSelected(''); return () => { cancelled = true } }
    ds.query({ where: '1=1', outFields: ['*'], returnGeometry: false, pageSize: 10000 } as any).then((result: any) => { if (cancelled) return; const output = aggregate(result.records || [], field, c.period, c.weekMode, c.outbreakStart, c.dateConvention, c.statistic, c.valueField); setRows(output.rows); setInvalid(output.invalid); setSelected(output.rows[0]?.key || '') }).catch(() => { if (!cancelled) { setRows([]); setInvalid(0); setSelected('') } })
    return () => { cancelled = true }
  }, [ds, field, c.period, c.weekMode, c.outbreakStart, c.dateConvention, c.statistic, c.valueField])
  React.useEffect(() => { const row = rows.find(r => r.key === selected); if (!row || !field) return; const safeField = field.replace(/[^A-Za-z0-9_]/g, ''); const iso = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' '); ds.updateQueryParams({ where: `${safeField} >= DATE '${iso(row.start)}' AND ${safeField} < DATE '${iso(row.end)}'` } as any, `${props.id}-${sourceId}`) }, [selected, rows, field, ds, props.id, sourceId])
  const total = rows.reduce((n, r) => n + r.value, 0); const count = rows.reduce((n, r) => n + r.count, 0); const label = c.label || sourceId
  return <section className="epi-source"><div className="epi-heading"><div><h3>{label}</h3><span>{c.statistic === 'count' ? t(fr, 'Cases by period', 'Cas par période') : `${c.statistic} — ${c.valueField || t(fr, 'measure not selected', 'mesure non sélectionnée')}`}</span></div><span className="epi-badge">{format(c.statistic === 'count' ? count : total, fr)}</span></div>
    {!field && <Alert type="info">{t(fr, 'Choose a date field in the Content settings.', 'Choisissez un champ date dans le panneau Contenu.')}</Alert>}{field && !rows.length && <div className="epi-empty">{t(fr, 'No valid dates found.', 'Aucune date valide trouvée.')}</div>}{invalid > 0 && <div className="epi-warning">{invalid} {t(fr, 'record(s) ignored: unrecognised date', 'enregistrement(s) ignoré(s) : date non reconnue')}</div>}
    {rows.length > 0 && <div className="epi-summary"><span><b>{format(count, fr)}</b><small>{t(fr, 'valid records', 'cas valides')}</small></span><span><b>{format(Math.max(...rows.map(r => r.value)), fr)}</b><small>{t(fr, 'period peak', 'pic')}</small></span><span><b>{rows.length}</b><small>{t(fr, 'periods', 'périodes')}</small></span></div>}
    <div className="epi-toolbar"><Button size="sm" onClick={() => setPlaying(!playing)} disabled={!rows.length}>{playing ? '■' : '▶'} {playing ? t(fr, 'Stop', 'Arrêter') : t(fr, 'Play', 'Lire')}</Button><Select value={String(speed)} onChange={e => setSpeed(Number(e.target.value))}><Option value="2000">{t(fr, 'Slow', 'Lent')}</Option><Option value="1200">Normal</Option><Option value="600">{t(fr, 'Fast', 'Rapide')}</Option></Select><label className="epi-check"><input type="checkbox" checked={cumulative} onChange={e => setCumulative(e.target.checked)} /> {t(fr, 'Cumulative', 'Cumulé')}</label></div>
    <div className="epi-periods">{rows.map((r, i) => <button className={selected === r.key ? 'selected' : ''} key={r.key} onClick={() => { setSelected(r.key); setPlaying(false) }}><strong>{r.label}</strong><span>{format(cumulative ? rows.slice(0, i + 1).reduce((n, x) => n + x.value, 0) : r.value, fr)}</span></button>)}</div>
    <div className="epi-foot">{selected ? `${t(fr, 'Active filter', 'Filtre actif')} : ${rows.find(r => r.key === selected)?.label}` : t(fr, 'No period selected', 'Aucune période sélectionnée')} {selected && <Button size="sm" onClick={() => { ds.updateQueryParams({ where: '1=1' } as any, `${props.id}-${sourceId}`); setSelected('') }}>{t(fr, 'Clear filter', 'Réinitialiser')}</Button>}</div>
  </section>
}

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const config: any = props.config || {}; const fr = (config.locale || 'fr').toLowerCase().startsWith('fr'); const selected: any[] = props.useDataSources ? (props.useDataSources.toArray ? props.useDataSources.toArray() : props.useDataSources) : []
  if (!selected.length) return <div className="epi-widget epi-empty">{t(fr, 'Configure one or more line-list sources in the Content settings.', 'Configurez une ou plusieurs sources line-list dans le panneau Contenu.')}</div>
  return <div className="epi-widget">{selected.map(use => { const id = use.dataSourceId; const source = config.sources?.[id] || { ...fallback, dateField: config.dateField, valueField: config.valueField, statistic: config.statistic, period: config.period, weekMode: config.weekMode, dateConvention: config.dateConvention, outbreakStart: config.outbreakStart }; return <DataSourceComponent key={id} useDataSource={use} widgetId={props.id}>{(ds: DataSource) => <SourceView ds={ds} sourceId={id} source={source} props={props} fr={fr} />}</DataSourceComponent> })}</div>
}
