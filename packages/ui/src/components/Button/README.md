# Button

按鈕觸發一個動作。

- `primary`：實心 `accent`。每個區塊（例如一張卡片、一個表單）最多一個主要按鈕。
- `secondary`（預設）：外框 `line-strong`。
- `danger`：實心 `danger`，用在刪除等無法復原的動作。一定要確認：給 `confirm={{ title, body }}`，按下時先跳出 Dialog，按 Dialog 裡的紅色按鈕才執行 `onClick`；放在確認框裡的那顆按鈕本身改給 `confirmed`。兩者都沒給時型別檢查不會過。
- 狀態：滑過變深（`accent-hover`）、按下下移 1 px（`accent-press`）、停用為 `surface-sub` 灰底加 `ink-muted` 灰字、`loading` 顯示轉圈並停用，文字改成進行式（「儲存中」）。
- 高度 `control-height` 40 px；觸控點擊範圍 `touch-target` 48 px（按鈕外觀不變，外圍擴大可點範圍）。
- 按鈕文字只用動詞，例如「儲存」、「刪除」。
- `icon`：Phosphor 圖示名稱（例如 `'plus'`，拼錯時型別檢查不會過），或自訂圖示的 24 px path（`'M4 12h16'`）。

```tsx
<Button variant="primary" icon="plus" onClick={add}>新增</Button>
<Button variant="danger" confirm={{ title: '刪除 api-gateway？', body: '設定和紀錄會一起刪除，無法復原。' }} onClick={remove}>
  刪除
</Button>
```
