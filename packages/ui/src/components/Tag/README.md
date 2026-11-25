# Tag

## 用法

說明一個項目「是什麼」的分類標籤，例如「外部」、「範本」、「規則：經由指標」。要表示進度或結果（完成、失敗、要確認）用 Badge。

```tsx
<Tag>外部</Tag>
<Tag icon="trend-up" tone="info">預測</Tag>
<Tag icon="info">示範資料</Tag>
```

- 只有小字：12 px、粗體、`ink-muted`，沒有框也沒有底色；一律灰色，不用顏色區分類別。
- 標籤只標例外：大部分項目都一樣的屬性不標。名詞需要說明時在 Tag 裡包 `Term`。
- 加 `icon` 時用來說明數字的來源（見下方）。`variant="forecast"`、`variant="demo"` 已停用，換成 `icon` 加 `tone`。

## 數字的來源

加 `icon` 後是圖示加文字，沒有底色；字級跟著旁邊的文字（放在品牌旁就和品牌一樣大），半粗。沒有 `tone` 時顏色和旁邊的文字相同。

- 預測、非實測的值：`icon="trend-up" tone="info"`「預測」，`accent-text` 色。放在預測值旁邊，或疊了斜線紋理（class `ui-forecast`）的區塊裡。
- 整頁都是示範值：`icon="info"`「示範資料」。放在頁面標題旁：AppShell 或 ConsoleLayout 的 `tags`（頂列標題旁），一頁一個。
- `tone` 其他值（`success`、`warning`、`danger`）只給這類來源標示用；分類一律灰色。

| 舊寫法 | 新寫法 |
| --- | --- |
| `variant="forecast"` | `icon="trend-up" tone="info"` |
| `variant="demo"` | `icon="info"` |
