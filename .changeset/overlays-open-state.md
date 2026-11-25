---
'@seanyeh77/ui': minor
---

浮層的開關與確認：

- `Dialog`、`Drawer`、`Popover`、`Menu`、`CommandPalette`、`Tour` 都接受 `open`、`defaultOpen` 與 `onOpenChange(open, reason)`。`Dialog`、`Drawer`、`Tour` 的 `onClose` 仍可用一個版本，開發模式提醒。改法：`onClose={() => setOpen(false)}` 改成 `onOpenChange={setOpen}`；Tour 用 `useTour` 的 `tour.onOpenChange`，`reason` 是 `'done'` 或 `'skip'`。
- `Dialog` 的 props 改成聯集型別：`confirmLabel` 加 `onConfirm` 與 `actions` 只能擇一，`modal={false}` 的靜態面板不能同時給 `open`；寫錯組合時型別檢查不會過。`tone` 的 `'default'` 改名 `'neutral'`（舊名仍可用）。內文用 `aria-describedby` 連到框；`tone="danger"` 是 `role="alertdialog"`，焦點先到「取消」。測試裡找危險確認框的 `getByRole('dialog')` 要改成 `getByRole('alertdialog')`。
- `Drawer` 有未儲存的修改時，「放棄未儲存的變更？」出現在抽屜自己的底部，不再是蓋在頁面中間的對話框（測試裡改找 `getByRole('group', { name: '放棄未儲存的變更？' })`）。新增 `description`。
- `Popover` 的 `count` 只收數字（`count="2"` 改成 `count={2}`），新增 `unit`、`className`。
- Menu、Select、MultiSelect 與 DataTable 篩選面板的選項一律 40 px 高、文字 15 px。Tabs 整排高度改成 40 px。
- 新的型別 `OpenChangeReason`、`OpenStateProps`。
