# DetailList

## 用法

一個項目的詳細欄位，例如選取的函式、訂單、使用者：名稱在左、值在右，窄時名稱在上、值在下。

```tsx
<DetailList
  items={[
    { label: '訂單編號', value: <InlineCode>ORD-1024</InlineCode> },
    { label: '狀態', value: <Badge status="doing">出貨中</Badge> },
    { label: '負責人', value: '王小明' },
  ]}
/>
```

- 依照元件本身的寬度切換：600 px 以上名稱在左（13 px 次要文字，不換行）、值在右；比較窄時名稱在上、值在下，全部靠左，和手機表格卡片一致。
- 值可以放任何元素：`InlineCode` 連結、`Tag`、`Badge`。
- 寬面板（例如 1300 px 的側邊面板）：設 `labelWidth="auto"` 與 `labelSize="body"`。

## 細節

- 寬面板設定時，左欄寬度依最長的名稱（最多 40%），每列對齊，名稱和值隔 24 px；名稱改成和值同字級（16 px）、ink 色。600 px 以下仍是名稱在上、值在下，名稱 13 px。

| Prop         | 說明                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| `labelWidth` | 左欄寬度。預設 30%（至少 96 px）；`'auto'` 依最長的名稱；數字是固定 px。 |
| `labelSize`  | `'small'`（預設）13 px 次要色；`'body'` 與值同字級、ink 色。             |
