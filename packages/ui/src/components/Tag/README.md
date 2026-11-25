# Tag

## 用法

說明一個項目「是什麼」的分類標籤，例如「外部」、「範本」、「內部使用」。要表示進度或結果（完成、失敗、要確認）用 Badge。

```tsx
<Tag>外部</Tag>
<Tag icon="trend-up" tone="info">預測</Tag>
<Tag icon="info">示範資料</Tag>
```

- 沒有 `icon`：12 px、半粗、`ink-muted` 的小字，沒有框也沒有底色；一律灰色，不用顏色區分類別。
- 有 `icon`：字級和顏色跟著旁邊的文字（見下方「數字的來源」），只有 AppShell／TopBar 的 `tags` 例外：頂部列一律畫成 12 px `ink-muted` 小字，不會看起來像標題的一部分。
- 標籤只標例外：大部分項目都一樣的屬性不標。名詞需要說明時在 Tag 裡包 `Term`。
- 加 `icon` 時用來說明數字的來源（見下方）；`variant` 已停用。

## 數字的來源

加 `icon` 後是圖示加文字，沒有底色，半粗；字級跟著旁邊的文字（放在 KPI 數值旁就和數值的單位一起），沒有 `tone` 時顏色和旁邊的文字相同。放在 AppShell／TopBar 的 `tags` 時一律 12 px、`ink-muted`（有 `tone` 時用 tone 的顏色）；ConsoleLayout 頂列的 `tags` 和標題同字級、同顏色（使用者確認的監控畫面規則）。

- 預測、非實測的值：`icon="trend-up" tone="info"`「預測」，`accent-text` 色。放在預測值旁邊，或疊了斜線紋理（class `ui-forecast`）的區塊裡。
- 整頁都是示範值：`icon="info"`「示範資料」。放在頁面標題旁：AppShell 或 ConsoleLayout 的 `tags`（頂列標題旁），一頁一個。不要放進 `title` 字串，也不要自己加大或換色。
- `tone` 其他值（`success`、`warning`、`danger`）只給這類來源標示用；分類一律灰色。

