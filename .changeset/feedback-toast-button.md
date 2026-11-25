---
'@seanyeh77/ui': minor
---

回饋與按鈕：

- 新增 `toast(message, { tone, action, id })`、`<Toaster />` 與 `useToast()`（Base UI Toast）：右下角（手機在底部分頁列上方）疊放，一直存在的 live region 念出新訊息。一般訊息 3 s 後消失；有動作的（例如「復原」）停留 10 s，滑鼠或焦點在訊息上時暫停，`undo: true` 時按 Ctrl Z（⌘Z）也能復原。`<Toast>` 仍可單獨畫出卡片，新增 `tone`。改法：頁面裡自己管 toast 文字和 `setTimeout` 的，改成在 app 放一個 `<Toaster />`，需要時呼叫 `toast('已儲存')`。
- `Button` 的 `loading` 改用 `aria-disabled` 加 `aria-busy`，不再設 `disabled`：焦點留在按鈕上，載入中按了不執行也不送出表單。檢查 `button.disabled` 的測試改看 `aria-disabled`。
- `Button` 與 `IconButton` 在有焦點時被停用，焦點移到同一組裡前一個控制項，不會掉到 `<body>`（例如 TimeControl 的「回到現在」）。
- 停用的 primary 按鈕保留淡淡的 `accent-soft` 底色。
- `ErrorPage` 的大號錯誤碼改用 Inter 的等寬數字（tabular-nums）。
