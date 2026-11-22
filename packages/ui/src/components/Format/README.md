# Format

## 用法

日期、時間、數字、金額的格式，以及介面文字的語系。所有元件都透過 `UI.format` 和 `UI.t` 輸出；頁面自己顯示的日期和數字也經過 `format`，不要自己拼字串。

```tsx
format.date(d); // 2026/11/04（三）
format.relative(d); // 2 小時前
format.money(1280); // NT$ 1,280
format.fileSize(57586237); // 54.9 MB
format.duration(2802); // 46:42
t('已選 {n} 筆', { n: 3 });
```

- 日期 `2026/11/04（三）`，年份一律顯示，加星期；時間 24 小時制；一週內用相對時間。
- 大數字只有 KPI 卡片縮寫；表格和明細寫完整數字。
- 有變數的句子用整句加佔位符，不要把句子拆開拼。
- 伺服器端只格式化時從 `@seanyeh77/ui/format` 匯入（沒有 `'use client'`）。

## 規則（zh-TW）

- 日期：`2026/11/04（三）`，年份一律顯示，加星期。`UI.format.date(d)`；不要星期時傳 `{ weekday: false }`。
- 時間：24 小時制 `15:57`。`UI.format.time(d)`、`UI.format.dateTime(d)`。
- 相對時間：一週內用「2 小時前」、「昨天」、「3 天前」；超過一週寫完整日期時間。`UI.format.relative(d)`。
- 大數字：只有 KPI 卡片縮寫，單位用萬、億（`1,284 萬`）；表格和明細寫完整數字。`UI.format.compact(v)`。
- 檔案大小：未滿 1 MB 寫整數 KB（「186 KB」），以上寫一位小數的 MB 或 GB（「54.9 MB」）。`UI.format.fileSize(bytes)`。
- 長度（影片、錄音、工作耗時）：未滿 1 小時寫 `46:42`、`1:30`（分鐘不補 0），1 小時以上寫 `1:54:49`；傳入秒數，四捨五入到秒；負數、`NaN` 或沒有值時寫「—」。`UI.format.duration(seconds)`。表格欄位用 `format: 'duration'`。
- 金額：`NT$ 1,280`，負數用減號 `-NT$ 1,280`。`UI.format.money(v)`。
- 小數位數依單位：金額 0 位、百分比 1 位、容量（GB、MB）1 位、數量 0 位。`UI.format.number(v, 'money' | 'percent' | 'size' | 'count')`。
- 分數和進度：畫面上寫「1 / 1 個」「6 / 6 筆」，`UI.format.fraction(n, total, unit?)`；螢幕閱讀器會把「/」念成「斜線」，所以同時給 `UI.format.fractionLabel(n, total, unit?)`，念「1 個中的 1 個」「6 筆中的 6 筆」（沒有單位時「5 中的 1」，英文「1 of 5」）。用法：顯示的文字加 `aria-hidden="true"`，旁邊放一個 `ui-visually-hidden` 的 `fractionLabel`；或整個元素用 `aria-label={fractionLabel(...)}`。

  ```tsx
  <span aria-hidden="true">{UI.format.fraction(1, 1, '個')}</span>
  <span className="ui-visually-hidden">{UI.format.fractionLabel(1, 1, '個')}</span>
  ```

- 日期輸入框一律用 `YYYY/MM/DD`，不分語系，避免月日順序看錯。

## 國際化（i18n）

- 介面文字以繁體中文為原文，經過 `UI.t()` 輸出；其他語言用 `UI.addMessages(locale, { 原文: 譯文 })` 提供。已內建英文（`en`）。
- 有變數的句子用整句加佔位符，不要把句子拆開拼：`UI.t('已選 {n} 筆', { n: 3 })`，英文是 `{n} selected`。不同語言的字序不同。
- 切換語系：`UI.setLocale('en-US', { currency: 'USD' })`，會設定 `<html lang>`；之後重新渲染畫面。
- 寫新元件時：按鈕、提示、`aria-label` 的文字都要經過 `UI.t()`。

## 在地化（L10n）

- 上面的格式規則是 zh-TW 的選擇。其他語系使用該語系自己的習慣（透過瀏覽器的 `Intl`）：英文是 `Wed, 11/04/2026`、`3:57 PM`、`12.8M`、`$486,000`；德文用 `04.11.2026`、`3.480,3`。
- 一週的第一天：zh-TW 是週日；其他語系依瀏覽器提供的地區資訊（例如德文從週一開始）。
- 幣別跟著資料走，不跟著語系：同一筆台幣金額，在英文介面顯示 `NT$486,000`。
- 文字長度：英文、德文通常比中文長 1.5 到 2 倍，按鈕和欄位標題要留空間；標題不換行的規則不變，放不下就讓表格橫向捲動。
