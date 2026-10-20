# PROCESS.md — 実装プロセス

仕様は [CLAUDE.md](CLAUDE.md)、ビジュアルは [design/](design/) を参照。各ステップ完了後に `npm run lint` と `npm run test` を通すこと。

- [x] 環境構築（Vue 3）：Node.js Active LTS を確認し `.nvmrc` / `engines.node` に記載、`npm create vite@latest -- --template vue-ts`、`npm outdated` で最新確認
- [x] 環境構築（その他パッケージ）：maplibre-gl、lucide-vue-next、vitest、ESLint（flat config）/ Prettier 一式、npm scripts（dev / build / test / lint）、`.env.example`
- [x] 実装：型定義（`types/spot.ts`）・文言（`locales/ja.ts`）・デザイントークン（`styles/tokens.css`）・フォント読み込み
- [x] 実装：サンプルデータ（`public/data/restaurants.json`）
- [ ] 実装：`lib/validate.ts` ＋ テスト
- [ ] 実装：`lib/filter.ts` ＋ テスト
- [ ] 実装：`lib/pick.ts` ＋ テスト
- [ ] 実装：`lib/geo.ts`・`lib/format.ts`（Haversine、価格・距離・時間の表示整形）＋ テスト
- [ ] 実装：`useSpots`（読み込み・ローディング・エラー）
- [ ] 実装：`useFilters`（絞り込み状態・件数）
- [ ] 実装：`useRoute`（OSRM 呼び出し・5 秒タイムアウト・フォールバック・キャッシュ）＋ テスト
- [ ] 実装：`App.vue` レイアウト（ヘッダー、2 カラム／1 カラム、ローディング／エラー表示）
- [ ] 実装：`MapView`（地図初期化・name:ja・初回 fitBounds・中心／店舗マーカー・凡例・ズームボタン・アトリビューション）
- [ ] 実装：マーカーのポップアップ（店名・価格・URL）
- [ ] 実装：`FilterToggle` / `FilterPanel`（件数表示・0 件メッセージ・Random Pick! ボタン・SP 下部固定バー）
- [ ] 実装：Random Pick! の抽選処理とマーカーのハイライト
- [ ] 実装：`PickModal`（PC ダイアログ／SP ボトムシート・店舗情報・もう一回！）
- [ ] 実装：`RouteMap`（ミニ地図・ルート描画・fitBounds・ローディング・フォールバック表示）
- [ ] 実装：モーダルのアクセシビリティ（フォーカストラップ・Esc／背景クリックで閉じる・フォーカス復帰）
- [ ] 仕上げ：レスポンシブ／タッチターゲット／コントラスト／reduced-motion の確認、lint・test・build 通過
