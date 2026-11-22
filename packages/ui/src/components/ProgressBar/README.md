# ProgressBar

## 用法

進度條，用於知道進度的工作（例如上傳）。不知道要多久時用 LoadingBar；達成率用 ProgressRing。

```tsx
<ProgressBar value={64} label="上傳 report.pdf" />
```

- 高度 8 px，軌道 `surface-sub`，填色 `accent`。
- 百分比寫在條的下方，Geist Mono；完成時改寫「完成 ✓」，用一般字體。在 DataTable 的列裡，完成的綠色條改用 `success-text`，選中的列（`accent-soft`）上也有 3:1。
- 到 100% 時條變 `success`，文字變「完成 ✓」。
