# Button

按鈕觸發一個動作。

- `primary`：實心 `accent`。每個區塊（例如一張卡片、一個表單）最多一個主要按鈕。
- `secondary`（預設）：外框 `line-strong`。
- `danger`：實心 `danger`，用在刪除等無法復原的動作。頁面上就是實心紅色，按下後一定先跳出 Dialog 確認，確認框裡的刪除按鈕同樣是實心紅色。
- 狀態：滑過變深（`accent-hover`）、按下下移 1 px（`accent-press`）、停用為 `surface-sub` 灰底加 `ink-muted` 灰字、`loading` 顯示轉圈並停用，文字改成進行式（「儲存中」）。
- 高度 `control-height` 40 px；觸控點擊範圍 `touch-target` 48 px（按鈕外觀不變，外圍擴大可點範圍）。
- 按鈕文字只用動詞，例如「儲存」、「刪除」。
- `icon` 可以給 Phosphor 圖示名稱（例如 `'file-text'`），也可以給 SVG path。
