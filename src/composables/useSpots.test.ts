import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ja } from '../locales/ja'
import { useSpots } from './useSpots'

const center = { name: '本社オフィス', lat: 35.4429, lng: 139.638 }
const spot = {
  id: 1,
  name: 'らーめん一番',
  category: 'restaurant',
  price: 950,
  lat: 35.4449,
  lng: 139.6404,
  url: 'https://example.com/ramen',
}
const validJson = { center, spots: [spot] }

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** 解決のタイミングを外から制御できる Promise */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

/** 未処理の Promise（fetch → json → 反映）を流し切る */
const flush = () => new Promise<void>((r) => setTimeout(r, 0))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useSpots', () => {
  describe('成功', () => {
    it('読み込み中は loading = true、完了後に data が入る', async () => {
      fetchMock.mockResolvedValue(jsonResponse(validJson))
      const { data, loading, error } = useSpots()

      expect(loading.value).toBe(true)
      expect(data.value).toBeNull()

      await flush()
      expect(loading.value).toBe(false)
      expect(data.value).toEqual(validJson)
      expect(error.value).toBeNull()
    })

    it('不正な spot はスキップし、他の店舗で表示を続ける', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ center, spots: [spot, { ...spot, id: 2, url: 'ftp://x' }] }),
      )
      const { data, error } = useSpots()

      await flush()
      expect(data.value?.spots.map((s) => s.id)).toEqual([1])
      expect(error.value).toBeNull()
      expect(console.warn).toHaveBeenCalledOnce()
    })
  })

  describe('取得失敗は errorLoad', () => {
    it.each([
      ['fetch が reject（ネットワークエラー）', () => Promise.reject(new TypeError('Failed'))],
      ['HTTP 404', () => Promise.resolve(jsonResponse({}, 404))],
      ['HTTP 500', () => Promise.resolve(jsonResponse(validJson, 500))],
      ['JSON でない（HTML が返った）', () => Promise.resolve(new Response('<!doctype html>'))],
    ])('%s', async (_label, impl) => {
      fetchMock.mockImplementation(impl)
      const { data, loading, error } = useSpots()

      await flush()
      expect(error.value).toBe(ja.app.errorLoad)
      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)
    })
  })

  describe('データ不正', () => {
    it('center が不正なら errorCenter', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ center: { name: '' }, spots: [] }))
      const { data, error } = useSpots()

      await flush()
      expect(error.value).toBe(ja.app.errorCenter)
      expect(data.value).toBeNull()
    })

    it('spots が配列でなければ errorLoad', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ center, spots: {} }))
      const { error } = useSpots()

      await flush()
      expect(error.value).toBe(ja.app.errorLoad)
    })
  })

  describe('reload', () => {
    it('失敗後に reload して成功すれば error が消え data が入る', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed'))
      const { data, error, reload } = useSpots()
      await flush()
      expect(error.value).toBe(ja.app.errorLoad)

      fetchMock.mockResolvedValueOnce(jsonResponse(validJson))
      await reload()
      expect(error.value).toBeNull()
      expect(data.value).toEqual(validJson)
    })

    it('reload 中は loading = true に戻り、error はクリアされる', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed'))
      const { loading, error, reload } = useSpots()
      await flush()

      const pending = deferred<Response>()
      fetchMock.mockReturnValueOnce(pending.promise)
      const done = reload()
      expect(loading.value).toBe(true)
      expect(error.value).toBeNull()

      pending.resolve(jsonResponse(validJson))
      await done
      expect(loading.value).toBe(false)
    })

    it('古いリクエストが後から返っても、新しい結果を上書きしない', async () => {
      const slow = deferred<Response>()
      const fast = deferred<Response>()
      fetchMock.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise)

      const { data, loading, error, reload } = useSpots() // 1 回目（遅い）
      const second = reload() // 2 回目（速い）

      fast.resolve(jsonResponse({ center, spots: [{ ...spot, id: 2 }] }))
      await second
      slow.resolve(jsonResponse({ center: { name: '' }, spots: [] })) // 1 回目は center 不正
      await flush()

      expect(data.value?.spots.map((s) => s.id)).toEqual([2])
      expect(error.value).toBeNull()
      expect(loading.value).toBe(false)
    })
  })

  describe('URL', () => {
    it('省略時は BASE_URL + data/restaurants.json を読む', async () => {
      fetchMock.mockResolvedValue(jsonResponse(validJson))
      useSpots()
      await flush()
      expect(fetchMock).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}data/restaurants.json`)
    })

    it('指定した URL を読む', async () => {
      fetchMock.mockResolvedValue(jsonResponse(validJson))
      useSpots('/custom/spots.json')
      await flush()
      expect(fetchMock).toHaveBeenCalledWith('/custom/spots.json')
    })
  })
})
