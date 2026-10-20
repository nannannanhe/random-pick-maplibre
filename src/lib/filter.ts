import type { Spot } from '../types/spot'

/** チェックボックスの状態。true = 表示する */
export interface FilterState {
  showConvenience: boolean
  showOver1000: boolean
  showCafe: boolean
}

export type FilterKey = keyof FilterState

/** 画面に並べる順番 */
export const FILTER_KEYS: readonly FilterKey[] = ['showConvenience', 'showOver1000', 'showCafe']

/** 初期状態はすべてチェック済み（＝すべて表示） */
export const INITIAL_FILTERS: Readonly<FilterState> = {
  showConvenience: true,
  showOver1000: true,
  showCafe: true,
}

/** この金額を「超える」お店が価格フィルターの対象（ちょうどの金額は含めない） */
export const PRICE_THRESHOLD = 1000

/** 各チェックボックスの条件。チェックを外したとき、該当する spot を非表示にする */
const MATCHERS: Record<FilterKey, (spot: Spot) => boolean> = {
  showConvenience: (spot) => spot.category === 'convenience',
  // price === null は価格フィルターの対象外
  showOver1000: (spot) => spot.price !== null && spot.price > PRICE_THRESHOLD,
  showCafe: (spot) => spot.category === 'cafe',
}

/** 絞り込み後のリストを返す。外したいずれかの条件に該当すれば非表示（OR） */
export function applyFilters(spots: readonly Spot[], state: FilterState): Spot[] {
  const hidden = FILTER_KEYS.filter((key) => !state[key])
  return spots.filter((spot) => !hidden.some((key) => MATCHERS[key](spot)))
}

/** 各条件に該当する件数。他のチェック状態には依存しない（全 spots に対する固定値） */
export function countByFilter(spots: readonly Spot[]): Record<FilterKey, number> {
  return {
    showConvenience: spots.filter(MATCHERS.showConvenience).length,
    showOver1000: spots.filter(MATCHERS.showOver1000).length,
    showCafe: spots.filter(MATCHERS.showCafe).length,
  }
}
