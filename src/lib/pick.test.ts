import { describe, expect, it } from 'vitest'
import type { Spot } from '../types/spot'
import { pickRandom } from './pick'

function spot(id: number): Spot {
  return {
    id,
    name: `店 ${id}`,
    category: 'restaurant',
    price: 900,
    lat: 35.44,
    lng: 139.63,
    url: `https://example.com/${id}`,
  }
}

const three = [spot(1), spot(2), spot(3)]

/** 固定値を返す rng */
const fixed = (value: number) => () => value

describe('pickRandom', () => {
  it('空配列なら null', () => {
    expect(pickRandom([], null, fixed(0))).toBeNull()
    expect(pickRandom([], 1, fixed(0))).toBeNull()
  })

  it('1 件のみならその店を返す（直前と同じでも返す）', () => {
    expect(pickRandom([spot(1)], null, fixed(0.5))?.id).toBe(1)
    expect(pickRandom([spot(1)], 1, fixed(0.5))?.id).toBe(1)
  })

  it('rng の値に応じて候補から選ぶ', () => {
    expect(pickRandom(three, null, fixed(0))?.id).toBe(1)
    expect(pickRandom(three, null, fixed(0.5))?.id).toBe(2)
    expect(pickRandom(three, null, fixed(0.99))?.id).toBe(3)
  })

  it('rng が 1 を返しても範囲外にならない', () => {
    expect(pickRandom(three, null, fixed(1))?.id).toBe(3)
  })

  it('2 件以上なら直前と同じ店を避ける', () => {
    // 直前が 1 → 候補は [2, 3]
    expect(pickRandom(three, 1, fixed(0))?.id).toBe(2)
    expect(pickRandom(three, 1, fixed(0.99))?.id).toBe(3)
    // 2 件のときは必ずもう一方
    expect(pickRandom([spot(1), spot(2)], 2, fixed(0))?.id).toBe(1)
    expect(pickRandom([spot(1), spot(2)], 2, fixed(0.99))?.id).toBe(1)
  })

  it('どの乱数値でも直前の店は選ばれない', () => {
    for (let i = 0; i < 100; i++) {
      expect(pickRandom(three, 2, fixed(i / 100))?.id).not.toBe(2)
    }
  })

  it('直前の店が候補にない（絞り込みで消えた）場合は全候補から選ぶ', () => {
    expect(pickRandom(three, 99, fixed(0))?.id).toBe(1)
    expect(pickRandom(three, 99, fixed(0.99))?.id).toBe(3)
  })

  it('rng を省略しても候補のいずれかを返す', () => {
    const picked = pickRandom(three)
    expect(three).toContain(picked)
  })
})
