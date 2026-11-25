# RadioGroup

## 用法

單選群組，選項全部攤開在畫面上。選項多或不必一直顯示時用 Select。

```tsx
<RadioGroup
  label="部署方式"
  value={mode}
  onChange={setMode}
  options={[
    { value: 'rolling', label: '逐步更新' },
    { value: 'replace', label: '全部取代' },
  ]}
/>
```

- `label` 或 `aria-label` 一定要有一個（型別檢查）；`label` 顯示在選項上方並當作群組名稱。
- 受控用 `value` 加 `onChange(value, event)`；非受控用 `defaultValue`。給 `name` 時選中的值隨表單送出。
- 選中時外圈變 `accent`，中間出現 10 px 圓點（彈出動畫）。
- 圓圈加文字可點，寬度只到文字結束，焦點外框也只包住它們；高度 40 px。

## 細節

- 外圈 22 px 圓形，2 px `line-strong` 邊框。
- `role="radiogroup"`，每個選項 `role="radio"`。方向鍵移到上一個或下一個選項；按住 Alt、⌘（Meta）或 Ctrl 時不處理，留給瀏覽器。
