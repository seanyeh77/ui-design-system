# DateRangePicker

## 用法

日期範圍：一個月曆加上左側的快捷範圍。單一日期用 DatePicker。

```tsx
const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);

<DateRangePicker label="期間" value={range} onChange={setRange} />;
```

- `value` 是 `[開始, 結束]`，沒選時是 `[null, null]`；按「清除」時 `onChange([null, null])`。
- 和其他欄位一樣有 `hint`、`error`、`required`、`disabled`、`name`（送出 `2026-11-01/2026-11-07`）；`label` 必填。
- 日曆圖示在右邊，和 DatePicker、Select 的箭頭同一側。按鈕的名稱是標籤加上畫面上的日期文字，語音操作說出看到的字就找得到。
- 快捷：今天、最近 7 天、最近 30 天、本月、上個月。
- 在月曆上先點開始日、再點結束日；中間的日期用強調淺底連起來。
- 手機上（寬度小於 600 px）日期格 48 px，快捷移到月曆上方。

## 細節

- 樣式和 DatePicker 相同：圓角方塊、今天下方圓點、週日開始。
