# Switch

## 用法

開關，用於立即生效的設定；其他勾選用 Checkbox。

```tsx
<label>
  <Switch checked={notify} onChange={setNotify} label="部署失敗時通知" />
  <span>部署失敗時通知</span>
</label>
```

- `label` 必填，作為 `aria-label`；畫面上的文字放在開關旁邊，在 `<label>` 裡時自動是 15 px（`text-control`）。
- 受控用 `checked` 加 `onChange(checked, event)`；非受控用 `defaultChecked`。給 `name` 時打開的開關隨表單送出 `on`。
- 元件不畫文字：要讓點文字也能切換，把文字和開關包在同一個 `<label>` 裡；文字放在另一個 `div` 時點文字不會切換。

## 細節

- Material 3 樣式：52 × 32 px，2 px 邊框。
- 圓鈕：關 16 px 灰色帶叉、開 24 px 白色帶勾、按住時 28 px。
- 滑動用水滴動畫（與導覽相同的 `MOTION`）。
- 強制色彩模式（Windows 高對比）：軌道和圓鈕改用系統色，開是 Highlight，圓鈕不會消失。
