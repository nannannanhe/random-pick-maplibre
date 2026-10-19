# CLAUDE.md — 周辺ランチマップ

## プロジェクト概要

JSON で指定した「中心地点」を基準に、周辺の飲食店を地図上に表示するシングルページ Web アプリ。
チェックボックスで絞り込みができ、「Random Pick!」で現在の絞り込み結果からランダムに 1 軒を選ぶ。
選ばれたお店は、モーダルで「中心地点 → お店」のルートとお店の URL を表示する。

- **UI 言語：日本語**（画面上の文言、aria-label、エラーメッセージはすべて日本語）
- コードコメント・コミットメッセージ：日本語
- 現時点ではバックエンドなし。データソースは静的 JSON

## 技術スタック

| 項目              | 採用技術                                                                         |
| ----------------- | -------------------------------------------------------------------------------- |
| Build             | Vite                                                                             |
| Framework         | Vue 3（`<script setup lang="ts">`、Composition API）                             |
| Language          | TypeScript（`strict: true`、`any` 禁止）                                         |
| Map               | MapLibre GL JS（`maplibre-gl`）                                                  |
| Map style         | OpenFreeMap `https://tiles.openfreemap.org/styles/liberty`（API キー不要）       |
| Routing           | OSRM 互換 API（デフォルト `https://routing.openstreetmap.de/routed-foot`、徒歩） |
| Icon              | `lucide-vue-next`                                                                |
| Test              | Vitest                                                                           |
| Lint / 型チェック | `vue-tsc --noEmit`、ESLint + Prettier                                            |

確認なしに依存パッケージを追加しないこと（特に UI フレームワーク、状態管理ライブラリ、CSS フレームワーク）。
状態管理は composables で行い、Pinia は使わない。

## バージョン方針（最新版を使う）

**パッケージやランタイムを導入・追加する前に、必ずその時点の最新版を確認すること。** 記憶や学習データ上のバージョンを前提にしない。

- **Node.js**：その時点の **Active LTS** を使う（Current 版は使わない）。
  - 確認方法：`curl -s https://nodejs.org/dist/index.json | jq -r '[.[] | select(.lts != false)][0] | "\(.version) (\(.lts))"'`
  - 確認したバージョンを `.nvmrc` と `package.json` の `engines.node` に記載する。
- **npm パッケージ**：導入前に `npm view <pkg> dist-tags` で `latest` を確認し、その版を入れる（`npm install <pkg>@latest`）。
  - `next` / `beta` / `rc` / `canary` などのプレリリース版は使わない。
  - 複数パッケージをまとめて確認する場合：`for p in vue vite typescript maplibre-gl lucide-vue-next vitest vue-tsc eslint prettier; do echo "$p: $(npm view $p version)"; done`
- **プロジェクトの雛形作成**：`npm create vite@latest` を使い、生成された `package.json` の各バージョンも `npm outdated` で最新か確認する。
- **互換性**：最新版同士で peer dependency の衝突が出た場合は、`--force` / `--legacy-peer-deps` で無理に入れず、原因と選択肢をユーザーに報告して判断を仰ぐ。
- **メジャーバージョンアップ**：既存パッケージのメジャー更新は、変更点（CHANGELOG / 移行ガイド）を確認してから行い、影響範囲をユーザーに伝える。
- **記録**：導入・更新したパッケージとバージョンは `package-lock.json` をコミットして固定する。このファイル（CLAUDE.md）には具体的なバージョン番号を書かない（すぐ古くなるため）。

## コマンド

```bash
npm run dev        # 開発サーバー
npm run build      # vue-tsc + vite build
npm run test       # vitest run
npm run lint       # eslint + vue-tsc --noEmit
```

変更後は最低限 `npm run lint` と `npm run test` を実行すること。

## ディレクトリ構成

```
public/
  data/restaurants.json      # 中心地点と店舗データ
src/
  main.ts
  App.vue                    # レイアウト（2カラム/1カラム）はここでのみ決める
  components/
    MapView.vue              # メイン地図（中心地点マーカー + 店舗マーカー）
    FilterPanel.vue          # チェックボックス群 + Random Pick! ボタン
    FilterToggle.vue         # チェックボックス 1 行（アイコン + ラベル + 件数）
    PickModal.vue            # 抽選結果モーダル（ルート地図 + 店舗情報）
    RouteMap.vue             # モーダル内のミニ地図。ルートを描画
  composables/
    useSpots.ts              # JSON の読み込みとバリデーション
    useFilters.ts            # 絞り込み状態と絞り込み後リスト
    useRoute.ts              # ルーティング API 呼び出し。失敗時はフォールバック
  lib/
    filter.ts                # 純粋関数：applyFilters()
    pick.ts                  # 純粋関数：pickRandom()
    validate.ts              # JSON スキーマ検証
  types/spot.ts
  locales/ja.ts              # 日本語文言はすべてここに集約
  styles/tokens.css          # デザイントークン（色・フォント・角丸・影）
```

## データ形式（`public/data/restaurants.json`）

```jsonc
{
  "center": {
    "name": "オフィス",
    "lat": 35.4429,
    "lng": 139.638,
  },
  "spots": [
    {
      "id": "ramen-001", // 一意・URL-safe
      "name": "らーめん一番",
      "category": "restaurant", // "restaurant" | "cafe" | "convenience"
      "price": 950, // 1 人あたりの予算（円・整数）。不明な場合は null
      "lat": 35.4441,
      "lng": 139.6402,
      "url": "https://example.com/ramen",
    },
  ],
}
```

```ts
// src/types/spot.ts
export type SpotCategory = "restaurant" | "cafe" | "convenience";
export interface LatLng {
  lat: number;
  lng: number;
}
export interface Center extends LatLng {
  name: string;
}
export interface Spot extends LatLng {
  id: string;
  name: string;
  category: SpotCategory;
  price: number | null;
  url: string;
}
export interface SpotData {
  center: Center;
  spots: Spot[];
}
```

- 読み込み時に `lib/validate.ts` で検証する。不正な spot はスキップして `console.warn` を出し、アプリ全体は落とさない。
- `url` は `http:` / `https:` のみ許可。

## 絞り込みルール（`lib/filter.ts`、ユニットテスト必須）

チェックボックスは 3 つ。**初期状態はすべてチェック済み（＝すべて表示）**。チェックを外すと該当店舗を非表示にする。

| key               | ラベル                  | チェックを外したときに非表示にする条件                                    |
| ----------------- | ----------------------- | ------------------------------------------------------------------------- |
| `showConvenience` | コンビニを表示          | `category === 'convenience'`                                              |
| `showOver1000`    | 1,000円超えのお店を表示 | `price !== null && price > 1000`（ちょうど 1,000 円は「超え」に含めない） |
| `showCafe`        | カフェを表示            | `category === 'cafe'`                                                     |

- 条件は OR で非表示：外したいずれかの条件に該当すれば非表示。
- `price === null` の店舗は価格フィルターの対象外。
- 各チェックボックスの横に該当件数を表示し、パネル上部に「表示中 N 件」を表示する。

## Random Pick!

- **現在の絞り込み後リスト**からのみ抽選する（`lib/pick.ts`。テスト用に `rng` を注入可能にする）。
- 対象が 0 件のときはボタンを `disabled` にし、下に「条件に合うお店がありません」を表示する。
- 連続で抽選する場合、候補が 2 件以上あれば直前と同じ店は避ける。
- 抽選後：メイン地図上の該当マーカーをハイライトし、`PickModal` を開く。

## PickModal

- 表示内容：店名、カテゴリ、価格、中心地点からの徒歩距離・所要時間、ルートのミニ地図、「お店のページを開く」ボタン（`target="_blank" rel="noopener noreferrer"`）、「もう一回！」ボタン。
- ルート：`useRoute` で `{base}/route/v1/foot/{lng},{lat};{lng},{lat}?overview=full&geometries=geojson` を呼ぶ。
  - ルーティングのベース URL は `import.meta.env.VITE_ROUTING_BASE_URL`。デフォルト値は上記。
  - 失敗・タイムアウト（5 秒）時は直線＋ Haversine による直線距離にフォールバックし、モーダル内に「直線距離（参考）」と表示する。
  - `fromId-toId` をキーにメモリキャッシュする。
- ミニ地図はルート範囲に `fitBounds`（padding 32px）。
- アクセシビリティ：`role="dialog"`、`aria-modal="true"`、フォーカストラップ、`Esc` と背景クリックで閉じる、閉じた後は Random Pick! ボタンにフォーカスを戻す。

## 地図

- メイン地図は `center` を中心に、表示中の全 spots を含むよう `fitBounds` する。
- マーカーは HTML マーカー（Vue で Lucide アイコンを描画）：
  - 中心地点：`MapPin`、メインカラー、大きめ
  - restaurant：`UtensilsCrossed`／cafe：`Coffee`／convenience：`Store`
- 地名ラベルは `name:ja` を優先する。
- マーカークリックでポップアップ（店名・価格・URL リンク）を表示する。
- コンポーネントの unmount 時は必ず `map.remove()` を呼び、WebGL コンテキストのリークを防ぐ。
- MapLibre のインスタンスは `ref()` / `reactive()` に入れない（`shallowRef` か通常の変数を使う）。

## レイアウト

- ブレークポイント：`1024px`
  - **1024px 以上（PC）**：2 カラム。左＝地図（可変幅、高さ `100dvh - header`）、右＝絞り込みパネル（固定 `380px`、スクロール可）。
  - **1024px 未満（Tablet/SP）**：1 カラム。上＝地図（高さ `min(55dvh, 480px)`）、下＝絞り込みパネル。SP では Random Pick! ボタンを画面下部に sticky 表示する。
- レイアウト切り替えは CSS（grid + media query）のみで行い、JS で画面幅を判定しない。
- タッチターゲットは最小 44×44px。

## デザイントークン（`styles/tokens.css`）

明るい背景＋青〜紫系のポップな文字色。色はすべて CSS 変数経由で使い、コンポーネント内にカラーコードを直書きしない。

```css
:root {
  --bg: #f6f5ff; /* ほんのりラベンダーがかった白 */
  --surface: #ffffff;
  --surface-2: #eef0ff;
  --ink: #1e1b4b; /* メイン文字色：濃いインディゴ */
  --ink-muted: #5b5a86;
  --primary: #4f5bff; /* エレクトリックブルー */
  --accent: #8a4bff; /* ビビッドパープル（#9B5CFF は白文字とのコントラスト不足のため濃くした） */
  --pop: #ff6fb5; /* 差し色（抽選ハイライト）、少量のみ */
  --grad-pop: linear-gradient(135deg, #4f5bff 0%, #8a4bff 100%);
  --teal: #0f8a7e; /* コンビニのマーカー */
  --danger-bg: #ffe8f3; /* 0 件時のメッセージ */
  --danger-ink: #9e1f5c;
  --border: #dcddf7;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --shadow-pop: 0 4px 0 #1e1b4b; /* ボタンの「ステッカー風」ハードシャドウ */
  --shadow-card: 0 8px 24px rgb(79 91 255 / 0.12);
  --font-display: "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", sans-serif;
  --font-body: "Noto Sans JP", "Hiragino Sans", sans-serif;
}
```

- 見出し・ボタンは `--font-display`（太さ 800）、本文は `--font-body`。
- 文字のコントラストは WCAG AA を満たすこと（`--ink-muted` は補助テキストにのみ使用）。
- `prefers-reduced-motion` を尊重し、抽選アニメーションを無効化する。
- ビジュアル表現：濃いインディゴの 2.5px 太枠＋下方向のハードシャドウ（ステッカー風）、角丸 16〜24px。マーカーはカテゴリ別に色分け（restaurant=primary／cafe=accent／convenience=teal）。抽選されたマーカーは `--pop` に変えて拡大し、店名ラベルを表示する。
- UI デザイン（Design キャンバス）をビジュアルの正とする。実装で迷ったらデザインに従う。

## コーディング規約

- コンポーネントの props / emits は必ず TS の型で宣言する（`defineProps<...>()`）。
- ビジネスロジック（絞り込み、抽選、バリデーション、距離計算）は `lib/` の純粋関数にし、コンポーネントは表示のみを担当する。
- 日本語の文言はコンポーネントに直書きせず、`locales/ja.ts` から import する。
- 金額表示：`new Intl.NumberFormat('ja-JP').format(price) + '円'`。null の場合は「価格不明」。
- API キーをコミットしない。外部 URL は `.env` で管理する（`.env.example` も用意する）。

## テスト観点

- `applyFilters`：各チェックボックスの組み合わせ、`price === 1000` の境界値、`price === null`。
- `pickRandom`：空配列、1 件のみ、直前と同じ店を避ける。
- `validate`：必須項目の欠落、不正な category、http(s) 以外の URL。
