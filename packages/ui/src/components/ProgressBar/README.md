# ProgressBar

## 用法

進度條，用於知道進度的工作（例如上傳）。不知道要多久時用 LoadingBar；達成率用 ProgressRing。

```tsx
<ProgressBar value={64} label="上傳 report.pdf" />
```

- 高度 8 px，軌道 `surface-sub`，填色 `accent`。
- 百分比寫在條的下方，Geist Mono；完成時改寫「完成 ✓」，用一般字體。
- 不放進 DataTable 的格子：表格列裡的進度寫成文字（「匯入中 42%」），放在欄位的 `secondary`（標題下的第二行）。
- 強制色彩模式（Windows 高對比）：軌道加 1 px `CanvasText` 外框，填色用 `Highlight`，條不會消失。
- 到 100% 時條變 `success`，文字變「完成 ✓」。
