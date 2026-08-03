import { React, AllWidgetProps, DataSourceComponent, DataSource } from 'jimu-core'
import { Button, Label, Select, Option, TextInput, Alert } from 'jimu-ui'
import { IMConfig, Period, WeekMode, DateConvention } from '../config'
import { aggregate, AggregateRow } from './aggregation'
import './style.css'

const t = (fr: boolean, en: string, f: string) => fr ? f : en

interface ViewProps { ds: DataSource; props: AllWidgetProps<IMConfig>; fr: boolean; field: string; period: Period; weekMode: WeekMode; outbreak: string; convention: DateConvention; setField: (v: string) => void; setPeriod: (v: Period) => void; setWeekMode: (v: WeekMode) => void; setOutbreak: (v: string) => void; setConvention: (v: DateConvention) => void }

function EpiView({ ds, props, fr, field, period, weekMode, outbreak, convention, setField, setPeriod, setWeekMode, setOutbreak, setConvention }: ViewProps) {
  const [rows, setRows] = React.useState<AggregateRow[]>([])
  const [invalid, setInvalid] = React.useState(0)
  const [selected, setSelected] = React.useState('')
  const [playing, setPlaying] = React.useState(false)
  const [speed, setSpeed] = React.useState(1200)
  const [cumulative, setCumulative] = React.useState(false)
  const timer = React.useRef<any>(null)

  React.useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])
  React.useEffect(() => {
    if (!playing || !rows.length) return
    timer.current = setInterval(() => setSelected(current => {
      const i = rows.findIndex(r => r.key === current)
      return rows[(i + 1) % rows.length].key
    }), speed)
    return () => clearInterval(timer.current)
  }, [playing, rows, speed])
  React.useEffect(() => {
    let cancelled = false
    if (!field) { setRows([]); setInvalid(0); setSelected(''); return () => { cancelled = true } }
    ds.query({ where: '1=1', outFields: ['*'], returnGeometry: false, pageSize: 10000 } as any).then((result: any) => {
      if (cancelled) return
      const output = aggregate(result.records || [], field, period, weekMode, outbreak, convention)
      setRows(output.rows); setInvalid(output.invalid); setSelected(output.rows[0]?.key || '')
    }).catch(() => { if (!cancelled) { setRows([]); setInvalid(0); setSelected('') } })
    return () => { cancelled = true }
  }, [ds, field, period, weekMode, outbreak, convention])
  React.useEffect(() => {
    const row = rows.find(r => r.key === selected)
    if (!row) return
    const fieldName = field.replace(/[^A-Za-z0-9_]/g, '')
    const iso = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ')
    ds.updateQueryParams({ where: `${fieldName} >= DATE '${iso(row.start)}' AND ${fieldName} < DATE '${iso(row.end)}'` } as any, props.id)
  }, [selected, rows, field, ds, props.id])

  const records = rows.reduce((n, r) => n + r.count, 0)
  return <div className="epi-widget">
    <div className="epi-heading"><div><h2>Epi Aggregator</h2><span>{t(fr, 'Line-list time filter', 'Filtre temporel de line-list')}</span></div><span className="epi-badge">{records}</span></div>
    <div className="epi-controls">
      <Label>{t(fr, 'Date field', 'Champ date')}</Label><TextInput value={field} placeholder={t(fr, 'e.g. onset_date', 'ex. onset_date')} onChange={e => setField(e.target.value)} />
      <Label>{t(fr, 'Date convention', 'Convention de date')}</Label><Select value={convention} onChange={e => setConvention(e.target.value as DateConvention)}><Option value="dmy">{t(fr, 'Day / month / year', 'Jour / mois / année')}</Option><Option value="mdy">{t(fr, 'Month / day / year', 'Mois / jour / année')}</Option><Option value="auto">{t(fr, 'Automatic (use ISO where possible)', 'Automatique (ISO prioritaire)')}</Option></Select>
      <Label>{t(fr, 'Aggregation', 'Agrégation')}</Label><Select value={period} onChange={e => setPeriod(e.target.value as Period)}><Option value="epi-week">{t(fr, 'Epidemiological week', 'Semaine épidémiologique')}</Option><Option value="month">{t(fr, 'Month', 'Mois')}</Option><Option value="quarter">{t(fr, 'Quarter', 'Trimestre')}</Option><Option value="year">{t(fr, 'Year', 'Année')}</Option></Select>
      {period === 'epi-week' && <><Label>{t(fr, 'Week basis', 'Base des semaines')}</Label><Select value={weekMode} onChange={e => setWeekMode(e.target.value as WeekMode)}><Option value="iso">{t(fr, 'Calendar ISO week (S1–S53)', 'Semaine ISO (S1–S53)')}</Option><Option value="outbreak">{t(fr, 'Since outbreak start (EPI W1)', "Depuis le début de l'épidémie (EPI W1)")}</Option></Select></>}
      {period === 'epi-week' && weekMode === 'outbreak' && <><Label>{t(fr, 'Outbreak start', "Début de l'épidémie")}</Label><TextInput type="date" value={outbreak} onChange={e => setOutbreak(e.target.value)} /></>}
    </div>
    {!field && <Alert className="epi-alert" type="info">{t(fr, 'Choose a date field in settings or enter it above.', 'Choisissez un champ date dans les paramètres ou saisissez-le ci-dessus.')}</Alert>}
    {field && !rows.length && <div className="epi-empty">{t(fr, 'No valid dates found.', 'Aucune date valide trouvée.')}</div>}
    {invalid > 0 && <div className="epi-warning">{invalid} {t(fr, 'record(s) ignored: unrecognised date', 'enregistrement(s) ignoré(s) : date non reconnue')}</div>}
    {rows.length > 0 && <div className="epi-summary"><span><b>{records.toLocaleString(fr ? 'fr-FR' : 'en-US')}</b><small>{t(fr, 'valid records', 'cas valides')}</small></span><span><b>{rows.reduce((m, r) => Math.max(m, r.count), 0).toLocaleString(fr ? 'fr-FR' : 'en-US')}</b><small>{t(fr, 'peak in a period', 'pic sur une période')}</small></span><span><b>{rows.length}</b><small>{t(fr, 'periods', 'périodes')}</small></span></div>}
    <div className="epi-toolbar"><Button size="sm" onClick={() => setPlaying(!playing)} disabled={!rows.length}>{playing ? '■' : '▶'} {playing ? t(fr, 'Stop', 'Arrêter') : t(fr, 'Play', 'Lire')}</Button><Select value={String(speed)} onChange={e => setSpeed(Number(e.target.value))}><Option value="2000">{t(fr, 'Slow', 'Lent')}</Option><Option value="1200">{t(fr, 'Normal', 'Normal')}</Option><Option value="600">{t(fr, 'Fast', 'Rapide')}</Option></Select><label className="epi-check"><input type="checkbox" checked={cumulative} onChange={e => setCumulative(e.target.checked)} /> {t(fr, 'Cumulative', 'Cumulé')}</label></div>
    <div className="epi-periods">{rows.map((r, i) => <button className={selected === r.key ? 'selected' : ''} key={r.key} onClick={() => { setSelected(r.key); setPlaying(false) }}><strong>{r.label}</strong><span>{(cumulative ? rows.slice(0, i + 1).reduce((n, x) => n + x.count, 0) : r.count).toLocaleString(fr ? 'fr-FR' : 'en-US')}</span></button>)}</div>
    <div className="epi-foot">{selected ? `${t(fr, 'Active filter', 'Filtre actif')} : ${rows.find(r => r.key === selected)?.label}` : t(fr, 'No period selected', 'Aucune période sélectionnée')} {selected && <Button size="sm" onClick={() => { ds.updateQueryParams({ where: '1=1' } as any, props.id); setSelected('') }}>{t(fr, 'Clear filter', 'Réinitialiser')}</Button>}</div>
  </div>
}

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const cfg = props.config
  const fr = (cfg.locale || 'fr').toLowerCase().startsWith('fr')
  const [field, setField] = React.useState(cfg.dateField || '')
  const [period, setPeriod] = React.useState<Period>(cfg.period || 'epi-week')
  const [weekMode, setWeekMode] = React.useState<WeekMode>(cfg.weekMode || 'iso')
  const [outbreak, setOutbreak] = React.useState(cfg.outbreakStart || '')
  const [convention, setConvention] = React.useState<DateConvention>(cfg.dateConvention || 'dmy')
  React.useEffect(() => { setField(cfg.dateField || '') }, [cfg.dateField])
  React.useEffect(() => { setPeriod(cfg.period || 'epi-week') }, [cfg.period])
  const useDS: any = props.useDataSources?.[0]
  if (!useDS) return <div className="epi-widget epi-empty">{t(fr, 'Configure a line-list data source.', 'Configurez une source de données line-list.')}</div>
  return <DataSourceComponent useDataSource={useDS} widgetId={props.id}>{(ds: DataSource) => <EpiView ds={ds} props={props} fr={fr} field={field} period={period} weekMode={weekMode} outbreak={outbreak} convention={convention} setField={setField} setPeriod={setPeriod} setWeekMode={setWeekMode} setOutbreak={setOutbreak} setConvention={setConvention} />}</DataSourceComponent>
}
