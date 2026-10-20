import { describe, expect, it } from 'vitest'
import type { Spot, SpotCategory } from '../types/spot'
import { applyFilters, countByFilter, INITIAL_FILTERS, type FilterState } from './filter'

function spot(id: number, category: SpotCategory, price: number | null): Spot {
  return {
    id,
    name: `店 ${id}`,
    category,
    price,
    lat: 35.44,
    lng: 139.63,
    url: `https://example.com/${id}`,
  }
}

const spots: Spot[] = [
  spot(1, 'restaurant', 950),
  spot(2, 'restaurant', 1000), // ちょうど 1,000 円は「超え」に含めない
  spot(3, 'restaurant', 1001),
  spot(4, 'restaurant', null), // 価格不明は価格フィルターの対象外
  spot(5, 'cafe', 750),
  spot(6, 'cafe', 1100), // カフェかつ 1,000 円超え
  spot(7, 'convenience', null),
  spot(8, 'convenience', 1200), // コンビニかつ 1,000 円超え
]

function ids(state: Partial<FilterState>): number[] {
  return applyFilters(spots, { ...INITIAL_FILTERS, ...state }).map((s) => s.id)
}

describe('applyFilters', () => {
  it('初期状態（すべてチェック済み）では全件表示', () => {
    expect(ids({})).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('コンビニを外すとコンビニを非表示', () => {
    expect(ids({ showConvenience: false })).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('1,000円超えを外すと price > 1000 を非表示（1,000 円ちょうど・null は残す）', () => {
    expect(ids({ showOver1000: false })).toEqual([1, 2, 4, 5, 7])
  })

  it('カフェを外すとカフェを非表示', () => {
    expect(ids({ showCafe: false })).toEqual([1, 2, 3, 4, 7, 8])
  })

  it('コンビニ＋1,000円超えを外す', () => {
    expect(ids({ showConvenience: false, showOver1000: false })).toEqual([1, 2, 4, 5])
  })

  it('コンビニ＋カフェを外す', () => {
    expect(ids({ showConvenience: false, showCafe: false })).toEqual([1, 2, 3, 4])
  })

  it('1,000円超え＋カフェを外す', () => {
    expect(ids({ showOver1000: false, showCafe: false })).toEqual([1, 2, 4, 7])
  })

  it('すべて外すと、どの条件にも該当しない店だけ残る', () => {
    expect(ids({ showConvenience: false, showOver1000: false, showCafe: false })).toEqual([1, 2, 4])
  })

  it('空配列なら空配列', () => {
    expect(applyFilters([], INITIAL_FILTERS)).toEqual([])
  })

  it('元の配列を変更しない', () => {
    const copy = [...spots]
    applyFilters(spots, { ...INITIAL_FILTERS, showCafe: false })
    expect(spots).toEqual(copy)
  })
})

describe('countByFilter', () => {
  it('各条件に該当する件数を数える（重複して数える）', () => {
    expect(countByFilter(spots)).toEqual({
      showConvenience: 2,
      showOver1000: 3, // 1001・1100（カフェ）・1200（コンビニ）。1000 と null は数えない
      showCafe: 2,
    })
  })

  it('空配列なら 0 件', () => {
    expect(countByFilter([])).toEqual({ showConvenience: 0, showOver1000: 0, showCafe: 0 })
  })
})
