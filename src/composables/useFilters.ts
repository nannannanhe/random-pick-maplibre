import { computed, reactive, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import {
  applyFilters,
  countByFilter,
  INITIAL_FILTERS,
  type FilterKey,
  type FilterState,
} from '../lib/filter'
import type { Spot } from '../types/spot'

export interface UseFilters {
  /** チェックボックスの状態（v-model でそのまま使える） */
  filters: FilterState
  /** 絞り込み後のリスト（Random Pick! の抽選対象） */
  filtered: ComputedRef<Spot[]>
  /** 各チェックボックス横の件数。全 spots に対する固定値 */
  counts: ComputedRef<Record<FilterKey, number>>
  /** 「表示中 N / M 件」の N */
  visibleCount: ComputedRef<number>
  /** 「表示中 N / M 件」の M（全 spots 数） */
  totalCount: ComputedRef<number>
  toggle: (key: FilterKey) => void
}

/** 絞り込み状態と絞り込み後リスト。ロジックは lib/filter.ts に置き、ここは状態の保持のみ */
export function useFilters(spots: MaybeRefOrGetter<readonly Spot[]>): UseFilters {
  const filters = reactive<FilterState>({ ...INITIAL_FILTERS })

  const filtered = computed(() => applyFilters(toValue(spots), filters))
  const counts = computed(() => countByFilter(toValue(spots)))
  const visibleCount = computed(() => filtered.value.length)
  const totalCount = computed(() => toValue(spots).length)

  function toggle(key: FilterKey): void {
    filters[key] = !filters[key]
  }

  return { filters, filtered, counts, visibleCount, totalCount, toggle }
}
