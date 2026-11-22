# FormGrid

## 用法

表單欄位排列：寬度 960 px（`bp-desktop`）以上雙欄，以下單欄。

```tsx
<FormGrid>
  <TextField label="名稱" required />
  <Select label="環境" options={envs} value={env} onChange={setEnv} />
  <TextArea className="is-full" label="說明" value={note} onChange={setNote} />
</FormGrid>
```

- 需要整行的欄位（例如多行輸入）加 `className="is-full"` 跨滿兩欄。
- 標籤一律在欄位上方。
