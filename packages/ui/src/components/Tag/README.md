# Tag

說明一個項目「是什麼」的分類標籤，例如「編譯器」、「外部」、「規則：經由指標」。

- 只有小字：12 px、粗體、`ink-muted`，沒有框也沒有底色。
- 一律灰色，不用顏色區分類別；要表示進度或結果（完成、失敗、要確認）用 Badge。
- 兩個例外說明數字的來源，有底色：
  - `variant="forecast"`：預測、非實測的值，`accent-soft` 底、`accent-text` 字，高 22 px。放在預測值旁邊，或疊了斜線紋理（class `ui-forecast`）的區塊裡。
  - `variant="demo"`：整頁都是示範值，`warning-soft` 底、`warning-text` 13 px 粗體字，高 24 px。放在頂列品牌旁，一頁一個。
- 放在名稱後面，同一列可以有多個。

```js
h(UI.Tag, null, '編譯器');
```

```js
h(UI.Tag, { variant: 'forecast' }, '預測');
h(UI.Tag, { variant: 'demo' }, '示範資料');
```

