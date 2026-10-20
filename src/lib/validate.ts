import { ja } from '../locales/ja'
import type { Center, Spot, SpotCategory, SpotData } from '../types/spot'

/**
 * 検証結果。
 * - ok: true … 不正な spot を除いたデータ
 * - ok: false … アプリ全体をエラー表示にすべき不正（center 不正、または spots が配列でない）
 */
export type ValidateResult =
  { ok: true; data: SpotData } | { ok: false; reason: 'center' | 'spots' }

type Warn = (message: string) => void

const CATEGORIES: readonly SpotCategory[] = ['restaurant', 'cafe', 'convenience']

const reasons = ja.validate.reasons

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isLat(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90
}

function isLng(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180
}

function isCategory(value: unknown): value is SpotCategory {
  return CATEGORIES.some((c) => c === value)
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export function parseCenter(raw: unknown): Center | null {
  if (!isRecord(raw)) return null
  const { name, lat, lng } = raw
  if (!isNonEmptyString(name) || !isLat(lat) || !isLng(lng)) return null
  return { name, lat, lng }
}

/** spot を検証する。正しければ Spot、不正なら理由の文言を返す */
export function parseSpot(raw: unknown): Spot | string {
  if (!isRecord(raw)) return reasons.notObject
  const { id, name, category, price, lat, lng, url } = raw
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) return reasons.id
  if (!isNonEmptyString(name)) return reasons.name
  if (!isCategory(category)) return reasons.category
  if (price !== null && (typeof price !== 'number' || !Number.isInteger(price) || price < 0)) {
    return reasons.price
  }
  if (!isLat(lat) || !isLng(lng)) return reasons.latLng
  if (!isHttpUrl(url)) return reasons.url
  // 余分なプロパティは持ち込まない
  return { id, name, category, price, lat, lng, url }
}

/**
 * JSON を検証する。不正な spot・id 重複の 2 件目以降はスキップして warn を呼ぶ。
 * @param warn テスト用に差し替え可能。デフォルトは console.warn
 */
export function validateSpotData(
  input: unknown,
  warn: Warn = (message) => console.warn(message),
): ValidateResult {
  const center = parseCenter(isRecord(input) ? input.center : undefined)
  if (!center) return { ok: false, reason: 'center' }

  const rawSpots = isRecord(input) ? input.spots : undefined
  if (!Array.isArray(rawSpots)) return { ok: false, reason: 'spots' }

  const spots: Spot[] = []
  const seen = new Set<number>()
  rawSpots.forEach((raw: unknown, index) => {
    const rawId = isRecord(raw) ? raw.id : undefined
    const result = parseSpot(raw)
    if (typeof result === 'string') {
      warn(ja.validate.skipped(index, rawId, result))
      return
    }
    if (seen.has(result.id)) {
      warn(ja.validate.skipped(index, rawId, reasons.duplicate))
      return
    }
    seen.add(result.id)
    spots.push(result)
  })

  return { ok: true, data: { center, spots } }
}
