export interface SDRContact {
  id: string
  lat: number
  lon: number
  type: 'ads-b' | 'ais' | 'aprs'
  rssi: number
  timestamp: number
  // ADS-B specific
  callsign?: string
  altitude?: number
  speed?: number
  heading?: number
  // AIS specific
  mmsi?: string
  name?: string
  // APRS specific
  comment?: string
}

export interface SDRSpectrumData {
  frequencies: number[]
  amplitudes: number[]
  timestamp: number
  centerFrequency: number
  sampleRate: number
}

export interface SDRStats {
  totalDetections: number
  adsBCount: number
  aisCount: number
  aprsCount: number
  peakFrequency: number
  averageRSSI: number
}

export interface SDRState {
  enabled: boolean
  mode: 'ADS-B' | 'AIS' | 'APRS' | 'SPECTRUM' | 'ALL'
  centerFrequency: number
  sampleRate: number
  gain: number
}

export interface SDRData {
  contacts: SDRContact[]
  spectrumData: SDRSpectrumData | null
  stats: SDRStats | null
  state: SDRState | null
  contactHistory?: Record<string, Array<{ lat: number; lon: number; timestamp: number }>>
}
