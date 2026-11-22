# ProgressRing

## 用法

達成率圓環，放在卡片裡顯示「完成多少」。進行中的工作用 ProgressBar。

```tsx
<ProgressRing value={72} label="本季目標" />
```

- 中間放百分比（等寬字）；旁邊可以寫實際數量，例如「72 / 100 個專案」。
- 預設 72 px，線寬 8 px，軌道 `surface-sub`，填色 `accent`，端點圓頭。
- 進場時和數字一起從 0 跑到目標值。
