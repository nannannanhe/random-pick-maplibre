import type { SpotCategory } from '../types/spot'

// 画面上の日本語文言はすべてここに集約する
export const ja = {
  app: {
    title: '周辺ランチマップ',
    // タイトルは「ランチ」のみ色を変えるため分割して持つ
    titleParts: { before: '周辺', accent: 'ランチ', after: 'マップ' },
    centerChip: (name: string) => `中心：${name}`,
    loading: '読み込み中…',
    errorLoad: 'お店のデータを読み込めませんでした。時間をおいて再読み込みしてください。',
    errorCenter: '中心地点のデータが正しくありません。データファイルを確認してください。',
  },
  category: {
    restaurant: 'レストラン',
    cafe: 'カフェ',
    convenience: 'コンビニ',
  } satisfies Record<SpotCategory, string>,
  map: {
    ariaLabel: '地図',
    zoomIn: '拡大',
    zoomOut: '縮小',
    legendAriaLabel: '凡例',
    legendCenter: '中心',
    popupLink: 'お店のページ',
  },
  price: {
    unknown: '価格不明',
  },
  filter: {
    ariaLabel: 'フィルター',
    eyebrow: 'FILTER',
    heading: 'しぼりこみ',
    visibleLabel: '表示中',
    totalSuffix: (total: number) => `/ ${total} 件`,
    count: (n: number) => `${n}件`,
    showConvenience: {
      label: 'コンビニを表示',
      sub: 'おにぎり・お弁当でサクッと',
    },
    showOver1000: {
      label: '1,000円超えのお店を表示',
      sub: 'ちょっと贅沢なランチも候補に',
    },
    showCafe: {
      label: 'カフェを表示',
      sub: '軽めのランチや休憩に',
    },
    empty: '条件に合うお店がありません',
  },
  pick: {
    button: 'Random Pick!',
    hint: '表示中のお店から 1 軒ランダムにえらびます',
  },
  modal: {
    badge: '今日のランチはここ！',
    close: '閉じる',
    routeLabel: (from: string, to: string) => `${from} → ${to}`,
    routeLoading: 'ルートを計算中…',
    walk: '徒歩',
    distance: '距離',
    minutes: (n: number) => `約 ${n} 分`,
    // SP のチップ：徒歩 約N分・Nm（距離は format 済みの文字列を受け取る）
    walkChip: (minutes: number, distance: string) => `徒歩 約${minutes}分・${distance}`,
    calculating: '計算中…',
    fallback: '直線距離（参考）',
    openPage: 'お店のページを開く',
    again: 'もう一回！',
    note: '※ ルート・所要時間は徒歩の目安です',
  },
  // データ検証の警告（console.warn 用）
  validate: {
    skipped: (index: number, id: unknown, reason: string) =>
      `spots[${index}]（id: ${JSON.stringify(id) ?? 'なし'}）をスキップしました：${reason}`,
    reasons: {
      notObject: 'オブジェクトではありません',
      id: 'id が 1 以上の整数ではありません',
      name: 'name が空、または文字列ではありません',
      category: 'category は restaurant / cafe / convenience のいずれかにしてください',
      price: 'price が 0 以上の整数または null ではありません',
      latLng: 'lat / lng が正しい緯度・経度ではありません',
      url: 'url が http(s) の URL ではありません',
      duplicate: 'id が重複しています',
    },
  },
} as const
