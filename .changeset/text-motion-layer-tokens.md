---
'@seanyeh77/ui': minor
'@seanyeh77/tokens': minor
---

新增字級（`--text-*`，12 px 到 49 px，Tailwind 的 `text-*` 帶行高）、動畫時間（`--dur-*`）、動畫曲線（`--ease-*`）和層級（`--z-*`）token，`styles.css` 的字級、動畫時間、曲線和 z-index 全部改用這些 token，數值不變；最小字級是 12 px，原本 9 px 和 11 px 的手機分頁列文字、通知數字、排序順序、副檔名標籤和層級數字改成 12 px。文字對比在 `surface-sub`、`surface-chrome` 和 `accent-soft` 上也達 4.5:1：深色 `accent-text`、`danger-text`、`info-text` 稍微調亮，淺色 `warning-text` 稍微調暗，`setAccent` 換算自訂強調色的文字色時也檢查這些底色。`pnpm test` 會檢查 `styles.css` 沒有寫死已有 token 的字級、時間和層級。
