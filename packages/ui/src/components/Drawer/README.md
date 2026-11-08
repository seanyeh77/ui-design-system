# Drawer

側邊抽屜：從右邊滑出的編輯面板，用來編輯一筆資料而不離開列表。

- 寬 400 px（和對話框同寬），滿版高度，底色 `surface`。
- 背景：模糊遮罩，和對話框一致；點遮罩、按 Esc 或右上角 × 關閉。
- 滑入：彈性滑入，450 ms，滑過頭一點再彈回；關閉時 300 ms 滑出。減少動態效果時只淡入淡出。
- 按鈕固定在底部：次要（取消）在左、主要（儲存）在右；內容太長時只有中間捲動。
- 有未儲存的修改（`dirty`）時關閉，先跳「放棄未儲存的變更？」，按鈕是「繼續編輯」和紅色「放棄」。
- 底部的「取消」也要先確認：`actions` 寫成函式，拿到的 `requestClose` 和 × 走同一個確認。

```tsx
<Drawer open={open} dirty={dirty} onClose={close} title="編輯專案"
  actions={(requestClose) => (
    <>
      <Button onClick={requestClose}>取消</Button>
      <Button variant="primary" onClick={save}>儲存</Button>
    </>
  )}>
```

- 打開時焦點移到第一個欄位，關閉後回到打開它的按鈕。
- `side="left"`：從左邊滑出，用在由左上角選單按鈕打開的導覽（AppShell 在 600 到 1024 px）。
