---
'@seanyeh77/ui': minor
'@seanyeh77/tokens': minor
---

核心修正：SSR、主題、i18n 與日期。

- SSR 與 hydration：存在 localStorage 的選擇（ThemePicker、AccentPicker、Section 的 `storageKey`、AppShell 側邊欄、`useTour`、DataTable 的 `widthKey`、LayerGraph 的高度與線上文字、Workbench 版面）和媒體查詢在伺服器與瀏覽器第一次渲染都用預設值，接手後才換成存下的值，不再有 hydration 不一致；其他分頁改了也會跟著變。ConsoleLayout 的全螢幕按鈕、KpiCard 與 ProgressRing 的數字動畫也一樣。
- 主題：`initTheme({ preset: 'teaching' })`（或根元素的 `data-theme-preset`）讓 `setTheme()` 不再蓋掉 teaching preset。沒選過強調色時不再寫 inline 的 `--accent*`，由 `tokens.css` 決定；新增 `resetAccent()`、`pickedAccent()`、`themePreset()`，並匯出 `storedTheme()`、`storedAccent()`。在沒有 `window` 的環境呼叫主題函式不會出錯。遷移：自己用 CSS 覆寫 `--accent` 的頁面改用 `setAccent()`；自己設 `data-theme="teaching"` 的頁面改用 `initTheme({ preset: 'teaching' })`。
- tokens：每個主題設 `color-scheme`（深色主題的原生捲軸與表單控制項跟著變深）；新匯出 `presets`；`usage` 說明統一成英文並修正 `space-5`、`sidebar-collapsed`。
- 日期：`format.relative` 跨過午夜以日曆天計算（凌晨 1 點看前一晚 10 點是「昨天」，不是「3 小時前」），7 個日曆天以上寫完整日期。新元件 `RelativeTime` 每分鐘自己更新（全頁共用一個計時器），DataTable 的 `format: 'relative'` 改用它。DataTable 欄位格式改寫成 `format: 'dateTime'`；`'datetime'` 仍可用，開發時警告。
- i18n：新增 `useLocale()`、`subscribeLocale()`、`<LocaleProvider locale>`（SSR 時一個請求一種語系）；`t()` 支援「情境::原文」的 key。補上缺少的英文翻譯，全形標點改經過翻譯。預設文字不再限定專案：LayerGraph 外部方框的預設標籤從「repo 外」改成「外部」（要原本的字請傳 `externalLabel="repo 外"`），英文的次數從「{n} calls」改成「{n} uses」，DataTable 長文字的「收合」英文仍是 Show less、其他地方的「收合」英文改成 Collapse。CommandPalette 的內建種類改用 `kind: 'page' | 'setting' | 'command' | 'file'`，名稱跟著語系；舊的中文種類名稱仍可用，開發時警告。GraphLegend 不再翻譯頁面自己傳的圖例文字。
- 開發警告：全部改成英文；`devWarn` 的條件與訊息可以是函式，正式版不再為了警告每次渲染掃過所有列。
- `consoleZoom` 標成 deprecated（開發時警告），之後的版本會從匯出移除；ConsoleLayout 自己會縮放。
- `focusMain` 不再在 import 時掛上 document 的事件，改由 AppShell 與 `initTheme()` 啟用。
