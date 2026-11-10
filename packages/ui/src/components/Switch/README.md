# Switch

開關，用於立即生效的設定。

- Material 3 樣式：52 × 32 px，2 px 邊框。
- 圓鈕：關 16 px 灰色帶叉、開 24 px 白色帶勾、按住時 28 px。
- 滑動用水滴動畫（與導覽相同的 `MOTION`）。
- `label` 必填，作為 `aria-label`；畫面上的文字放在開關旁邊。元件不畫文字，所以要讓點文字也能切換，把文字和開關包在同一個 `<label>` 裡（`<label><Switch … /><span>外部函式</span></label>`）；文字放在另一個 `div` 時點文字不會切換。
