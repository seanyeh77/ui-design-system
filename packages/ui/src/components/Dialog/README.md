# Dialog

## 用法

需要使用者決定時跳出的視窗，置中顯示。刪除這類動作通常不用自己開 Dialog：Button、Menu、DangerZone 給 `confirm` 就會跳出這個框。編輯一筆資料用 Drawer。

```tsx
<Dialog open={open} onOpenChange={setOpen} title="發布 v2.4.1？" confirmLabel="發布" onConfirm={publish} confirmLoading={publishing}>
  發布後使用者會立刻看到新版本。
</Dialog>
```

- 一定要給 `open` 和 `onOpenChange`（或只給 `defaultOpen`，讓它自己關），不要用 `{show && <Dialog …>}` 控制顯示。只要畫出框本身（文件和預覽用）時給 `modal={false}`；都沒寫時開發模式在主控台警告。舊的 `onClose` 還能用一個版本。
- `onOpenChange(open, reason)` 的 `reason` 說明怎麼關的：`'escape'`、`'outside'`、`'close'`（×）、`'cancel'`。
- 標題寫要決定的事，可以是問句：「刪除 api-gateway？」。內容最多兩句：會發生什麼、能不能復原。
- 按鈕：給 `confirmLabel` 和 `onConfirm`，會自動排好「取消」（次要，左）和確認按鈕（主要，右）；要自己排按鈕時給 `actions`。兩組只能擇一，寫在一起時型別檢查不會過。
- `tone="danger"`：確認按鈕是紅色，框是 `role="alertdialog"`，打開時焦點在「取消」（安全的選項），點背景不會關閉。
- 內容是字串時，反引號包住的文字顯示成行內程式碼（InlineCode），不顯示反引號。

## 細節

- 寬 400 px，背景 20% 黑色加模糊。
- 焦點鎖在框內，打開時在第一個按鈕（不是 ×）；Esc、點背景（`danger` 除外）、右上角 × 都會關閉，關閉後焦點回到原本的按鈕。
- 內文用 `aria-describedby` 連到框，打開時和標題一起念出。
- `confirmLoading` 時確認按鈕轉圈、按了不執行，焦點留在按鈕上。
