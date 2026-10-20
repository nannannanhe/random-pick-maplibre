import type { LatLng } from '../types/spot'

/** 地球の平均半径（m） */
const EARTH_RADIUS_M = 6_371_000

/** 直線距離フォールバック時の徒歩速度（m/分） */
export const WALK_SPEED_M_PER_MIN = 80

const toRad = (deg: number) => (deg * Math.PI) / 180

/** 2 点間の直線距離（m）。Haversine 公式 */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** 直線距離（m）から徒歩の所要時間（分）を出す。80m/分で切り上げ */
export function walkMinutesFromDistance(distanceM: number): number {
  return Math.ceil(distanceM / WALK_SPEED_M_PER_MIN)
}

/** OSRM の duration（秒）を分に換算する。切り上げ */
export function secondsToMinutes(seconds: number): number {
  return Math.ceil(seconds / 60)
}
