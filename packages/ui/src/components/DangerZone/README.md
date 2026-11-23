# DangerZone

## 用法

危險操作區塊：設定頁最下方的紅框區塊，放刪除帳號這類無法復原的操作。

```tsx
<DangerZone description="刪除後，所有專案和資料都無法復原。" actionLabel="刪除帳號" confirm={{ title: '刪除帳號？' }} onAction={deleteAccount} />
```

- 左邊一句說明後果，右邊紅色實心按鈕。
- `confirm` 是確認框的標題和說明，確認後才執行 `onAction`；沒給 `confirm` 時也先確認，標題是「<按鈕文字>？」。
- `description` 裡反引號包住的文字顯示成行內程式碼（InlineCode），不顯示反引號。

## 細節

- 紅色 1 px 外框，標題用 `danger-text`。
