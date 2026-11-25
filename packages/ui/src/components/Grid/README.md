# Grid

## 用法

頁面內容的排版：`Page` 把區塊上下排開，`Grid` 把卡片排成等寬的欄，或依比例排成主要內容加側欄。不要自己寫 CSS grid。

```tsx
<Page>
  <Grid columns={[2, 1]}>
    <Page>
      <Card title="訂單內容">…</Card>
      <Card title="出貨紀錄">…</Card>
    </Page>
    <Card title="摘要">…</Card>
  </Grid>
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
- 主要內容加側欄（詳細頁的內容和摘要）：`<Grid columns={[2, 1]}>`，第一張卡片是主要內容；寬度小於 960 px 時變成一欄，側欄排到下方。各欄靠上對齊，不拉成一樣高。
- 一欄放好幾張卡片：把那一欄的卡片包在 `<Page>` 裡當成一格；在 Grid 裡的 Page 卡片間距自動是 24 px（手機 16 px），和欄距相同。不要用 Page 以外的元素自己排間距。
- 同一排卡片的高度：等寬的 Grid 一排拉成一樣高（`height="fill"` 的圖表撐滿剩下的高度），比例 Grid 靠上；要反過來時給 `align="stretch"` 或 `align="start"`。
- 沒有 12 欄或跨欄：等寬用數字，不等寬用比例。
- `Grid`：卡片之間 24 px（`space-6`），手機 16 px。`columns` 是 1280 px 以上的欄數（1、2、3、4、6），較窄時：

| 寬度 | `columns={1}` | `2` | `3`（預設） | `4` | `6` |
| --- | --- | --- | --- | --- | --- |
| 1280 px 以上 | 1 欄 | 2 欄 | 3 欄 | 4 欄 | 6 欄 |
| 960–1279 px | 1 欄 | 2 欄 | 3 欄 | 2 欄 | 3 欄 |
| 600–959 px | 1 欄 | 2 欄 | 2 欄 | 2 欄 | 2 欄 |
| 600 px 以下 | 1 欄 | 1 欄 | 1 欄 | 1 欄 | 1 欄 |

`columns` 給比例（`[2, 1]`、`[3, 1]`、`[1, 2, 1]`）時：960 px 以上照比例，以下一欄。
