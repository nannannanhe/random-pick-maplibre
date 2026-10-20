import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import { validateSpotData } from '../lib/validate'
import { ja } from '../locales/ja'
import type { SpotData } from '../types/spot'

const DEFAULT_URL = `${import.meta.env.BASE_URL}data/restaurants.json`

export interface UseSpots {
  /** 検証済みのデータ。読み込み中・エラー時は null */
  data: Readonly<ShallowRef<SpotData | null>>
  loading: Readonly<Ref<boolean>>
  /** アプリ全体に表示するエラー文言。エラーがなければ null */
  error: Readonly<Ref<string | null>>
  reload: () => Promise<void>
}

/**
 * 中心地点と店舗データを読み込み、検証する。呼び出すとすぐに読み込みを始める。
 * - 取得失敗・JSON 不正・spots が配列でない → errorLoad
 * - center 不正 → errorCenter
 * - 不正な spot は validate 側でスキップ（console.warn）し、アプリは落とさない
 */
export function useSpots(url: string = DEFAULT_URL): UseSpots {
  const data = shallowRef<SpotData | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  // reload が重なったとき、古いリクエストの結果で上書きしないための番号
  let requestId = 0

  async function reload(): Promise<void> {
    const id = ++requestId
    loading.value = true
    error.value = null

    let nextData: SpotData | null = null
    let nextError: string | null = null
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: unknown = await res.json()
      const result = validateSpotData(json)
      if (result.ok) {
        nextData = result.data
      } else {
        nextError = result.reason === 'center' ? ja.app.errorCenter : ja.app.errorLoad
      }
    } catch (e) {
      console.error(e)
      nextError = ja.app.errorLoad
    }

    if (id !== requestId) return
    data.value = nextData
    error.value = nextError
    loading.value = false
  }

  void reload()

  return { data, loading, error, reload }
}
