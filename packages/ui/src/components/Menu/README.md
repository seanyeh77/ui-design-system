# Menu

「⋯」選單：一列或一個項目的更多操作。

- 按鈕是無外框的「⋯」IconButton，打開時灰底。
- 選單預設在按鈕下方、右緣對齊；往左超出視窗時改成左緣對齊，下方放不下時改到上方。
- 每個選項：圖示、文字、右邊的鍵盤快捷鍵（等寬字）。
- 危險選項（`danger: true`）自動移到最後，前面加分隔線，紅字（`danger-text`）。一定要給 `confirm`：按下時先跳確認對話框，確認後才執行 `onSelect`。
- 打開動畫：從按鈕所在的角落放大，180 ms。
- 鍵盤：打開後焦點在第一個選項，↑ ↓ 移動，打字跳到開頭相符的選項，Esc 關閉並回到按鈕；點外面也會關閉。

```tsx
<Menu
  label="api-gateway 的更多操作"
  items={[
    { label: '重新命名', icon: 'pencil-simple', onSelect: rename },
    { label: '刪除', icon: 'trash', danger: true, confirm: { title: '刪除 api-gateway？' }, onSelect: remove },
  ]}
/>
```
