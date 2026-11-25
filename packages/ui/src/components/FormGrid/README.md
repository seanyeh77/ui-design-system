# FormGrid

## 用法

表單欄位排列：FormGrid 自己寬 640 px 以上時雙欄，以下單欄；看的是它所在的位置（container query），不是視窗，所以放在 400 px 的 Drawer 裡一定是單欄。

```tsx
<FormGrid>
  <TextField label="名稱" required />
  <Select label="環境" options={envs} value={env} onChange={setEnv} />
  <TextArea className="is-full" label="說明" value={note} onChange={setNote} />
</FormGrid>
```

- 需要整行的欄位（例如多行輸入）加 `className="is-full"` 跨滿兩欄。
- 標籤一律在欄位上方。
- 每個欄位都填滿自己的欄寬，DatePicker 和 DateRangePicker 也一樣。
