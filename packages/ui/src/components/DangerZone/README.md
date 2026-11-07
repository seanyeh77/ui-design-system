# DangerZone

危險操作區塊：設定頁最下方的紅框區塊。

- 紅色 1 px 外框，標題用 `danger-text`。
- 左邊一句說明後果，右邊紅色實心按鈕；`confirm`（必填）是確認框的標題和說明，確認後才執行 `onAction`。

```tsx
<DangerZone description="刪除後，所有專案和資料都無法復原。" actionLabel="刪除帳號" confirm={{ title: '刪除帳號？' }} onAction={deleteAccount} />
```
