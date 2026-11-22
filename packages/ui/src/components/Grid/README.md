# Grid

## 用法

頁面內容的排版：`Page` 把區塊上下排開，`Grid` 把卡片排成等寬的欄。不要自己寫 CSS grid。

```tsx
<Page>
  <Grid columns={4}>
    <KpiCard label="本月營收" value={12840000} format="money" />
    <KpiCard label="進行中專案" value={18} unit="個" />
  </Grid>
  <Card title="專案" padding={false}>
    <DataTable label="專案" columns={columns} rows={rows} />
  </Card>
</Page>
```

- `Page`：區塊之間 32 px（`space-8`）。
- `Grid`：卡片之間 24 px（`space-6`），手機 16 px。`columns` 是 1280 px 以上的欄數（1、2、3、4、6），較窄時：

| 寬度 | `columns={1}` | `2` | `3`（預設） | `4` | `6` |
| --- | --- | --- | --- | --- | --- |
| 1280 px 以上 | 1 欄 | 2 欄 | 3 欄 | 4 欄 | 6 欄 |
| 960–1279 px | 1 欄 | 2 欄 | 3 欄 | 2 欄 | 3 欄 |
| 600–959 px | 1 欄 | 2 欄 | 2 欄 | 2 欄 | 2 欄 |
| 600 px 以下 | 1 欄 | 1 欄 | 1 欄 | 1 欄 | 1 欄 |
