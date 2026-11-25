# Toast

## 用法

操作完成後的短暫提示：呼叫 `toast()`，訊息出現在畫面右下角（手機在下方中間、底部分頁列上方）。要一直顯示的提示用 Alert。

```tsx
// AppShell 已經放好 Toaster；沒有 AppShell 的頁面在 app 的最外層放一次
<Toaster />

toast('已儲存變更');
toast('已刪除 3 筆', { action: { label: '復原', undo: true, onAction: restore } });
toast('儲存失敗：網路中斷，請稍後再試', { tone: 'danger' });
```

- 頁面不自己管 toast 的 state 和計時器：`toast()` 負責顯示、排隊、計時和念出。AppShell 自動放一個 Toaster；頁面自己放了 `<Toaster />` 時改用頁面的，同一則訊息不會出現兩次。
- 時間：一般訊息 3 s 後消失；有動作（例如「復原」）的訊息停留 10 s，滑鼠移到訊息上或焦點在訊息裡時暫停計時（WCAG 2.2.1）。
- 「復原」加 `undo: true`：訊息顯示時按 Ctrl Z（Mac 是 ⌘Z）也會執行，按鈕上寫出這個按鍵；焦點在輸入框裡時 Ctrl Z 仍是輸入框的復原。
- 文字寫發生了什麼，用過去式：「已刪除 3 筆」。
- `tone`：預設 `success`（打勾）；`neutral`、`info`、`warning`、`danger`。`danger` 立即念出（`role="alert"`），用在操作失敗；失敗的原因和修正方式寫進訊息。
- 同一件事連續發生（每次輸入都存檔）時給相同的 `id`：只留一則，重新計時。

## 細節

- `<Toaster />` 是一直存在的 polite live region（`role="region"`，名稱「通知」），新訊息加進去時螢幕閱讀器會念出；F6 把焦點移到訊息上，Shift Tab 回到原處。
- 多則訊息由下往上疊，最新的在最下面；每則都有 ×（「關閉通知」）。
- `useToast()` 回傳 `{ toast, close }`，在元件裡用；`toast.close(id)` 關掉一則，不給 id 時全部關掉。
- `<Toast>` 只畫出卡片本身（`role="status"`），給文件、預覽或自訂位置用；一般頁面用 `toast()`。
- 卡片樣式：`surface` 底色、`line` 細框、`shadow-overlay` 陰影，最小高度 48 px，文字 `text-compact`。
