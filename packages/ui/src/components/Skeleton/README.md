# Skeleton

## 用法

資料載入中時顯示的骨架，用 `line` 色的條（在 `surface` 上約 1.33:1，淺色和深色都看得見）。不知道要多久的整頁工作用 LoadingBar。

```tsx
{loading ? <Skeleton height={48} /> : <DataTable … />}
```

- 開始載入就立即顯示（延遲 0 ms）。
- 一道較淡的光帶每 1.2 s 掃過一次；系統設定減少動態時不掃，只留靜止的條。強制色彩模式加 1 px `GrayText` 外框。
