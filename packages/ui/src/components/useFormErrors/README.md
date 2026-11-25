# useFormErrors

## 用法

表單錯誤的 hook：欄位離開（blur）時和送出時才顯示錯誤，值一改對就消失，送出時焦點移到第一個有錯的欄位。只有一兩個欄位的簡單表單也可以自己管 `error`；欄位多時用這個。

```tsx
const [values, setValues] = useState({ name: '', email: '' });
const form = useFormErrors(values, (v) => ({
  name: v.name.trim() ? undefined : '名稱不能空白，請輸入專案名稱。',
  email: /.+@.+/.test(v.email) ? undefined : 'Email 格式不正確，例如 name@example.com',
}));

<form onSubmit={form.submit(save)} noValidate>
  <TextField label="名稱" name="name" required value={values.name} onChange={(name) => setValues({ ...values, name })}
    onBlur={() => form.onBlur('name')} error={form.errors.name} />
  <TextField label="Email" name="email" value={values.email} onChange={(email) => setValues({ ...values, email })}
    onBlur={() => form.onBlur('email')} error={form.errors.email} />
  <Button variant="primary" type="submit">儲存</Button>
</form>;
```

- 每個欄位都要給 `name`，和 `validate` 回傳的 key 相同：送出時靠它找到第一個有錯的欄位並移過去。Select、DatePicker 這類選擇器也用 `name`，焦點會移到它看得見的控制項。
- `validate` 每個欄位回傳一句「原因加修正方式」，沒問題時回傳 `undefined`。
- 不要在 `onChange` 裡自己設錯誤：打字到一半（「2026/1」）還不算錯。
- 存檔後要清掉「已離開、已送出」的紀錄時呼叫 `form.reset()`。
- 送出按鈕不要因為有錯而停用：停用的按鈕不能告訴使用者哪裡錯。

## 細節

- 回傳 `{ errors, touched, onBlur, submit, reset }`。`errors` 只有該顯示的錯誤；`touched` 是離開過的欄位。
- `submit(handler)` 回傳事件處理函式：沒有錯時呼叫 `handler(values)`；有錯時全部顯示，下一個畫面更新後把焦點移到頁面順序中第一個有錯的欄位，欄位用 `aria-describedby` 念出它的錯誤。
- 規則的來源：`docs/forms.md` 的錯誤訊息一節。
