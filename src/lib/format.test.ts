import { describe, expect, it } from 'vitest'
import { formatDistance, formatPrice } from './format'

describe('formatPrice', () => {
  it.each([
    [0, '〜0円'],
    [950, '〜950円'],
    [1000, '〜1,000円'],
    [1600, '〜1,600円'],
    [12345, '〜12,345円'],
  ])('%d → %s', (price, expected) => {
    expect(formatPrice(price)).toBe(expected)
  })

  it('null は「価格不明」', () => {
    expect(formatPrice(null)).toBe('価格不明')
  })
})

describe('formatDistance', () => {
  it.each([
    [0, '0 m'],
    [4, '0 m'],
    [5, '10 m'],
    [344, '340 m'],
    [345, '350 m'],
    [990, '990 m'],
    [994, '990 m'],
    // 10m 単位に丸めた結果で判定する（999m → 1,000m → km 表記）
    [995, '1.0 km'],
    [999, '1.0 km'],
    [1000, '1.0 km'],
    [1049, '1.0 km'],
    [1050, '1.1 km'],
    [1234, '1.2 km'],
    [1250, '1.3 km'],
    [12_345, '12.3 km'],
  ])('%d m → %s', (distance, expected) => {
    expect(formatDistance(distance)).toBe(expected)
  })

  it('compact では単位の前の空白を省く', () => {
    expect(formatDistance(344, { compact: true })).toBe('340m')
    expect(formatDistance(1234, { compact: true })).toBe('1.2km')
  })
})
