# Drawer

## 用法

側邊抽屜：從右邊滑出的編輯面板，用來編輯一筆資料而不離開列表。只要使用者決定一件事用 Dialog；少量設定用 Popover。

```tsx
<Drawer open={open} dirty={dirty} onOpenChange={(o) => !o && close()} title="編輯專案"
  actions={(requestClose) => (
    <>
      <Button onClick={requestClose}>取消</Button>
      <Button variant="primary" onClick={save}>儲存</Button>
    </>
  )}>
  …
</Drawer>
```

- 按鈕固定在底部：次要（取消）在左、主要（儲存）在右；內容太長時只有中間捲動。
- 開關用 `open` 和 `onOpenChange(open, reason)`；舊的 `onClose` 還能用一個版本。
- 有未儲存的修改（`dirty`）時關閉，抽屜底部換成「放棄未儲存的變更？」和「繼續編輯」「放棄」（紅色）兩顆按鈕，焦點先在「繼續編輯」；問題出現在抽屜裡，不是蓋在整個列表頁中間。
- 底部的「取消」也要先確認：`actions` 寫成函式，拿到的 `requestClose` 和 × 走同一個確認。

## 細節

- 寬 400 px（和對話框同寬），滿版高度，底色 `surface`。
- 背景：模糊遮罩，和對話框一致；點遮罩、按 Esc 或右上角 × 關閉。
- 滑入：彈性滑入，450 ms，滑過頭一點再彈回；關閉時 300 ms 滑出。減少動態效果時只淡入淡出。
- 打開時焦點移到第一個欄位，關閉後回到打開它的按鈕；按「繼續編輯」後焦點回到問題出現前的位置。
- `description`：標題下一句灰字說明，打開時和標題一起念出（`aria-describedby`）。表單本身不當成描述，否則一打開就把所有欄位念一遍。
- 抽屜裡的 FormGrid 自動維持單欄（它看自己的寬度，不看視窗）。
- `side="left"`：從左邊滑出，用在由左上角選單按鈕打開的導覽（AppShell 在 600 到 1024 px）。
