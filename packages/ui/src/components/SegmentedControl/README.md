# SegmentedControl

同一份內容的兩三種顯示方式之間切換，例如 Markdown 檔案的「預覽／原始碼」。高 28 px，可以放進工具列或 Workbench 的 `mainBar`（36 px）。內容不同的幾個檢視用 `Tabs`。

- 外觀：`surface-sub` 底的圓角框，選中的一段是白色（`surface`）的凸起小塊，切換時小塊滑過去（和 Tabs 的指示器同樣的動畫，300 ms）。
- `iconOnly`：只顯示圖示，每段 28 × 24 px，選中的圖示變實心、強調文字色；文字放在滑過時的提示裡，也是螢幕閱讀器念的名稱。放在列上時用這個。
- 不加 `iconOnly`：顯示圖示（有的話）和文字，13 px。
- 鍵盤：整組一個 Tab 停留點，← → 移動並選取。
- 無障礙：`role="radiogroup"`，`label` 是整組的名稱（例如「顯示方式」），每段是 `role="radio"`、`aria-checked`。

```tsx
const [mode, setMode] = useState<'preview' | 'source'>('preview');

<Workbench
  mainBar={
    <SegmentedControl
      label="顯示方式"
      iconOnly
      value={mode}
      onChange={setMode}
      items={[
        { id: 'preview', label: '預覽', icon: 'eye' },
        { id: 'source', label: '原始碼', icon: 'file-code' },
      ]}
    />
  }
/>;
```
