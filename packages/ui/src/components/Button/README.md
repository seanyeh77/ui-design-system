# Button

## 用法

按鈕觸發一個動作。只有圖示時用 IconButton；卡片底部的一組操作用 ActionBar；一列的更多操作用 Menu。

```tsx
<Button variant="primary" icon="plus" onClick={add}>新增</Button>
<Button>取消</Button>
<Button variant="quiet" icon="download-simple">匯出</Button>
<Button variant="danger" confirm={{ title: '刪除 api-gateway？', body: '設定和紀錄會一起刪除，無法復原。' }} onClick={remove}>
  刪除
</Button>
```

- 層級：`primary` 實心，每個區塊（一張卡片、一個表單）最多一個；`secondary`（預設）外框；`quiet` 無框，給次要的動作和工具列。
- `danger`：實心 `danger`，用在刪除等無法復原的動作。一定要確認：給 `confirm={{ title, body }}`，按下時先跳出 Dialog，按 Dialog 裡的紅色按鈕才執行 `onClick`；放在確認框裡的那顆按鈕本身改給 `confirmed`。兩者都沒給時型別檢查不會過。
- 按鈕文字只用動詞，例如「儲存」、「刪除」，不寫「確定」。
- `loading` 顯示轉圈，按了不執行（`aria-disabled` 加 `aria-busy`，不設 `disabled`），焦點留在按鈕上；文字改成進行式（「儲存中」）。

## 細節

- 按鈕在有焦點時被停用（例如按下後變成不能再按），焦點會移到同一組裡前一個控制項，不會掉到頁面最上面。
- 狀態：滑過變深（`accent-hover`）、按下下移 1 px（`accent-press`）、停用為 `surface-sub` 灰底加 `ink-muted` 灰字（`quiet` 也一樣）；停用的 `primary` 保留淡淡的 `accent-soft` 底色，看得出它是主要動作，字一樣是 `ink-muted`（4.5:1）。
- 四種樣式高度、圓角與焦點外框（2 px `focus`，離按鈕 2 px）都相同。
- 高度 `control-height` 40 px；觸控點擊範圍 `touch-target` 48 px（按鈕外觀不變，外圍擴大可點範圍）。
- `icon`：Phosphor 圖示名稱（例如 `'plus'`，拼錯時型別檢查不會過），或自訂圖示的 24 px path（`'M4 12h16'`）。
