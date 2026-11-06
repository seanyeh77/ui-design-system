# Calendar

固定顯示在頁面上的月曆，DatePicker 和 DateRangePicker 的下拉日曆也是它。要選日期時用 DatePicker 或 DateRangePicker；只有日曆要一直顯示在頁面上（例如排程頁的側欄）才直接用 Calendar。

- 一週的第一天依語系決定；選中的日期是強調色圓角方塊，今天下方有一個小圓點。
- 每一天的樣子由 `dayState` 決定：`selected`、`inRange`、`start`、`end`、`disabled`。
- 點日期呼叫 `onPick`；`focus` 是一開始顯示的月份。

```tsx
const [day, setDay] = useState<Date | null>(null);

<Card>
  <Calendar focus={day} onPick={setDay} dayState={(d) => ({ selected: d.toDateString() === day?.toDateString() })} />
</Card>
```
