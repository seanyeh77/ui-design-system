# Grid

頁面內容的排版：`Page` 把區塊上下排開，`Grid` 把卡片排成等寬的欄。不要自己寫 CSS grid。

- `Page`：區塊之間 32 px（`space-8`）。
- `Grid`：卡片之間 24 px（`space-6`），手機 16 px。`columns` 是 1280 px 以上的欄數（1、2、3、4、6）；1280 px 以下 4 欄變 2 欄、6 欄變 3 欄；960 px 以下最多 2 欄；手機一欄。

```tsx
<Page>
  <Grid columns={4}>
    <KpiCard label="本月營收" value={12840000} format="money" />
    <KpiCard label="進行中專案" value={18} unit="個" />
  </Grid>
  <Card title="專案" padding={false}>
    <DataTable columns={columns} rows={rows} />
  </Card>
</Page>
```
