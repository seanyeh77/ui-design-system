# Dialog

需要使用者決定時跳出的視窗，置中顯示。

- 寬 400 px，背景 20% 黑色加模糊。
- 給 `open` 和 `onClose`：焦點鎖在框內，Esc、點背景、右上角 × 都會關閉，關閉後焦點回到原本的按鈕。沒有 `open` 時只畫出框本身（文件和預覽用）。
- 標題寫要決定的事，可以是問句：「刪除 api-gateway？」。內容最多兩句：會發生什麼、能不能復原。
- 按鈕：給 `confirmLabel` 和 `onConfirm`，會自動排好「取消」（次要，左）和確認按鈕（右）；`tone="danger"` 時確認按鈕是紅色。要自己排按鈕時給 `actions`。
- 刪除這類動作通常不用自己開 Dialog：Button、Menu、DangerZone 給 `confirm` 就會跳出這個框。

```tsx
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="發布 v2.4.1？"
  confirmLabel="發布"
  onConfirm={publish}
  confirmLoading={publishing}
>
  發布後使用者會立刻看到新版本。
</Dialog>
```
