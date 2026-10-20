export type SpotCategory = 'restaurant' | 'cafe' | 'convenience'

export interface LatLng {
  lat: number
  lng: number
}

export interface Center extends LatLng {
  name: string
}

export interface Spot extends LatLng {
  /** 一意・URL-safe */
  id: string
  name: string
  category: SpotCategory
  /** 1 人あたりの予算（円・整数）。不明な場合は null */
  price: number | null
  url: string
}

export interface SpotData {
  center: Center
  spots: Spot[]
}
