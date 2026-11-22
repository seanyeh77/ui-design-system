# Calendar

## 用法

固定顯示在頁面上的月曆，例如排程頁的側欄。要選日期時用 DatePicker 或 DateRangePicker（它們的下拉日曆也是 Calendar）。

```tsx
const [day, setDay] = useState<Date | null>(null);

<Card>
  <Calendar focus={day} onPick={setDay} dayState={(d) => ({ selected: d.toDateString() === day?.toDateString() })} />
</Card>;
```

- 每一天的樣子由 `dayState` 決定：`selected`、`inRange`、`start`、`end`、`disabled`。
- 點日期呼叫 `onPick`；`focus` 是一開始顯示的月份。

## 細節

- 一週的第一天依語系決定；選中的日期是強調色圓角方塊，今天下方有一個小圓點。
- 鍵盤：日曆裡只有一天在 Tab 順序（選中的日期，沒有時是今天）；← → 前後一天、↑ ↓ 前後一週、Home／End 到這一週的第一天／最後一天、PageUp／PageDown 上下個月，跨月時自動換頁；不能選的日期跳過。移到的日期也會呼叫 `onHover`，所以 DateRangePicker 用鍵盤也看得到範圍預覽。
