import { describe, expect, it } from 'vitest'
import { haversine, secondsToMinutes, walkMinutesFromDistance } from './geo'

describe('haversine', () => {
  it('同じ地点なら 0', () => {
    const p = { lat: 35.4429, lng: 139.638 }
    expect(haversine(p, p)).toBe(0)
  })

  it('経線に沿った緯度 1 度は約 111.195 km', () => {
    expect(haversine({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111_195, 0)
  })

  it('赤道上の経度 1 度は約 111.195 km', () => {
    expect(haversine({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111_195, 0)
  })

  it('東京駅〜大阪駅は約 403 km', () => {
    const tokyo = { lat: 35.6812, lng: 139.7671 }
    const osaka = { lat: 34.7025, lng: 135.4959 }
    expect(Math.abs(haversine(tokyo, osaka) - 403_000)).toBeLessThan(1_000)
  })

  it('向きによらず同じ距離', () => {
    const a = { lat: 35.4429, lng: 139.638 }
    const b = { lat: 35.4449, lng: 139.6404 }
    expect(haversine(a, b)).toBeCloseTo(haversine(b, a), 9)
  })
})

describe('walkMinutesFromDistance（80m/分で切り上げ）', () => {
  it.each([
    [0, 0],
    [1, 1],
    [80, 1],
    [81, 2],
    [160, 2],
    [400, 5],
    [401, 6],
  ])('%d m → %d 分', (distance, minutes) => {
    expect(walkMinutesFromDistance(distance)).toBe(minutes)
  })
})

describe('secondsToMinutes（切り上げ）', () => {
  it.each([
    [0, 0],
    [1, 1],
    [60, 1],
    [60.4, 2],
    [299.9, 5],
    [300, 5],
  ])('%d 秒 → %d 分', (seconds, minutes) => {
    expect(secondsToMinutes(seconds)).toBe(minutes)
  })
})
