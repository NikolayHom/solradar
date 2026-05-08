// Data-source registry for solradar. Each source maps to a collector under
// `api/collectors/`. The frontend renders one card per source on /sources.

export type SourceMode = 'live' | 'demo' | 'planned'

export interface DataSource {
  id: string
  label: string
  protocol: 'helium' | 'hivemapper' | 'render'
  endpoint: string
  cadenceSeconds: number
  mode: SourceMode
  rowsApprox: number
  lastSync?: string
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'helium-iot-hotspots',
    label: 'helium IoT hotspots',
    protocol: 'helium',
    endpoint: '/api/helium/hotspots',
    cadenceSeconds: 300,
    mode: 'live',
    rowsApprox: 1_120_000,
  },
  {
    id: 'helium-mobile-towers',
    label: 'helium mobile towers',
    protocol: 'helium',
    endpoint: '/api/helium/mobile',
    cadenceSeconds: 600,
    mode: 'demo',
    rowsApprox: 96_000,
  },
  {
    id: 'hivemapper-frames',
    label: 'hivemapper streetview frames',
    protocol: 'hivemapper',
    endpoint: '/api/hivemapper/frames',
    cadenceSeconds: 3600,
    mode: 'live',
    rowsApprox: 28_400_000,
  },
  {
    id: 'render-providers',
    label: 'render network providers',
    protocol: 'render',
    endpoint: '/api/render/providers',
    cadenceSeconds: 900,
    mode: 'live',
    rowsApprox: 4_700,
  },
  {
    id: 'render-jobs',
    label: 'render jobs in flight',
    protocol: 'render',
    endpoint: '/api/render/jobs',
    cadenceSeconds: 60,
    mode: 'demo',
    rowsApprox: 12_300,
  },
]

export function getSourcesByProtocol(protocol: DataSource['protocol']): DataSource[] {
  return DATA_SOURCES.filter((s) => s.protocol === protocol)
}
