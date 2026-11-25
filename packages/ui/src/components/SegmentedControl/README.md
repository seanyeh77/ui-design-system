# SegmentedControl

## 用法

分段控制：同一份內容的兩三種顯示方式之間切換，例如 Markdown 檔案的「預覽／原始碼」。高 40 px，和工具列上其他控制項一樣高，觸控裝置 48 px；在 Workbench 的 `mainBar`（36 px）裡縮成 28 px。內容不同的幾個檢視用 `Tabs`。

```tsx
const [mode, setMode] = useState<'preview' | 'source'>('preview');

<SegmentedControl
  label="顯示方式"
  iconOnly
  value={mode}
  onChange={setMode}
  options={[
    { value: 'preview', label: '預覽', icon: 'eye' },
    { value: 'source', label: '原始碼', icon: 'file-code' },
  ]}
/>;
```

- `iconOnly`：只顯示圖示，文字放在滑過時的提示裡，也是螢幕閱讀器念的名稱。放在列上時用這個。
- `label` 是整組的名稱（例如「顯示方式」）。
- 選項用 `options: { value, label, icon }[]`，和 Select、RadioGroup 相同。
- 用來「選一個值」（例如篩選狀態），不要用一排 primary／secondary 按鈕表示選中。

## 細節

- 外觀：`surface-sub` 底的圓角框，選中的一段是白色（`surface`）的凸起小塊，加 1 px `line-strong` 框（達到 3:1），切換時小塊滑過去（和 Tabs 的指示器同樣的動畫，300 ms）。
- `iconOnly` 每段 34 × 34 px，選中的圖示變實心、`ink` 色，和文字版一樣靠白色小塊與 `line-strong` 外框表示選中。不加 `iconOnly`：顯示圖示（有的話）和文字，15 px（`text-control`）。
- 觸控裝置上整組高 48 px；只有圖示時每段寬 42 px。
- 鍵盤：整組一個 Tab 停留點，← → 移動並選取（和 RadioGroup、ThemePicker、AccentPicker 共用同一套按鍵處理）。
- 無障礙：`role="radiogroup"`，每段是 `role="radio"`、`aria-checked`。
