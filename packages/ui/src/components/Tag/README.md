# Tag

說明一個項目「是什麼」的分類標籤，例如「編譯器」、「外部」、「規則：經由指標」。

- 只有小字：12 px、粗體、`ink-muted`，沒有框也沒有底色。
- 一律灰色，不用顏色區分類別；要表示進度或結果（完成、失敗、要確認）用 Badge。
- 兩個例外說明數字的來源，加圖示和顏色，沒有底色；字級跟著旁邊的文字（放在品牌旁就和品牌一樣大），半粗：
  - `variant="forecast"`：預測、非實測的值，趨勢線圖示，`accent-text` 色。放在預測值旁邊，或疊了斜線紋理（class `ui-forecast`）的區塊裡。
  - `variant="demo"`：整頁都是示範值，資訊圖示，`warning-text` 色。放在頂列品牌旁，一頁一個。

```js
h(UI.Tag, null, '編譯器');
```

```js
h(UI.Tag, { variant: 'forecast' }, '預測');
h(UI.Tag, { variant: 'demo' }, '示範資料');
```
