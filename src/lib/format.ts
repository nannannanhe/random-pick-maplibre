import { ja } from '../locales/ja'

const yen = new Intl.NumberFormat('ja-JP')

/** 予算の表示。例：〜1,600円。null は「価格不明」 */
export function formatPrice(price: number | null): string {
  return price === null ? ja.price.unknown : `〜${yen.format(price)}円`
}

/**
 * 距離の表示。10m 単位に丸め、丸めた結果が 1,000m 以上なら km（小数 1 桁）。
 * 例：340 m／1.2 km。compact: true で単位の前の空白を省く（SP のチップ用：340m）
 */
export function formatDistance(distanceM: number, { compact = false } = {}): string {
  const sep = compact ? '' : ' '
  const rounded = Math.round(distanceM / 10) * 10
  if (rounded < 1000) return `${rounded}${sep}m`
  // 二重丸め（1,049m → 1,050m → 1.1 km）を避けるため元の距離から丸める。
  // 小数の誤差を避けるため 100m 単位の整数で丸めてから km にする
  const km = Math.round(distanceM / 100) / 10
  return `${km.toFixed(1)}${sep}km`
}
