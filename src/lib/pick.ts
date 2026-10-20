import type { Spot } from '../types/spot'

/** [0, 1) の乱数を返す関数。テストでは固定値を返す関数を注入する */
export type Rng = () => number

/**
 * 候補からランダムに 1 件選ぶ。候補が 0 件なら null。
 * 候補が 2 件以上あるときは、直前に選んだ店（previousId）を避ける。
 */
export function pickRandom(
  candidates: readonly Spot[],
  previousId: number | null = null,
  rng: Rng = Math.random,
): Spot | null {
  const pool =
    candidates.length >= 2 ? candidates.filter((spot) => spot.id !== previousId) : candidates
  if (pool.length === 0) return null
  // rng が 1 を返しても範囲外にならないようにする
  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1)
  return pool[index] ?? null
}
