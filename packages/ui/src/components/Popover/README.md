# Popover

## 用法

彈出框：按鈕旁邊浮出的小面板，放篩選條件、說明或少量設定。內容要用完整表單或很多欄位時改用 Drawer；只有短文字時用 Tooltip。

```tsx
<Popover label="篩選" icon="funnel" count={2} unit="個條件">
  {(close) => <FilterForm onDone={close} />}
</Popover>
```

- 滑過按鈕就打開，滑鼠移到面板上會保持打開；移開 150 ms 後關閉。點擊或用鍵盤 focus 按鈕也能打開，觸控裝置靠點擊。
- 點外面或按 Esc 關閉，右上角不放 ×。
- `count` 是數字（0 不顯示），`unit` 是螢幕閱讀器在數字後面念的單位。
- 要從外面控制開關時給 `open` 和 `onOpenChange(open, reason)`；只決定一開始是否打開用 `defaultOpen`。
- 有指向按鈕的箭頭；預設在按鈕下方、右緣對齊，放不下時換邊。

## 細節

- 白底（`surface`）、`radius-lg`、`shadow-overlay`，出現時淡入 150 ms。
