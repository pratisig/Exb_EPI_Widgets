import { React, AllWidgetProps, DataSourceComponent, DataSource } from 'jimu-core'
import { Button, Label, Select, Option, TextInput, Alert } from 'jimu-ui'
import { IMConfig, Period, WeekMode } from '../config'
import { aggregate, AggregateRow } from './aggregation'
import './style.css'
const t = (fr: boolean, en: string, f: string) => fr ? f : en
export default function Widget(props: AllWidgetProps<IMConfig>) {
  const cfg = props.config; const fr = (cfg.locale || 'fr').toLowerCase().startsWith('fr')
  const [field, setField] = React.useState(cfg.dateField || '')
  const [period, setPeriod] = React.useState<Period>(cfg.period || 'epi-week')
  const [weekMode, setWeekMode] = React.useState<WeekMode>(cfg.weekMode || 'iso')
  const [outbreak, setOutbreak] = React.useState(cfg.outbreakStart || '')
  const [rows, setRows] = React.useState<AggregateRow[]>([]); const [invalid, setInvalid] = React.useState(0)
  const [selected, setSelected] = React.useState(''); const [playing, setPlaying] = React.useState(false); const timer = React.useRef<any>(null)
  React.useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])
  React.useEffect(() => { if (!playing || !rows.length) return; timer.current = setInterval(() => setSelected(current => { const i = rows.findIndex(r => r.key === current); return rows[(i + 1) % rows.length].key }), 1200); return () => clearInterval(timer.current) }, [playing, rows])
  const onDataSource = async (ds: DataSource) => { if (!field) return; try { const result: any = await ds.query({ where: '1=1', outFields: ['*'], returnGeometry: false, pageSize: 10000 } as any); const output = aggregate(result.records || [], field, period, weekMode, outbreak); setRows(output.rows); setInvalid(output.invalid); setSelected(output.rows[0]?.key || '') } catch (e) { setRows([]) } }
  const applyFilter = (ds: DataSource, key: string) => { const row = rows.find(r => r.key === key); if (!row) return; const fieldName = field.replace(/[^A-Za-z0-9_]/g, ''); const iso = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' '); ds.updateQueryParams({ where: `${fieldName} >= DATE '${iso(row.start)}' AND ${fieldName} < DATE '${iso(row.end)}'` } as any, props.id) }
  const content = (ds: DataSource) => { React.useEffect(() => { onDataSource(ds) }, [ds, field, period, weekMode, outbreak]); React.useEffect(() => { if (selected) applyFilter(ds, selected) }, [selected])
    const records = rows.reduce((n, r) => n + r.count, 0)
    return <div className="epi-widget"><div className="epi-heading"><div><h2>Epi Aggregator</h2><span>{t(fr, 'Line-list time filter', 'Filtre temporel de line-list')}</span></div><span className="epi-badge">{records}</span></div>
      <div className="epi-controls"><Label>{t(fr, 'Date field', 'Champ date')}</Label><TextInput value={field} placeholder={t(fr, 'e.g. onset_date', 'ex. onset_date')} onChange={e => setField(e.target.value)} /><Label>{t(fr, 'Aggregation', 'Agrégation')}</Label><Select value={period} onChange={e => { setPeriod(e.target.value as Period); setPlaying(false) }}><Option value="epi-week">{t(fr, 'Epidemiological week', 'Semaine épidémiologique')}</Option><Option value="month">{t(fr, 'Month', 'Mois')}</Option><Option value="quarter">{t(fr, 'Quarter', 'Trimestre')}</Option><Option value="year">{t(fr, 'Year', 'Année')}</Option></Select>
        {period === 'epi-week' && <><Label>{t(fr, 'Week basis', 'Base des semaines')}</Label><Select value={weekMode} onChange={e => setWeekMode(e.target.value as WeekMode)}><Option value="iso">{t(fr, 'Calendar ISO week (S1–S53)', 'Semaine ISO (S1–S53)')}</Option><Option value="outbreak">{t(fr, 'Since outbreak start (EPI W1)', "Depuis le début de l'épidémie (EPI W1)")}</Option></Select></>}{period === 'epi-week' && weekMode === 'outbreak' && <><Label>{t(fr, 'Outbreak start', "Début de l'épidémie")}</Label><TextInput type="date" value={outbreak} onChange={e => setOutbreak(e.target.value)} /></>}</div>
      {!field && <Alert className="epi-alert" type="info">{t(fr, 'Choose a date field in settings or enter it above.', 'Choisissez un champ date dans les paramètres ou saisissez-le ci-dessus.')}</Alert>}{field && !rows.length && <div className="epi-empty">{t(fr, 'No valid dates found.', 'Aucune date valide trouvée.')}</div>}{invalid > 0 && <div className="epi-warning">{invalid} {t(fr, 'record(s) ignored: unrecognised date', 'enregistrement(s) ignoré(s) : date non reconnue')}</div>}
      <div className="epi-toolbar"><Button size="sm" onClick={() => setPlaying(!playing)} disabled={!rows.length}>{playing ? '■' : '▶'} {playing ? t(fr, 'Stop', 'Arrêter') : t(fr, 'Play', 'Lire')}</Button><span>{t(fr, 'Select a period to filter connected widgets', 'Sélectionnez une période pour filtrer les widgets connectés')}</span></div><div className="epi-periods">{rows.map(r => <button className={selected === r.key ? 'selected' : ''} key={r.key} onClick={() => { setSelected(r.key); setPlaying(false) }}><strong>{r.label}</strong><span>{r.count.toLocaleString(fr ? 'fr-FR' : 'en-US')}</span></button>)}</div><div className="epi-foot">{selected ? `${t(fr, 'Active filter', 'Filtre actif')} : ${rows.find(r => r.key === selected)?.label}` : t(fr, 'No period selected', 'Aucune période sélectionnée')}</div></div> }
  const useDS: any = props.useDataSources?.[0]; if (!useDS) return <div className="epi-widget epi-empty">{t(fr, 'Configure a line-list data source.', 'Configurez une source de données line-list.')}</div>
  return <DataSourceComponent useDataSource={useDS} widgetId={props.id}>{content}</DataSourceComponent>
}
