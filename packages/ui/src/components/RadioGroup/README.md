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

- 選中時外圈變 `accent`，中間出現 10 px 圓點（彈出動畫）。
- 整列可點，高度 40 px。

## 細節

- 外圈 22 px 圓形，2 px `line-strong` 邊框。
- `role="radiogroup"`，每個選項 `role="radio"`。方向鍵移到上一個或下一個選項；按住 Alt、⌘（Meta）或 Ctrl 時不處理，留給瀏覽器。
