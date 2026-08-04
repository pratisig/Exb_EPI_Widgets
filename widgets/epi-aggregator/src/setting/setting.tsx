import { React, AllWidgetSettingProps, AllDataSourceTypes, Immutable, UseDataSource } from 'jimu-core'
import { DataSourceSelector, FieldSelector } from 'jimu-ui/advanced/data-source-selector'
import { TextInput, Label, Select, Option } from 'jimu-ui'
import { IMConfig, SourceConfig, Statistic } from '../config'
import './style.css'

const defaultSource: SourceConfig = { dateField: '', valueField: '', statistic: 'count', period: 'epi-week', weekMode: 'iso', dateConvention: 'dmy', outbreakStart: '' }
const statistics: Array<[Statistic, string]> = [['count', 'Compter les enregistrements'], ['sum', 'Somme'], ['mean', 'Moyenne'], ['median', 'Médiane'], ['min', 'Minimum'], ['max', 'Maximum'], ['first', 'Première valeur'], ['last', 'Dernière valeur'], ['distinct', 'Valeurs distinctes']]

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const config: any = props.config || Immutable({ locale: 'fr', sources: {} })
  const selectedSources: any[] = props.useDataSources ? (props.useDataSources.toArray ? props.useDataSources.toArray() : props.useDataSources).map((item: any) => item?.toJS ? item.toJS() : item) : []
  const update = (key: string, value: any) => props.onSettingChange({ id: props.id, config: config.set(key, value) })
  const getSourceConfig = (id: string): SourceConfig => { const value = config.getIn?.(['sources', id]); return value?.toJS ? value.toJS() : (value || defaultSource) }
  const updateSource = (id: string, key: string, value: any) => props.onSettingChange({ id: props.id, config: config.setIn(['sources', id, key], value) })
  const updateField = (source: any, key: 'dateField' | 'valueField', fields: any[]) => {
    const field = fields?.[0]?.jimuName || ''
    const oldFields = source.fields || []
    const sourceFields = Array.from(new Set([...(oldFields || []), field].filter(Boolean)))
    const next = selectedSources.map(item => item.dataSourceId === source.dataSourceId ? { ...item, fields: sourceFields } : item)
    props.onSettingChange({ id: props.id, config: config.setIn(['sources', source.dataSourceId, key], field), useDataSources: next })
  }
  const onSourcesChange = (sources: UseDataSource[]) => props.onSettingChange({ id: props.id, useDataSources: sources })
  return <div className="epi-setting p-3">
    <Label>Sources line-list (plusieurs possibles)</Label>
    <DataSourceSelector types={Immutable([AllDataSourceTypes.FeatureLayer])} isMultiple={true} mustUseDataSource={true} useDataSources={props.useDataSources} useDataSourcesEnabled={props.useDataSourcesEnabled} onToggleUseDataEnabled={enabled => props.onSettingChange({ id: props.id, useDataSourcesEnabled: enabled })} onChange={onSourcesChange} widgetId={props.id} />
    {selectedSources.length === 0 && <div className="epi-setting-help">Ajoutez une ou plusieurs couches ou tables Feature Layer pour afficher leur configuration.</div>}
    {selectedSources.map((source, index) => {
      const id = source.dataSourceId; const c = getSourceConfig(id)
      return <div className="epi-source-setting" key={id}><h4>Source {index + 1}</h4><TextInput value={c.label || ''} placeholder="Nom court de la source (optionnel)" onChange={e => updateSource(id, 'label', e.target.value)} />
        <Label>Champ date</Label><FieldSelector useDataSources={Immutable([source])} selectedFields={Immutable(c.dateField ? [c.dateField] : [])} onChange={fields => updateField(source, 'dateField', fields)} isMultiple={false} />
        <Label>Statistique</Label><Select value={c.statistic || 'count'} onChange={e => updateSource(id, 'statistic', e.target.value)}>{statistics.map(s => <Option value={s[0]} key={s[0]}>{s[1]}</Option>)}</Select>
        {c.statistic !== 'count' && <><Label>Champ numérique / mesure</Label><FieldSelector useDataSources={Immutable([source])} selectedFields={Immutable(c.valueField ? [c.valueField] : [])} onChange={fields => updateField(source, 'valueField', fields)} isMultiple={false} /></>}
        <Label>Agrégation</Label><Select value={c.period || 'epi-week'} onChange={e => updateSource(id, 'period', e.target.value)}><Option value="epi-week">Semaine épidémiologique</Option><Option value="month">Mois</Option><Option value="quarter">Trimestre</Option><Option value="year">Année</Option></Select>
        {c.period === 'epi-week' && <><Label>Base des semaines</Label><Select value={c.weekMode || 'iso'} onChange={e => updateSource(id, 'weekMode', e.target.value)}><Option value="iso">Semaine ISO</Option><Option value="outbreak">Depuis le début de l'épidémie</Option></Select></>}
        {c.period === 'epi-week' && c.weekMode === 'outbreak' && <><Label>Début de l'épidémie</Label><TextInput type="date" value={c.outbreakStart || ''} onChange={e => updateSource(id, 'outbreakStart', e.target.value)} /></>}
        <Label>Convention des dates</Label><Select value={c.dateConvention || 'dmy'} onChange={e => updateSource(id, 'dateConvention', e.target.value)}><Option value="dmy">Jour / mois / année</Option><Option value="mdy">Mois / jour / année</Option><Option value="auto">Automatique</Option></Select>
      </div>
    })}
  </div>
}
