# LoginCard

## 用法

登入頁：頁面底色（`bg`）上置中的卡片，只有帳號密碼登入。

```tsx
<LoginCard
  logo={<img src="/logo.svg" alt="" />}
  brand="專案中心"
  onSubmit={({ account, password }) => login(account, password)}
  error={failed ? { password: '帳號或密碼不正確，請再試一次。' } : null}
  forgotHref="/forgot"
  loading={loading}
/>
```

- 錯誤寫在各欄位下方：空著送出顯示「請輸入帳號／請輸入密碼」；帳密錯誤時把 `error.password` 設成「帳號或密碼不正確，請再試一次。」。
- 「忘記密碼」放在密碼標籤右邊（`forgotHref`）；連結不用問句。
- 送出時有錯：焦點移到第一個有錯的欄位，欄位用 `aria-describedby` 念出它的錯誤，一次一則，不會兩個 `role="alert"` 同時插話。`error` 從登入檢查回來時，焦點也移到那個欄位。
- `logo` 放產品標誌（32 px 高），在 `brand` 名稱左邊。
- `error` 的兩句話裡反引號包住的文字顯示成行內程式碼（InlineCode），不顯示反引號。

## 細節

- 整頁是 `<main>`，最小高度 100dvh，卡片上下左右置中；深色主題下卡片（`surface`）比頁面（`bg`）亮，層次和淺色一致。
- 密碼欄右邊有眼睛按鈕「顯示密碼」，名稱不變，只用 `aria-pressed` 表示是否已顯示。
- `loading` 時登入按鈕轉圈、按了不送出，焦點留在按鈕上。
- 按 Enter 也會送出。
