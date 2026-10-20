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
- **プロジェクトの雛形作成**：`npm create vite@latest -- --template vue-ts` を使い、生成された `package.json` の各バージョンも `npm outdated` で最新か確認する。
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

- ESLint は flat config（`eslint-plugin-vue`、`typescript-eslint`、`eslint-config-prettier`）。
- テスト対象は `lib/` の純粋関数と `useSpots`・`useRoute`（`fetch` をモック）。DOM テストは行わないため jsdom は入れない。

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
    geo.ts                   # 純粋関数：haversine()、直線フォールバック用の距離・時間計算
    format.ts                # 純粋関数：価格・距離・時間の表示整形
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
      "id": 1, // 1 以上の整数・一意（サンプルデータは 1 からの連番）
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
  id: number;
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
- `id` は 1 以上の整数（`number`）。文字列の `"1"`、0 以下、小数は不正な spot として扱う。
- `id` が重複する spot は、2 件目以降をスキップして `console.warn`。
- `price` は 0 以上の整数または `null`。それ以外は不正な spot として扱う。
- JSON の取得失敗、または `center` が不正な場合は、アプリ全体にエラー表示を出す（文言は `locales/ja.ts`）。読み込み中は地図上にローディング表示を出す。
- サンプルデータ：デザインの架空 11 店舗（らーめん一番、定食屋 まるや、ビストロ・ソレイユ…）を `center` 周辺の実座標に配置する。URL は `https://example.com/...`。center の name はデザインに合わせ「本社オフィス」。

## 絞り込みルール（`lib/filter.ts`、ユニットテスト必須）

チェックボックスは 3 つ。**初期状態はすべてチェック済み（＝すべて表示）**。チェックを外すと該当店舗を非表示にする。

| key               | ラベル                  | チェックを外したときに非表示にする条件                                    |
| ----------------- | ----------------------- | ------------------------------------------------------------------------- |
| `showConvenience` | コンビニを表示          | `category === 'convenience'`                                              |
| `showOver1000`    | 1,000円超えのお店を表示 | `price !== null && price > 1000`（ちょうど 1,000 円は「超え」に含めない） |
| `showCafe`        | カフェを表示            | `category === 'cafe'`                                                     |

- 条件は OR で非表示：外したいずれかの条件に該当すれば非表示。
- `price === null` の店舗は価格フィルターの対象外。
- 各チェックボックスの横に該当件数を表示する。件数は**全 spots 中で条件に該当する数（固定値）**で、他のチェック状態には依存しない（例：1,100 円のカフェは「カフェ」と「1,000円超え」の両方に数える）。
- パネル上部に「表示中 N / M 件」（M = 全 spots 数）を表示する。
- 各チェックボックスのサブ文言（PC のみ表示）：コンビニ「おにぎり・お弁当でサクッと」／1,000円超え「ちょっと贅沢なランチも候補に」／カフェ「軽めのランチや休憩に」。
- チェックボックス行のアイコン地色：コンビニ=`--teal`／1,000円超え=`--pop`（`JapaneseYen` アイコン）／カフェ=`--accent`。OFF 時は `--icon-off`、枠は `--border`、ラベル色は `--ink-muted`。

## Random Pick!

- **現在の絞り込み後リスト**からのみ抽選する（`lib/pick.ts`。テスト用に `rng` を注入可能にする）。
- 対象が 0 件のときはボタンを `disabled` にし、下に「条件に合うお店がありません」を表示する。
- 連続で抽選する場合、候補が 2 件以上あれば直前と同じ店は避ける。
- 抽選後：メイン地図上の該当マーカーをハイライトし、`PickModal` を開く。
- **抽選アニメーション（ルーレット等）は行わない。** ボタン押下で即確定し、モーダルを開く。
- ハイライトはモーダルを閉じても次の抽選まで残す。絞り込みで該当店舗が非表示になったらハイライトを解除する。
- メイン地図にはルート線を描かない（ルートはモーダル内のミニ地図のみ。デザインのピンク点線は実装しない）。
- PC のみ、ボタンの下に補助文「表示中のお店から 1 軒ランダムにえらびます」を表示する。

## PickModal

- 表示内容：「今日のランチはここ！」バッジ、店名、カテゴリ、価格、中心地点からの徒歩距離・所要時間、ルートのミニ地図、URL テキストリンク、「お店のページを開く」ボタン（`target="_blank" rel="noopener noreferrer"`）、「もう一回！」ボタン、注記「※ ルート・所要時間は徒歩の目安です」。
- 形状：1024px 以上は画面中央のダイアログ（max-width 620px）、1024px 未満は下からのボトムシート（上部ハンドルは装飾のみ。スワイプで閉じる操作は実装しない）。切り替えは CSS のみ。
- 徒歩・距離：PC は 2 枚のカード（徒歩 約 N 分／距離 N m）、SP はチップ 1 つ（徒歩 約N分・Nm）。
- 「もう一回！」：モーダルを開いたまま、内容を新しい抽選結果に差し替える（直前と同じ店は避ける）。
- ルート取得中：ミニ地図上にローディング表示、距離・時間は「計算中…」。
- 所要時間：OSRM レスポンスの `duration`（秒）を分に換算し切り上げ。フォールバック時のみ直線距離 ÷ 80m/分（切り上げ）。
- 距離表示：10m 単位に丸める。1,000m 以上は `1.2 km` 形式（小数 1 桁）。
- ルート：`useRoute` で `{base}/route/v1/foot/{lng},{lat};{lng},{lat}?overview=full&geometries=geojson` を呼ぶ。
  - ルーティングのベース URL は `import.meta.env.VITE_ROUTING_BASE_URL`。デフォルト値は上記。
  - 失敗・タイムアウト（5 秒）時は直線＋ Haversine による直線距離にフォールバックし、モーダル内に「直線距離（参考）」と表示する。
  - `center-{spotId}` をキーにメモリキャッシュする（center には id がないため）。
- ミニ地図はルート範囲に `fitBounds`（padding 32px）。
- ミニ地図（`RouteMap`）：MapLibre、操作無効（`interactive: false`）。高さ PC 280px / SP 220px。ルート線は `--ink` 10px の上に `--primary` 6px を重ねた二重線。起点は小さいインディゴの点、終点は `--pop` の `MapPin` マーカー。左上に「{center.name} → {店名}」ラベル。アトリビューションは表示する。
- アクセシビリティ：`role="dialog"`、`aria-modal="true"`、フォーカストラップ、`Esc` と背景クリックで閉じる、閉じた後は Random Pick! ボタンにフォーカスを戻す。

## 地図

- メイン地図は**初回ロード時のみ**、`center` と全 spots を含むよう `fitBounds` する。絞り込み変更では地図を動かさない。
- マーカーは HTML マーカー（Vue で Lucide アイコンを描画）：
  - 中心地点：`MapPin`、`--ink` 地＋白縁＋`--primary` のリング、大きめ（PC 52px / SP 40px）。PC は下に名前ピル（`--primary` 地・白文字）を表示。
  - 店舗：白地＋カテゴリ色のアイコン＋インディゴ枠＋ハードシャドウ（PC 38px / SP 28px）。restaurant：`UtensilsCrossed`／cafe：`Coffee`／convenience：`Store`
  - 抽選済み：`--pop` 地＋`--ink` アイコンで拡大（PC 46px / SP 36px）、上に店名ラベル（`--ink` 地・白文字）。z-index を最前面に。
  - 状態変化は transition のみ。`prefers-reduced-motion` 時は transition もなし。
- 地名ラベルは `name:ja` を優先する。OpenFreeMap liberty の symbol レイヤーの `text-field` を `["coalesce", ["get", "name:ja"], ["get", "name"]]` に置き換える。
- 地図コントロール：
  - ズームボタン（拡大／縮小、44×44px）はデザインに合わせて自作し、右上に配置。**PC のみ表示**（SP はピンチ操作）。
  - 凡例（中心／レストラン／カフェ／コンビニ）は左下に**PC のみ表示**。
  - アトリビューションは MapLibre の `AttributionControl`（compact）を使い、CSS でデザインの見た目に寄せる。非表示にはしない。
- マーカークリックでポップアップ（店名・価格・URL リンク）を表示する。
- コンポーネントの unmount 時は必ず `map.remove()` を呼び、WebGL コンテキストのリークを防ぐ。
- MapLibre のインスタンスは `ref()` / `reactive()` に入れない（`shallowRef` か通常の変数を使う）。

## レイアウト

- ブレークポイント：`1024px`
  - **1024px 以上（PC）**：2 カラム（grid `1fr 380px`、外側 padding・gap 20px）。左＝地図（可変幅、高さ `100dvh - header - padding`）、右＝絞り込みパネル（固定 `380px`、スクロール可、Random Pick! ボタンはパネル下端）。
  - **1024px 未満（Tablet/SP）**：1 カラム（padding・gap 14px）。上＝地図（高さ `clamp(280px, 40dvh, 360px)`）、下＝絞り込みパネル。Tablet・SP とも Random Pick! ボタンを画面下部の固定バー（白地＋上枠線）に表示し、コンテンツ下部にバーの高さ分の余白を取る。
- Random Pick! ボタンの DOM は `FilterPanel` 内に 1 つだけ置き、位置の違いは CSS で表現する。
- 地図・パネルはカード表現（2.5px インディゴ枠＋ハードシャドウ、角丸 PC 24px / SP 20px）。
- ヘッダー：左にロゴアイコン（`MapPin`）＋タイトル「周辺<ランチ>マップ」（「ランチ」のみ `--accent`）、右に中心地点チップ（PC「中心：{center.name}」、SP は `{center.name}` のみ）。高さ PC 72px / SP 60px、下枠線 2.5px。
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
  --ink-2: #3b3a6b; /* 補助文字（ラベル・単位など）。AA 適合 */
  --primary-hover: #6a4dff; /* ボタン hover */
  --link-hover: #3a2fd6;
  --pop: #ff6fb5; /* 差し色（抽選ハイライト・フォーカスリング）、少量のみ */
  --teal: #0f8a7e; /* コンビニのマーカー */
  --danger-bg: #ffe8f3; /* 0 件時のメッセージ */
  --danger-ink: #9e1f5c;
  --border: #dcddf7;
  --map-bg: #e9ecfb; /* 地図読み込み前の背景 */
  --disabled-bg: #c9cbea; /* disabled ボタン */
  --icon-off: #b9bbd9; /* OFF 状態のフィルターアイコン地 */
  --overlay: rgb(30 27 75 / 0.55); /* モーダル背景 */
  --focus-ring: var(--pop); /* :focus-visible は 3px outline、offset 3px */
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
- フォントは Google Fonts（M PLUS Rounded 1c: 500/700/800、Noto Sans JP: 400/500/700）を `index.html` の `<link>` で読み込む（`@fontsource` などのパッケージは追加しない）。
- 文字のコントラストは WCAG AA を満たすこと（`--ink-muted` は補助テキストにのみ使用）。
- `prefers-reduced-motion` を尊重し、transition（ボタン押下・マーカー拡大）を無効化する。
- ボタン：primary ボタンは `--primary` 地・白文字・`--shadow-pop`、hover で `--primary-hover`、押下で `translateY(3px)`＋影を縮める。disabled は `--disabled-bg` 地・`--ink-muted` 文字・影なし。ゴーストボタンは白地＋インディゴ枠、hover で `--surface-2`。
- ビジュアル表現：濃いインディゴの 2.5px 太枠＋下方向のハードシャドウ（ステッカー風）、角丸 16〜24px。マーカーはカテゴリ別に色分け（restaurant=primary／cafe=accent／convenience=teal。アイコンの色として使い、地は白）。抽選されたマーカーは `--pop` に変えて拡大し、店名ラベルを表示する。
- UI デザインは `design/` にある（`Main.dc.html` = PC、`SP.dc.html` = Tablet/SP、`screenshots/` = 画像）。UI を実装・変更する前に必ず `design/README.md` と該当ファイルを読むこと。ビジュアルはデザインを正とし、ロジックは CLAUDE.md を正とする。
- デザインと CLAUDE.md で意図的に変えている点（CLAUDE.md を優先）：
  - メイン地図の抽選後ルート線（ピンク点線）は実装しない。
  - SP の地図高さは固定 320px ではなく `clamp(280px, 40dvh, 360px)`。
  - デザインの地図・ルート（白い道路の div、L 字線）はイメージ図。実装は MapLibre の実地図と OSRM のルート。
- `design/screenshots/SP — Random Pick! 結果.png` はメイン画面と同じ画像（エクスポート誤り）。SP のモーダルは `SP.dc.html` を参照する。

## コーディング規約

- コンポーネントの props / emits は必ず TS の型で宣言する（`defineProps<...>()`）。
- ビジネスロジック（絞り込み、抽選、バリデーション、距離計算）は `lib/` の純粋関数にし、コンポーネントは表示のみを担当する。
- 日本語の文言はコンポーネントに直書きせず、`locales/ja.ts` から import する。
- 金額表示：`'〜' + new Intl.NumberFormat('ja-JP').format(price) + '円'`（例：`〜1,600円`。予算の目安であることを示す）。null の場合は「価格不明」。
- API キーをコミットしない。外部 URL は `.env` で管理する（`.env.example` も用意する）。

## テスト観点

- `applyFilters`：各チェックボックスの組み合わせ、`price === 1000` の境界値、`price === null`。
- `pickRandom`：空配列、1 件のみ、直前と同じ店を避ける。
- `validate`：必須項目の欠落、不正な category、http(s) 以外の URL、id の不正値（文字列・0 以下・小数）、id 重複、price の不正値（負数・小数）、center 不正。
- `geo` / `format`：Haversine の既知距離、80m/分 の切り上げ、距離の 10m 丸めと km 表記の境界（999m / 1,000m）、価格 null。
- `useRoute`：OSRM 成功時の距離・時間、失敗とタイムアウト時のフォールバック、キャッシュヒット。
- `useSpots`：成功時の loading → data、不正 spot のスキップ、取得失敗（ネットワーク・HTTP エラー・JSON 不正）と spots 不正は errorLoad、center 不正は errorCenter、reload によるエラー解除、古いリクエストの結果で上書きしないこと。
