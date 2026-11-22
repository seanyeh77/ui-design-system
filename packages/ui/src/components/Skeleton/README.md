# Skeleton

## 用法

資料載入中時顯示的骨架，用 `surface-sub` 底色。不知道要多久的整頁工作用 LoadingBar。

```tsx
{loading ? <Skeleton height={48} /> : <DataTable … />}
```

- 開始載入就立即顯示（延遲 0 ms）。
