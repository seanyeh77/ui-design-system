# Tag

## 用法

說明一個項目「是什麼」的分類標籤，例如「外部」、「範本」、「規則：經由指標」。要表示進度或結果（完成、失敗、要確認）用 Badge。

```tsx
<Tag>外部</Tag>
<Tag variant="forecast">預測</Tag>
<Tag variant="demo">示範資料</Tag>
```

- 只有小字：12 px、粗體、`ink-muted`，沒有框也沒有底色；一律灰色，不用顏色區分類別。
- 標籤只標例外：大部分項目都一樣的屬性不標。名詞需要說明時在 Tag 裡包 `Term`。
- `variant="forecast"`、`variant="demo"` 說明數字的來源（見下方）。

## 數字的來源

兩個例外加圖示和顏色，沒有底色；字級跟著旁邊的文字（放在品牌旁就和品牌一樣大），半粗：

- `variant="forecast"`：預測、非實測的值，趨勢線圖示，`accent-text` 色。放在預測值旁邊，或疊了斜線紋理（class `ui-forecast`）的區塊裡。
- `variant="demo"`：整頁都是示範值，資訊圖示，顏色和旁邊的文字相同。放在頂列品牌旁，一頁一個。
