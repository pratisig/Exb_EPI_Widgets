import { React, AllWidgetSettingProps, AllDataSourceTypes, DataSourceManager, Immutable, UseDataSource } from 'jimu-core'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { TextInput, Label, Select, Option } from 'jimu-ui'
import { IMConfig, SourceConfig, Statistic } from '../config'
import './style.css'

const defaultSource: SourceConfig = { dateField: '', valueField: '', valueType: 'number', statistic: 'count', period: 'epi-week', weekMode: 'iso', dateConvention: 'dmy', outbreakStart: '', filterMode: 'cumulative' }
const statistics: Array<[Statistic, string]> = [['count', 'Compter les enregistrements'], ['sum', 'Somme'], ['mean', 'Moyenne'], ['median', 'Médiane'], ['min', 'Minimum'], ['max', 'Maximum'], ['first', 'Première valeur'], ['last', 'Dernière valeur'], ['distinct', 'Valeurs distinctes']]

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const config: any = props.config || Immutable({ locale: 'fr', sources: {} })
  const selectedSources: any[] = props.useDataSources ? (props.useDataSources.toArray ? props.useDataSources.toArray() : props.useDataSources).map((item: any) => item?.toJS ? item.toJS() : item) : []
  const [schemas, setSchemas] = React.useState<{ [id: string]: any }>({})
  React.useEffect(() => {
    let active = true
    selectedSources.forEach(source => {
      const ds: any = DataSourceManager.getInstance().getDataSource(source.dataSourceId)
      if (!ds?.getSchema) return
      Promise.resolve(ds.getSchema()).then(schema => { if (active && schema) setSchemas(previous => ({ ...previous, [source.dataSourceId]: schema })) }).catch(() => {})
    })
    return () => { active = false }
  }, [selectedSources.map(s => s.dataSourceId).join('|')])
  const update = (key: string, value: any) => props.onSettingChange({ id: props.id, config: config.set(key, value) })
  const getSourceConfig = (id: string): SourceConfig => { const value = config.getIn?.(['sources', id]); return value?.toJS ? value.toJS() : (value || defaultSource) }
  const updateSource = (id: string, key: string, value: any) => { let next = config.setIn(['sources', id, key], value); if (key === 'statistic' && value === 'count') next = next.setIn(['sources', id, 'valueField'], '').setIn(['sources', id, 'valueType'], undefined); props.onSettingChange({ id: props.id, config: next }) }
  const updateField = (source: any, key: 'dateField' | 'valueField', field: string, valueType?: 'number' | 'date' | 'text') => {
    const oldFields = source.fields || []
    const sourceFields = Array.from(new Set([...(oldFields || []), field].filter(Boolean)))
    let nextConfig = config.setIn(['sources', source.dataSourceId, key], field)
    if (key === 'valueField' && valueType) nextConfig = nextConfig.setIn(['sources', source.dataSourceId, 'valueType'], valueType)
    const next = selectedSources.map(item => item.dataSourceId === source.dataSourceId ? { ...item, fields: sourceFields } : item)
    props.onSettingChange({ id: props.id, config: nextConfig, useDataSources: next })
  }
  const onSourcesChange = (sources: UseDataSource[]) => props.onSettingChange({ id: props.id, useDataSources: sources })
  return <div className="epi-setting p-3">
    <Label>Couleur principale</Label><input className="epi-color" type="color" value={config.get?.('accentColor') || '#1261a0'} onChange={e => update('accentColor', e.target.value)} />
    <Label>Sources line-list (plusieurs possibles)</Label>
    <DataSourceSelector types={Immutable([AllDataSourceTypes.FeatureLayer])} isMultiple={true} mustUseDataSource={true} useDataSources={props.useDataSources} useDataSourcesEnabled={props.useDataSourcesEnabled} onToggleUseDataEnabled={enabled => props.onSettingChange({ id: props.id, useDataSourcesEnabled: enabled })} onChange={onSourcesChange} widgetId={props.id} />
    {selectedSources.length === 0 && <div className="epi-setting-help">Ajoutez une ou plusieurs couches ou tables Feature Layer pour afficher leur configuration.</div>}
    {selectedSources.map((source, index) => {
      const id = source.dataSourceId; const c = getSourceConfig(id); const schema = schemas[id]; const rawFields: any = schema?.fields; const raw = rawFields?.toJS ? rawFields.toJS() : rawFields; const allFields = Array.isArray(raw) ? raw.map((field: any) => field?.toJS ? field.toJS() : field) : (raw ? Object.keys(raw).map(key => { const item = raw[key]?.toJS ? raw[key].toJS() : (raw[key] || {}); return { name: item.name || key, ...item } }) : []); const fieldType = (field: any) => String(field?.type || '').toLowerCase(); const isDate = (field: any) => fieldType(field).includes('date'); const numericTypes = ['smallinteger', 'integer', 'biginteger', 'single', 'double', 'oid', 'float', 'number']; const isNumeric = (field: any) => numericTypes.some(type => fieldType(field).includes(type)); const dateFields = allFields.filter(isDate); const numericFields = allFields.filter(isNumeric); const textFields = allFields.filter(field => !isNumeric(field) && !isDate(field)); const measureFields = c.statistic === 'distinct' ? allFields : (c.statistic === 'first' || c.statistic === 'last' ? textFields : (c.statistic === 'min' || c.statistic === 'max' ? [...numericFields, ...dateFields] : numericFields))
      return <div className="epi-source-setting" key={id}><h4>Source {index + 1}</h4><TextInput value={c.label || ''} placeholder="Nom court de la source (optionnel)" onChange={e => updateSource(id, 'label', e.target.value)} />
        <Label>Champ date détecté</Label><Select value={c.dateField || ''} onChange={e => updateField(source, 'dateField', e.target.value)}><Option value="">{!schema ? 'Chargement du schéma...' : (dateFields.length ? 'Sélectionner un champ date' : 'Aucun champ Date détecté')}</Option>{dateFields.map(field => <Option key={field.name} value={field.name}>{field.alias || field.name}</Option>)}</Select>
        <Label>Statistique</Label><Select value={c.statistic || 'count'} onChange={e => updateSource(id, 'statistic', e.target.value)}>{statistics.map(s => <Option value={s[0]} key={s[0]}>{s[1]}</Option>)}</Select>
        {c.statistic !== 'count' && <><Label>{c.statistic === 'first' || c.statistic === 'last' ? 'Champ texte' : (c.statistic === 'min' || c.statistic === 'max' ? 'Champ numérique ou date' : 'Champ numérique')}</Label><Select value={c.valueField || ''} onChange={e => { const field = measureFields.find(item => item.name === e.target.value); const valueType = isDate(field) ? 'date' : (isNumeric(field) ? 'number' : 'text'); updateField(source, 'valueField', e.target.value, valueType) }}><Option value="">{!schema ? 'Chargement du schéma...' : (measureFields.length ? 'Sélectionner un champ' : 'Aucun champ compatible détecté')}</Option>{measureFields.map(field => <Option key={field.name} value={field.name}>{field.alias || field.name} ({String(field.type || 'text').replace('esriFieldType', '')})</Option>)}</Select></>}
        <Label>Agrégation</Label><Select value={c.period || 'epi-week'} onChange={e => updateSource(id, 'period', e.target.value)}><Option value="epi-week">Semaine épidémiologique</Option><Option value="month">Mois</Option><Option value="quarter">Trimestre</Option><Option value="year">Année</Option></Select>
        {c.period === 'epi-week' && <><Label>Base des semaines</Label><Select value={c.weekMode || 'iso'} onChange={e => updateSource(id, 'weekMode', e.target.value)}><Option value="iso">Semaine ISO</Option><Option value="outbreak">Depuis le début de l'épidémie</Option></Select></>}
        {c.period === 'epi-week' && c.weekMode === 'outbreak' && <><Label>Début de l'épidémie</Label><TextInput type="date" value={c.outbreakStart || ''} onChange={e => updateSource(id, 'outbreakStart', e.target.value)} /></>}
        <Label>Convention des dates</Label><Select value={c.dateConvention || 'dmy'} onChange={e => updateSource(id, 'dateConvention', e.target.value)}><Option value="dmy">Jour / mois / année</Option><Option value="mdy">Mois / jour / année</Option><Option value="auto">Automatique</Option></Select>
        <Label>Mode d'affichage sur la page</Label><Select value={c.filterMode || 'cumulative'} onChange={e => updateSource(id, 'filterMode', e.target.value)}><Option value="cumulative">Progressif / cumulatif jusqu'à la période</Option><Option value="single">Une seule période</Option><Option value="none">Toutes les données (sans filtre)</Option></Select>
      </div>
    })}
  </div>
}
