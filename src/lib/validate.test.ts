import { readFile } from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'
import { validateSpotData } from './validate'

const center = { name: '本社オフィス', lat: 35.4429, lng: 139.638 }

const validSpot = {
  id: 1,
  name: 'らーめん一番',
  category: 'restaurant',
  price: 950,
  lat: 35.4449,
  lng: 139.6404,
  url: 'https://example.com/ramen',
}

/** spot 1 件を検証し、残った spots と warn を返す */
function validateOne(spot: unknown) {
  const warn = vi.fn()
  const result = validateSpotData({ center, spots: [spot] }, warn)
  if (!result.ok) throw new Error('center は正しいはず')
  return { spots: result.data.spots, warn }
}

/** 指定したキーを除いた spot を作る（必須項目の欠落テスト用） */
function without(key: keyof typeof validSpot): Record<string, unknown> {
  const spot: Record<string, unknown> = { ...validSpot }
  delete spot[key]
  return spot
}

describe('validateSpotData', () => {
  it('正しいデータはそのまま通す', () => {
    const warn = vi.fn()
    const result = validateSpotData({ center, spots: [validSpot] }, warn)
    expect(result).toEqual({ ok: true, data: { center, spots: [validSpot] } })
    expect(warn).not.toHaveBeenCalled()
  })

  it.each([
    ['price が null', { ...validSpot, price: null }],
    ['price が 0', { ...validSpot, price: 0 }],
    ['http の URL', { ...validSpot, url: 'http://example.com/' }],
  ])('%s は正しい spot として扱う', (_label, spot) => {
    const { spots, warn } = validateOne(spot)
    expect(spots).toHaveLength(1)
    expect(warn).not.toHaveBeenCalled()
  })

  it('余分なプロパティは取り除く', () => {
    const { spots } = validateOne({ ...validSpot, extra: 'x' })
    expect(spots[0]).toEqual(validSpot)
  })

  describe('不正な spot はスキップして warn する', () => {
    it.each([
      ['オブジェクトでない', 'ramen'],
      ['null', null],
      ['id の欠落', without('id')],
      ['name の欠落', without('name')],
      ['category の欠落', without('category')],
      ['price の欠落', without('price')],
      ['lat の欠落', without('lat')],
      ['url の欠落', without('url')],
      ['name が空白のみ', { ...validSpot, name: '  ' }],
      ['lat が範囲外', { ...validSpot, lat: 91 }],
      ['lng が文字列', { ...validSpot, lng: '139.6' }],
      ['不正な category', { ...validSpot, category: 'bar' }],
      ['javascript: の URL', { ...validSpot, url: 'javascript:alert(1)' }],
      ['ftp: の URL', { ...validSpot, url: 'ftp://example.com/' }],
      ['URL として解釈できない', { ...validSpot, url: 'example.com' }],
      ['id が文字列', { ...validSpot, id: '1' }],
      ['id が 0', { ...validSpot, id: 0 }],
      ['id が負数', { ...validSpot, id: -1 }],
      ['id が小数', { ...validSpot, id: 1.5 }],
      ['price が負数', { ...validSpot, price: -1 }],
      ['price が小数', { ...validSpot, price: 980.5 }],
      ['price が文字列', { ...validSpot, price: '950' }],
    ])('%s', (_label, spot) => {
      const { spots, warn } = validateOne(spot)
      expect(spots).toHaveLength(0)
      expect(warn).toHaveBeenCalledOnce()
    })
  })

  it('不正な spot があっても他の spot は残す', () => {
    const warn = vi.fn()
    const result = validateSpotData(
      {
        center,
        spots: [validSpot, { ...validSpot, id: 2, category: 'bar' }, { ...validSpot, id: 3 }],
      },
      warn,
    )
    expect(result.ok && result.data.spots.map((s) => s.id)).toEqual([1, 3])
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]?.[0]).toContain('spots[1]')
  })

  it('id が重複する spot は 2 件目以降をスキップする', () => {
    const warn = vi.fn()
    const result = validateSpotData(
      {
        center,
        spots: [
          validSpot,
          { ...validSpot, name: '重複 1' },
          { ...validSpot, id: 2 },
          { ...validSpot, name: '重複 2' },
        ],
      },
      warn,
    )
    expect(result.ok && result.data.spots.map((s) => [s.id, s.name])).toEqual([
      [1, 'らーめん一番'],
      [2, 'らーめん一番'],
    ])
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('不正な spot の後に同じ id の正しい spot があれば、そちらを採用する', () => {
    const result = validateSpotData(
      {
        center,
        spots: [
          { ...validSpot, price: -1 },
          { ...validSpot, name: '正しい方' },
        ],
      },
      vi.fn(),
    )
    expect(result.ok && result.data.spots.map((s) => s.name)).toEqual(['正しい方'])
  })

  describe('center が不正ならエラー', () => {
    it.each([
      ['データ全体が null', null],
      ['データ全体が配列', [center]],
      ['center の欠落', { spots: [] }],
      ['center.name が空', { center: { ...center, name: '' }, spots: [] }],
      ['center.lat の欠落', { center: { name: 'x', lng: 139.6 }, spots: [] }],
      ['center.lng が範囲外', { center: { ...center, lng: 181 }, spots: [] }],
      ['center.lat が NaN', { center: { ...center, lat: Number.NaN }, spots: [] }],
    ])('%s', (_label, input) => {
      expect(validateSpotData(input, vi.fn())).toEqual({ ok: false, reason: 'center' })
    })
  })

  it.each([
    ['spots の欠落', { center }],
    ['spots がオブジェクト', { center, spots: {} }],
  ])('%s ならエラー', (_label, input) => {
    expect(validateSpotData(input, vi.fn())).toEqual({ ok: false, reason: 'spots' })
  })

  it('spots が空配列なら center だけのデータとして通す', () => {
    expect(validateSpotData({ center, spots: [] }, vi.fn())).toEqual({
      ok: true,
      data: { center, spots: [] },
    })
  })

  it('サンプルデータは警告なしで全件通る', async () => {
    const text = await readFile(
      new URL('../../public/data/restaurants.json', import.meta.url),
      'utf8',
    )
    const warn = vi.fn()
    const result = validateSpotData(JSON.parse(text) as unknown, warn)
    expect(result.ok && result.data.spots).toHaveLength(11)
    expect(warn).not.toHaveBeenCalled()
  })
})
