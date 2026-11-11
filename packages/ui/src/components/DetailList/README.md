# DetailList

一個項目的詳細欄位，例如選取的函式、訂單、使用者。

- 寬度 600 px 以上：欄位名稱在左（13 px 次要文字，不換行）、值在右。
- 比較窄時：名稱在上、值在下，全部靠左，和手機表格卡片一致。依照元件本身的寬度切換。
- 值可以放任何元素：`UI.InlineCode` 連結、`UI.Tag`、`UI.Badge`。
- 寬面板（例如 1300 px 的側邊面板）：設 `labelWidth: 'auto'` 與 `labelSize: 'body'`。左欄寬度依最長的名稱（最多 40%），每列對齊，名稱和值隔 24 px；名稱改成和值同字級（16 px）、ink 色。600 px 以下仍是名稱在上、值在下，名稱 13 px。

| Prop         | 說明                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| `labelWidth` | 左欄寬度。預設 30%（至少 96 px）；`'auto'` 依最長的名稱；數字是固定 px。 |
| `labelSize`  | `'small'`（預設）13 px 次要色；`'body'` 與值同字級、ink 色。             |

```js
h(UI.DetailList, {
  items: [
    { label: '定義', value: h(UI.InlineCode, { href: '/code/ops.c#L55' }, 'src/libibtrace/hooks/ops.c:55') },
    { label: '元件', value: 'src/libibtrace' },
    { label: '關係', value: '1 個 caller · 呼叫 4 個函式' },
  ],
});
```
