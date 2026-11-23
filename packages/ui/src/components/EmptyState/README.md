# EmptyState

## 用法

沒有資料時的畫面，用引導步驟告訴使用者怎麼開始。

```tsx
<EmptyState
  title="還沒有專案"
  description="建立第一個專案後，部署紀錄會出現在這裡。"
  steps={['連結 Git 儲存庫', '設定環境變數', '部署']}
  action={<Button onClick={create}>建立專案</Button>}
/>
```

- 步驟下方放一個次要按鈕（Button `secondary`），不用主要按鈕。
- 搜尋沒有結果時只顯示一句話：只傳 `title`，不傳 `description` 與 `steps`。
- 使用者要做的事寫在畫面上：步驟寫下一步怎麼開始。
- `description` 與 `steps` 裡反引號包住的文字顯示成行內程式碼（InlineCode），不顯示反引號。
