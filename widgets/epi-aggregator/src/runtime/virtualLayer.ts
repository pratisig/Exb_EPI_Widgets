import { BoundaryAggregateRow } from './spatialAggregation'

export interface BoundaryFeatureLike { attributes?: any; geometry?: any }
export interface VirtualAggregateFeature { attributes: { OBJECTID: number; boundary: string; period: string; value: any; count: number; label: string }; geometry: any }

/** Joins period/boundary aggregates to boundary geometries without mutating either source.
 * The returned feature-like objects are ready to be passed to an ArcGIS client-side
 * FeatureLayer source by the map adapter. */
export function joinBoundaryGeometries(boundaries: BoundaryFeatureLike[], aggregates: BoundaryAggregateRow[], boundaryField: string, periodKey: string, includeZeros = true): VirtualAggregateFeature[] {
  const geometryByBoundary = new Map<string, any>()
  boundaries.forEach(feature => { const attrs = feature.attributes || {}; const key = attrs[boundaryField]; if (key !== null && key !== undefined && key !== '' && feature.geometry) geometryByBoundary.set(String(key), feature.geometry) })
  return aggregates.filter(row => row.key === periodKey && (includeZeros || row.value !== 0 || row.count !== 0)).map((row, index) => ({ attributes: { OBJECTID: index + 1, boundary: row.boundary, period: row.label, value: row.value, count: row.count, label: `${row.boundary} — ${row.label}` }, geometry: geometryByBoundary.get(row.boundary) })).filter(feature => !!feature.geometry)
}
