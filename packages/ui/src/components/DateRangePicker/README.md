# DateRangePicker

## 用法

日期範圍：一個月曆加上左側的快捷範圍。單一日期用 DatePicker。

```tsx
const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);

<DateRangePicker label="期間" value={range} onChange={setRange} />;
```

- 快捷：今天、最近 7 天、最近 30 天、本月、上個月。
- 在月曆上先點開始日、再點結束日；中間的日期用強調淺底連起來。
- 手機上（寬度小於 600 px）日期格 48 px，快捷移到月曆上方。

## 細節

- 樣式和 DatePicker 相同：圓角方塊、今天下方圓點、週日開始。
