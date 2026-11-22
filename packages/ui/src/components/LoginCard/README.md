# LoginCard

## 用法

登入頁：淺灰底上置中的白色卡片，只有帳號密碼登入。

```tsx
<LoginCard
  brand="專案中心"
  onSubmit={({ account, password }) => login(account, password)}
  error={failed ? { password: '帳號或密碼不正確，請再試一次。' } : null}
  forgotHref="/forgot"
  loading={loading}
/>
```

- 錯誤寫在各欄位下方：空著送出顯示「請輸入帳號／請輸入密碼」；帳密錯誤時把 `error.password` 設成「帳號或密碼不正確，請再試一次。」。
- 「忘記密碼？」放在密碼標籤右邊（`forgotHref`）。

## 細節

- 密碼欄右邊有眼睛按鈕可以顯示密碼。
- 按 Enter 也會送出。
