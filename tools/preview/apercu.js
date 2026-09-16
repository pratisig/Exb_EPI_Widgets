/* Aperçu hors Experience Builder — Epi Aggregator 2.0
 *
 * Rejoue le comportement de l'interface du widget (timeline, liste de périodes repliable,
 * cumulé/brut, indicateurs, export CSV, avertissements) avec le moteur réel du widget.
 * Ne remplace pas la campagne de test Experience Builder : voir GUIDE_TRANSFERT_TEST_GIS_CENTRE.md.
 */
(function () {
  'use strict'

  const E = window.EpiMoteur
  const $ = (id) => document.getElementById(id)
  const state = { records: [], rows: [], boundaryRows: [], comparisonRows: [], selected: '', cumulative: false, periodsOpen: true, playing: false, timer: null, speed: 1200 }

  const t = (en, fr) => fr
  const format = (n, decimals = 2) => {
    if (n === null || n === undefined || n === '') return '—'
    return Number.isInteger(n) ? n.toLocaleString('fr-FR') : Number(n).toLocaleString('fr-FR', { maximumFractionDigits: decimals })
  }
  const escapeHtml = (value) => String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

  // ------------------------------------------------------------------ données

  function parseCsv(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter((line) => line.trim() !== '')
    const headers = splitCsvLine(lines[0]).map((h) => h.trim())
    return lines.slice(1).map((line) => {
      const cells = splitCsvLine(line)
      const record = {}
      headers.forEach((header, index) => {
        const raw = (cells[index] ?? '').trim()
        record[header] = raw === '' ? '' : (/^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw)
      })
      return record
    })
  }

  function splitCsvLine(line) {
    const out = []
    let current = ''
    let quoted = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (quoted) {
        if (char === '"' && line[i + 1] === '"') { current += '"'; i += 1 } else if (char === '"') { quoted = false } else { current += char }
      } else if (char === '"') { quoted = true } else if (char === ',') { out.push(current); current = '' } else { current += char }
    }
    out.push(current)
    return out
  }

  function loadRecords(text) {
    state.records = parseCsv(text)
    state.selected = ''
    recompute()
  }

  // ------------------------------------------------------------------ calculs

  function currentConfig() {
    const [field, fieldType] = $('field').value.split('|')
    const statistic = $('statistic').value
    const valueField = statistic === 'sum' || statistic === 'mean' ? 'deaths' : (statistic === 'max' ? 'cases' : (statistic === 'distinct' ? 'status' : undefined))
    const valueType = statistic === 'distinct' ? 'text' : 'number'
    const filterMode = $('filterMode').value
    return {
      field, fieldType, statistic, valueField, valueType, filterMode,
      period: $('period').value, convention: $('convention').value, weekMode: $('weekMode').value,
      outbreakStart: $('outbreakStart').value, fill: $('fill').value === 'true',
      boundaryField: $('boundary').value || undefined,
      comparisonMode: $('comparison').value,
      filteringDisabled: filterMode === 'none' || fieldType === 'text',
    }
  }

  function recompute() {
    const c = currentConfig()
    const usable = state.records.filter((r) => r[c.field] !== '' && r[c.field] !== undefined)
    const result = E.aggregate(usable, c.field, c.period, c.weekMode, c.outbreakStart, c.convention, c.statistic, c.valueField, c.valueType, c.fill)
    state.rows = result.rows
    state.invalid = result.invalid + (state.records.length - usable.length)
    state.boundaryRows = c.boundaryField ? E.aggregateByBoundary(usable, c.field, c.boundaryField, c.period, c.weekMode, c.statistic, c.valueField, c.valueType, c.outbreakStart, c.convention) : []
    state.comparisonRows = c.comparisonMode === 'compare-years'
      ? E.compareYears(usable, c.field, c.period, [2023, 2024, 2025], c.weekMode, c.statistic, c.valueField, c.valueType, c.convention, c.outbreakStart, 2024)
      : []
    if (!state.rows.some((row) => row.key === state.selected)) state.selected = state.rows[0] ? state.rows[0].key : ''
    state.periodsOpen = state.rows.length <= 12
    render()
  }

  // ------------------------------------------------------------------ rendu

  function canCumulative(statistic) { return statistic === 'count' || ['sum', 'mean', 'median', 'min', 'max'].includes(statistic) }

  function render() {
    const c = currentConfig()
    const rows = state.rows
    const index = Math.max(0, rows.findIndex((row) => row.key === state.selected))
    const selectedRow = rows.find((row) => row.key === state.selected)
    const canCumul = canCumulative(c.statistic)
    const count = rows.reduce((total, row) => total + row.count, 0)
    const peakRow = rows.length ? rows.reduce((best, row) => (typeof row.value === 'number' && row.value > (typeof best.value === 'number' ? best.value : -Infinity) ? row : best), rows[0]) : undefined
    const periodValue = (row) => !canCumul ? '' : (state.cumulative ? format(rows.slice(0, rows.indexOf(row) + 1).reduce((total, item) => total + (typeof item.value === 'number' ? item.value : 0), 0)) : format(row.value))
    const pick = (key) => { if (c.filteringDisabled) return; state.selected = key; render() }

    const notices = []
    if (state.invalid > 0) notices.push(`<div class="epi-warning">${state.invalid} enregistrement(s) ignoré(s) : date non reconnue</div>`)
    if (c.fieldType === 'text') notices.push('<div class="epi-warning epi-info">Champ texte semaine : l’agrégation, la timeline et les indicateurs sont actifs, mais le filtrage de la source, de la carte et des composants connectés nécessite un champ Date natif.</div>')
    if (c.boundaryField && state.boundaryRows.length) notices.push(`<div class="epi-warning epi-info">${state.boundaryRows.length} agrégats zone × période — export CSV par zone disponible (${c.boundaryField})</div>`)

    const periodButtons = rows.map((row) => `<button data-period="${escapeHtml(row.key)}" ${c.filteringDisabled ? 'disabled' : ''} class="${row.key === state.selected ? 'selected' : ''}"><span>${escapeHtml(row.label)}</span>${canCumul ? `<small>${escapeHtml(periodValue(row))}</small>` : ''}</button>`).join('')

    const timeline = `<div class="epi-timeline">
      <div class="epi-timeline-label"><strong>${escapeHtml(selectedRow ? selectedRow.label : '—')}</strong><span>${c.filterMode === 'none' ? 'Timeline seule — source non filtrée' : (c.filterMode === 'cumulative' ? 'Progressif' : 'Période unique') + ' · un clic filtre la source'}</span></div>
      <div class="epi-timeline-controls">
        <button data-nav="first">|◀</button><button data-nav="prev">◀</button>
        <button data-nav="play">${state.playing ? 'Ⅱ' : '▶'}</button>
        <input type="range" min="0" max="${Math.max(0, rows.length - 1)}" value="${index}" data-nav="range" />
        <button data-nav="next">▶</button><button data-nav="last">▶|</button>
        <select data-nav="speed"><option value="2000" ${state.speed === 2000 ? 'selected' : ''}>Lent</option><option value="1200" ${state.speed === 1200 ? 'selected' : ''}>Normal</option><option value="600" ${state.speed === 600 ? 'selected' : ''}>Rapide</option></select>
        <button class="epi-control-button" data-nav="cumulative" ${canCumul ? '' : 'disabled'}>${state.cumulative ? 'Brut' : 'Cumulé'}</button>
      </div>
      <div class="epi-timeline-endpoints"><span>${escapeHtml(rows[0] ? rows[0].label : '—')}</span><span>${escapeHtml(rows.length ? rows[rows.length - 1].label : '—')}</span></div>
      <div class="epi-periods-header"><span>${rows.length} périodes · valeur affichée : ${state.cumulative && canCumul ? 'cumulé' : c.statistic}</span><button class="epi-collapse" data-nav="toggle">${state.periodsOpen ? 'Masquer les périodes' : 'Afficher les périodes'}</button></div>
      ${state.periodsOpen ? `<div class="epi-periods">${periodButtons}</div>` : ''}
    </div>`

    const summary = `<div class="epi-summary">
      <span><b>${escapeHtml(format(count))}</b><small>enregistrements au total</small></span>
      <span><b>${escapeHtml(format(peakRow ? peakRow.value : '—'))}</b><small>valeur du pic<br />${escapeHtml(peakRow ? peakRow.label : '—')}</small></span>
      <span><b>${rows.length}</b><small>périodes</small></span>
      ${canCumul ? `<span><b>${escapeHtml(format(state.cumulative ? rows.reduce((total, row) => total + (typeof row.value === 'number' ? row.value : 0), 0) : (selectedRow ? selectedRow.value : '—')))}</b><small>${state.cumulative ? 'total cumulé' : 'période active'}</small></span>` : ''}
    </div>`

    const comparison = state.comparisonRows.length ? `<div class="epi-comparison"><strong>Comparaison des années</strong><div class="epi-comparison-scroll"><table>
      <thead><tr><th>Période</th><th>2023</th><th>2024</th><th>2025</th><th>delta</th><th>%</th></tr></thead><tbody>
      ${state.comparisonRows.map((row) => `<tr><td>${escapeHtml(row.label)}</td>${[2023, 2024, 2025].map((year) => `<td>${row.values[year] === undefined ? '—' : escapeHtml(format(row.values[year]))}</td>`).join('')}<td>${row.change === undefined ? '—' : escapeHtml(format(row.change))}</td><td>${row.changePct === undefined ? '—' : escapeHtml(format(row.changePct)) + '%'}</td></tr>`).join('')}
      </tbody></table></div></div>` : ''

    const card = `<section class="epi-source">
      <div class="epi-heading"><div><h3>Source line-list (aperçu)</h3><span>${c.statistic === 'count' ? 'Nombre total d’enregistrements' : `${c.statistic} — ${escapeHtml(c.valueField || 'mesure non sélectionnée')}`}</span></div>
        <div class="epi-heading-right"><span class="epi-badge">${escapeHtml(format(count))}</span><small>enregistrements au total</small></div></div>
      <div class="epi-active-period"><strong>Période affichée : ${escapeHtml(selectedRow ? selectedRow.label : '—')}</strong><span>${c.filterMode === 'none' ? 'Toutes les données' : c.filterMode === 'cumulative' ? 'Progressif' : 'Période unique'}</span></div>
      ${notices.join('')}
      ${summary}
      ${comparison}
      ${timeline}
      <div class="epi-foot">${state.selected ? 'Filtre actif : ' + escapeHtml(selectedRow ? selectedRow.label : '') : 'Aucune période sélectionnée'} <button class="btn btn-sm epi-export-button" data-nav="csv">CSV</button></div>
    </section>`

    $('app').innerHTML = rows.length ? card : '<div class="epi-empty">Aucune période calculée. Vérifier le champ temporel et le jeu de données.</div>'
  }

  // ------------------------------------------------------------------ export CSV

  function exportCsv() {
    const c = currentConfig()
    const useBoundary = !!(c.boundaryField && state.boundaryRows.length)
    const csvRows = useBoundary
      ? state.boundaryRows.map((row) => [row.boundary, row.key, row.label, row.count, row.value, row.start.toISOString(), row.end.toISOString()])
      : state.rows.map((row) => [row.key, row.label, row.count, row.value, row.start.toISOString(), row.end.toISOString()])
    const headers = useBoundary ? 'boundary,period,label,count,value,start,end' : 'period,label,count,value,start,end'
    const csv = [headers].concat(csvRows.map((row) => row.map((value) => `"${String(value === null || value === undefined ? '' : value).replace(/"/g, '""')}"`).join(','))).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'epi-aggregation-apercu.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  // ------------------------------------------------------------------ contrôles moteur

  const CHECKS = [
    ['Semaine ISO d’une date', () => E.periodFor(E.parseEpiDate('2024-01-03'), 'epi-week').key, '2024-W01'],
    ['Convention jour/mois (12/01/2024)', () => E.parseEpiDate('12/01/2024', 'dmy').toISOString().slice(0, 10), '2024-01-12'],
    ['Convention mois/jour (01/12/2024)', () => E.parseEpiDate('01/12/2024', 'mdy').toISOString().slice(0, 10), '2024-01-12'],
    ['Date impossible rejetée (31/02/2024)', () => E.parseEpiDate('31/02/2024', 'dmy'), null],
    ['Série Excel 45293', () => E.parseEpiDate(45293).toISOString().slice(0, 10), '2024-01-02'],
    ['EpiWeek 2024-W02', () => E.periodFor(E.parseEpiDate('2024-W02'), 'epi-week').key, '2024-W02'],
    ['EpiWeek Week 04-2025', () => E.periodFor(E.parseEpiDate('Week 04-2025'), 'epi-week').key, '2025-W04'],
    ['EpiWeek S01_2026', () => E.periodFor(E.parseEpiDate('S01_2026'), 'epi-week').key, '2026-W01'],
    ['Année-mois 2025-01', () => E.periodFor(E.parseEpiDate('2025-01'), 'month').key, '2025-01'],
    ['Semaine 53 (2020-12-31)', () => E.periodFor(new Date(Date.UTC(2020, 11, 31)), 'epi-week').key, '2020-W53'],
    ['Count par semaine', () => E.aggregate([{ d: '2024-01-03' }, { d: '2024-01-04' }, { d: '2024-01-15' }], 'd', 'epi-week', 'iso', undefined, 'dmy', 'count').rows.map((r) => r.key + ':' + r.value).join(' | '), '2024-W01:2 | 2024-W03:1'],
    ['Somme (deaths)', () => E.aggregate([{ d: '2024-01-03', x: 1 }, { d: '2024-01-04', x: 2 }], 'd', 'epi-week', 'iso', undefined, 'dmy', 'sum', 'x', 'number').rows[0].value, 3],
    ['Médiane de 1 et 2', () => E.aggregate([{ d: '2024-01-03', x: 1 }, { d: '2024-01-04', x: 2 }], 'd', 'epi-week', 'iso', undefined, 'dmy', 'median', 'x', 'number').rows[0].value, 1.5],
    ['Périodes manquantes à zéro', () => E.aggregate([{ d: '2024-01-03' }, { d: '2024-01-15' }], 'd', 'epi-week', 'iso', undefined, 'dmy', 'count', undefined, 'number', true).rows.map((r) => r.key + ':' + r.value).join(' | '), '2024-W01:1 | 2024-W02:0 | 2024-W03:1'],
    ['Dates illisibles comptées', () => E.aggregate([{ d: 'pas une date' }, { d: '2024-01-03' }], 'd', 'epi-week', 'iso', undefined, 'dmy', 'count').invalid, 1],
    ['Comparaison 2024 / 2025', () => { const r = E.compareYears([{ d: '2024-01-03' }, { d: '2025-01-01' }, { d: '2025-01-02' }], 'd', 'epi-week', [2024, 2025], 'iso', 'count', undefined, 'number', 'dmy', undefined, 2024)[0]; return r.label + ' delta=' + r.change }, 'S01 delta=1'],
    ['Agrégats par zone', () => E.aggregateByBoundary([{ d: '2024-01-03', z: 'Dakar' }, { d: '2024-01-04', z: 'Dakar' }, { d: '2024-01-05', z: 'Thies' }], 'd', 'z', 'epi-week', 'iso', 'count').map((r) => r.boundary + ':' + r.value).join(' | '), 'Dakar:2 | Thies:1'],
  ]

  function runChecks() {
    let ok = 0
    $('checksBody').innerHTML = CHECKS.map(([label, fn, expected]) => {
      let got, error
      try { got = fn() } catch (e) { error = e.message }
      const passed = JSON.stringify(got) === JSON.stringify(expected)
      if (passed) ok += 1
      return `<tr><td class="${passed ? 'ok' : 'ko'}">${passed ? 'OK' : 'ÉCHEC'}</td><td>${escapeHtml(label)}</td><td>${escapeHtml(error ? 'erreur : ' + error : JSON.stringify(got))}${passed ? '' : ' — attendu ' + escapeHtml(JSON.stringify(expected))}</td></tr>`
    }).join('')
    $('checksSummary').innerHTML = `<strong>${ok}/${CHECKS.length} contrôles conformes.</strong> Ces contrôles portent sur le moteur d'agrégation. Le rendu, la carte et la requête serveur restent à valider dans Experience Builder (tests T1 à T15).`
  }

  // ------------------------------------------------------------------ événements

  document.addEventListener('change', (event) => {
    const id = event.target.id
    if (id === 'dataset') { $('uploadWrap').hidden = event.target.value !== 'fichier'; if (event.target.value === 'fichier') return }
    if (id === 'upload') {
      const file = event.target.files && event.target.files[0]
      if (!file) return
      file.text().then(loadRecords)
      return
    }
    if (id === 'weekMode') $('outbreakStart').disabled = event.target.value !== 'outbreak'
    if (['field', 'statistic', 'period', 'convention', 'weekMode', 'outbreakStart', 'fill', 'filterMode', 'comparison', 'boundary'].includes(id)) { state.selected = ''; recompute() }
  })

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-nav]')
    if (target) {
      const action = target.getAttribute('data-nav')
      const rows = state.rows
      const index = Math.max(0, rows.findIndex((row) => row.key === state.selected))
      const setIndex = (i) => { state.selected = rows[Math.max(0, Math.min(rows.length - 1, i))].key; render() }
      if (action === 'first') setIndex(0)
      else if (action === 'prev') setIndex(index - 1)
      else if (action === 'next') setIndex(index + 1)
      else if (action === 'last') setIndex(rows.length - 1)
      else if (action === 'cumulative') { state.cumulative = !state.cumulative; render() }
      else if (action === 'toggle') { state.periodsOpen = !state.periodsOpen; render() }
      else if (action === 'csv') exportCsv()
      else if (action === 'play') {
        state.playing = !state.playing
        if (state.timer) { clearInterval(state.timer); state.timer = null }
        if (state.playing) state.timer = setInterval(() => { const i = Math.max(0, rows.findIndex((row) => row.key === state.selected)); state.selected = rows[(i + 1) % rows.length].key; render() }, state.speed)
        render()
      }
      return
    }
    const periodButton = event.target.closest('[data-period]')
    if (periodButton) { state.selected = periodButton.getAttribute('data-period'); render() }
  })

  document.addEventListener('input', (event) => {
    if (event.target.getAttribute('data-nav') === 'range' && state.rows.length) { state.selected = state.rows[Number(event.target.value)].key; render() }
  })

  document.addEventListener('change', (event) => {
    if (event.target.getAttribute('data-nav') === 'speed') { state.speed = Number(event.target.value); if (state.playing) { clearInterval(state.timer); state.timer = setInterval(() => { const rows = state.rows; const i = Math.max(0, rows.findIndex((row) => row.key === state.selected)); state.selected = rows[(i + 1) % rows.length].key; render() }, state.speed) } }
  })

  $('runChecks').addEventListener('click', runChecks)

  // ------------------------------------------------------------------ démarrage

  fetch($('dataset').value)
    .then((response) => response.text())
    .then((text) => { loadRecords(text); runChecks() })
    .catch(() => { $('app').innerHTML = '<div class="epi-empty">Jeu de test introuvable : ouvrir cette page via un serveur HTTP (voir tools/preview/README.md).</div>'; runChecks() })
})()
