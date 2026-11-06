# DetailList

一個項目的詳細欄位，例如選取的函式、訂單、使用者。

- 寬度 600 px 以上：欄位名稱在左（13 px 次要文字，不換行）、值在右。
- 比較窄時：名稱在上、值在下，全部靠左，和手機表格卡片一致。依照元件本身的寬度切換。
- 值可以放任何元素：`UI.InlineCode` 連結、`UI.Tag`、`UI.Badge`。

```js
h(UI.DetailList, { items: [
  { label: '定義', value: h(UI.InlineCode, { href: '/code/ops.c#L55' }, 'src/libibtrace/hooks/ops.c:55') },
  { label: '元件', value: 'src/libibtrace' },
  { label: '關係', value: '1 個 caller · 呼叫 4 個函式' }
] })
```
