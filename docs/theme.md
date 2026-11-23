# Token、主題與教材主題

自己寫 CSS 要找 token、做主題或強調色設定、做 Slidev 教材時讀這份。

## 色彩

- 中性色調：暖灰。淺色主題底色極淺灰，深色主題底色深灰。
- 卡片分層：陰影。
- 強調色：預設 `#2457d6`，使用者可以自訂，不限定顏色。用量中量，用在主要按鈕、連結、圖示、標籤與選取狀態。
- 語意色：配合強調色的飽和度。
- Tailwind：只用設計系統的 token class（`bg-surface`、`text-ink-muted`、`rounded-md`、`shadow-card`）；Tailwind 內建的顏色、圓角和陰影（`text-gray-500`、`rounded-xl`、`shadow-lg`）由 ESLint 規則 `no-tailwind-defaults` 抓出來。

主題設定有三個選項：自動（跟隨系統的 `prefers-color-scheme`）、淺色、深色。頁面根元素設 `data-theme="light"` 或 `"dark"`；頁面載入時呼叫一次 `initTheme()`。

| 用途 | Token |
|---|---|
| 頁面底色 | `bg` |
| 卡片、面板、對話框 | `surface` + `shadow-card` |
| 次要底色（斑馬紋、灰底元件、骨架） | `surface-sub` |
| 頂部列、側邊欄、底部分頁列 | `surface-chrome` |
| 主要文字、次要文字 | `ink`、`ink-muted` |
| 分隔線、控制項邊框 | `line`、`line-strong` |
| 強調色與它的滑過、按下 | `accent`、`accent-hover`、`accent-press` |
| 強調文字、強調淺底、強調色上的文字 | `accent-text`、`accent-soft`、`on-accent` |
| 鍵盤焦點的外框（所有控制項同一種） | `focus` |
| 語意色 | `success`、`warning`、`danger` 各有實色、`-text`、`-soft`；資訊用 `info-text`、`info-soft`；危險色底上的文字 `on-danger` |
| 狀態記號（Badge 的進度圓圈、樹狀清單與量表的圓點） | `success-text`、`warning-text`、`danger-text`、`accent-text`；草稿用 `ink-muted` |
| 固定實色上的文字（危險按鈕、數字徽章、檔案類型標籤、色票、開啟的開關圓點） | `on-solid` |
| 搜尋結果的符合文字底色 | `mark` |
| 對話框、抽屜、搜尋面板的遮罩；導覽聚光區外 | `scrim`、`scrim-strong` |
| 表格固定欄的邊緣陰影 | `edge-shadow` |
| 檔案圖示的副檔名色塊 | `file-pdf`、`file-video`、`file-audio`、`file-slides`、`file-doc`、`file-sheet`、`file-image`、`file-code`、`file-other` |
| 資料的顏色 | `chart-1` 到 `chart-4`、`heat-1` 到 `heat-7`、`diverge-*`（見 DataColors） |

文字 token 在兩套主題都對它的底色達到 4.5:1。不是文字但要看得出來的東西（控制項邊框、焦點外框、填色、狀態記號）達到 3:1：

- 底色指 `bg`、`surface`、`surface-sub`、`surface-chrome`、`accent-soft`（選中的列），以及表格的列：滑過時 `surface` 混入 6%（淺色）或 5%（深色）的 `ink`，深色主題的斑馬紋為 `surface` 與 `surface-sub` 各半。
- `line-strong`（輸入框、外框按鈕、勾選框、開關關閉時的框）在上述底色和 `surface-input` 上都至少 3:1。
- `accent`、`accent-hover`、`accent-press`（主要按鈕、開關、進度條、選中的頁碼）在上述底色上至少 3:1，`on-accent` 在它們上面至少 4.5:1。
- `success`、`warning`、`danger` 的實色（填色、橫條、圖示）在 `bg`、`surface`、`surface-sub`、`surface-chrome` 和表格的列上至少 3:1，`on-danger` 在 `danger` 上至少 4.5:1。放在文字旁邊的狀態記號改用 `-text`，所以在 `accent-soft` 上也至少 3:1。
- `chart-1` 到 `chart-4` 在 `bg`、`surface`、`surface-sub`、`surface-chrome` 上至少 3:1。
- 選中的分頁與分段控制項：白色的底塊加 1 px `line-strong` 框，只靠白底對灰底（約 1.1:1）看不出來。

`tokens-contrast.test.tsx` 從 `tokens.json` 和 `setAccent` 計算以上比例，涵蓋淺色、深色與教材主題：

- 文字：`ink`、`ink-muted` 和每個 `*-text` 在 `bg`、`surface`、`surface-sub`、`surface-chrome`、`accent-soft` 上達 4.5:1，狀態文字在自己的 `*-soft` 上也達 4.5:1。
- 8 個推薦色票逐一用 `setAccent` 套用後：同一組文字 token 在該色票算出的 `accent-soft` 上達 4.5:1，`line-strong` 在上面達 3:1；`accent-text` 在 `bg`、`surface`、`surface-sub`、`surface-chrome` 上達 4.5:1；`accent`、`accent-hover`、`accent-press` 在這些底色與該色票的 `accent-soft` 上達 3:1，`on-accent` 在三者上達 4.5:1。
- 非文字：`line-strong`、狀態記號（`*-text`、`ink-muted`）在上述底色與表格的列上達 3:1；`success`、`warning`、`danger` 的實色在 `accent-soft` 以外的底色與表格的列上達 3:1；`chart-1` 到 `chart-4` 在 `bg`、`surface`、`surface-sub`、`surface-chrome` 上達 3:1。
- 選中分頁的白底加框不在這個測試裡。

## CSS 層與覆寫元件樣式

設計系統的 CSS 全部在 cascade layer `ui` 裡：`tokens.css` 在 `ui.tokens`，`styles.css` 在 `ui.components`。頁面自己的 CSS 不放進 layer 就一定贏，不必比 specificity，也不必加 `!important`：

```css
/* 頁面的 CSS，不加 @layer：蓋過元件的 .ui-btn-primary */
.save-btn {
  background: var(--success);
}
:root {
  --accent: #0e827d; /* 也蓋過 tokens.css，不論檔案先後、不論 data-theme */
}
```

- Tailwind v4：在主要 CSS 檔的最前面、`@import 'tailwindcss'` 之前寫一行順序，utility class 就能蓋過元件，Tailwind 的 preflight（`base`）不會蓋掉元件：

  ```css
  @layer theme, base, ui, components, utilities;
  @import 'tailwindcss';
  @import '@seanyeh77/tokens/tailwind.css';
  ```

  沒寫這一行、又先載入 Tailwind 時，`ui` 排在 `utilities` 之後：元件蓋過 utility class，和沒有 layer 時一樣。`tokens.css` 和 `styles.css` 開頭也宣告同一個順序，所以先載入設計系統時不寫也一樣。
- 頁面自己的 CSS 放在 layer 裡時，那個 layer 要排在 `ui` 之後才會贏；排在前面（例如先宣告的 `@layer reset`）的規則會輸給元件。
- 全域的重設 CSS 也一樣會贏：reset、normalize、CMS 或專案範本附的 CSS（例如 `* { margin: 0; padding: 0; border: 0 }`、`button { background: none }`）沒放進 layer 時，會洗掉每個元件的間距、邊框和背景。這類規則放進 `@layer base { … }`（或其他排在 `ui` 之前的 layer）；Vite 等範本產生的 `index.css`、`App.css` 直接刪掉。`ui check` 會列出沒有 layer、用元素或 `*` 選擇器、又蓋過元件宣告的規則。
- 元件 CSS 裡的 `!important` 在 layer 中比沒有 layer 的 `!important` 優先：要蓋過這些宣告，改用沒有 `!important` 的頁面規則蓋過元件的其他規則，或在 `ui` 之前的 layer 寫 `!important`。

### 只載入用到的元件的 CSS

`styles.css`（約 200 KB，gzip 後約 39 KB；bundler 壓縮後約 148 KB、gzip 約 25 KB）是預設的載法。很在意大小的專案可以改用 `@seanyeh77/ui/css/` 裡的分檔：寫一個 CSS 入口檔，依序 `@import` `base.css`、用到的每個元件的檔案、`end.css`，JavaScript 只 import 這一個檔。

```css
/* src/ui.css */
@import '@seanyeh77/ui/css/base.css'; /* 最前面：共用的基礎、表單欄位、圖表、動畫 */
@import '@seanyeh77/ui/css/Button.css'; /* 用到的元件，一個一行 */
@import '@seanyeh77/ui/css/DataTable.css';
@import '@seanyeh77/ui/css/end.css'; /* 最後面：觸控目標、焦點外框、浮動層等蓋在元件上的規則 */
```

```ts
import '@seanyeh77/ui/fonts.css';
import '@seanyeh77/ui/tokens.css';
import './ui.css';
```

- 每個元件的檔案用 `@import` 帶入它畫出或借用樣式的其他元件的檔案（例如 `DataTable.css` 帶入 `Button.css`），排在自己前面，所以只列頁面直接用到的元件就夠了。沒有自己樣式的元件（`TextField`、`LineChart`）也有檔案，只帶入它們用到的元件。
- 同一個檔被帶入兩次時，bundler 展開 `@import` 的方式決定留哪一份：postcss-import（Vite 預設）留第一份，esbuild 和瀏覽器直接載入時以最後一份為準。所以元件之間的先後不保證和 `styles.css` 完全相同；要完全相同就用 `styles.css`。
- 不要用好幾個 `<link>` 或在瀏覽器裡直接載入這些檔：不經 bundler 時，重複的檔以最後一次出現的位置為準。沒有 build step 的頁面用 `styles.css`。

## 焦點

所有控制項的鍵盤焦點用同一種樣式：2 px 實線外框，顏色 `focus`，離控制項 2 px（`outline: 2px solid var(--focus); outline-offset: 2px`）。`focus` 等於 `accent-text`，在每種底色上都至少 4.5:1。貼齊會裁切內容的容器時（可以捲動的分頁列、表格、清單、程式碼區、選單項目），外框改畫在內側 2 px（`outline-offset: -2px`），不會被切掉。DataTable 格子裡的任何可聚焦元素（程式碼連結、按鈕、勾選框）都畫在內側；截斷的長文字裡的連結取得鍵盤焦點時，整段文字展開，連結和外框都看得到。CommandPalette 的搜尋列在輸入框有焦點時，整列畫內側外框。有錯誤的欄位也用同一種外框，紅框不變。拖曳分隔線（SplitPane、Workbench）在焦點時變成 3 px 的 `accent` 線。

自己寫的可聚焦元素不必另外寫樣式：`styles.css` 對所有 `:focus-visible` 預設同一種外框。`focus-ring` 是舊名稱，數值和 `focus` 相同；`danger-ring` 不再使用，數值等於 `danger-text`。

間距、圓角與陰影：密度緊密，區塊間距 `space-8` 32 px；中圓角 `radius-xs` 4 px（行內程式碼、鍵帽、分段控制）、`radius-sm` 6 px、`radius-md` 10 px、`radius-lg` 14 px；表面用柔和陰影 `shadow-card`。

## 字型

- 搭配方式：無襯線為主，等寬字只用在標籤與數字。
- 無襯線：Inter，中文用思源黑體（Noto Sans TC），對應 `sans`。等寬：Geist Mono，對應 `mono`。
- 字型檔內附在 `dist/fonts.css`（Inter、Geist Mono、Noto Sans TC，字重 400 到 700），不從 Google Fonts 載入，離線或內網也能用；瀏覽器只下載頁面用到的字。

## 圖示

- 圖示組：Phosphor（MIT 授權，可商用），平常用 Regular 線條版；選中時換成同一個圖示的實心版（Fill）並用強調色，例如側邊欄和手機底部分頁列的選中項目。
- 線寬：Phosphor 的線寬固定，不另外調整；自訂的 24 × 24 線條圖示用 2 px（`icon-stroke`）。
- 用法：`h(UI.Icon, { name: 'house' })`，加 `filled: true` 用實心版；名稱照 Phosphor，常用的 80 個已內建，`icons` 列出全部名稱（也接受 Lucide 的名稱，例如 `trash-2`）。元件的 `icon` 屬性接受同樣的名稱，或自訂圖示的 24 px path。
- 載入：每個圖示是一個獨立的模組，有 build 的專案只打包頁面用到的圖示，用法不變。元件固定會顯示的圖示（下拉箭頭、關閉的 x、勾號等）跟著元件一起打包，第一次畫面就有，server render 也有。用 `name` 或 `icon` 指定的其他圖示在第一次顯示時才載入：載入前是同樣大小的空白方框（版面不會跳動），載入後同一個圖示之後都立即顯示。server render 時這些圖示是空白方框，hydrate 後再補上。
- 首屏的圖示想在第一次畫面就出現時，render 前先 `await preloadIcons(['house', 'gear'])`；不呼叫也能用，只是晚一個網路來回。import `icons` 的頁面會帶入全部圖示，所以只在真的需要全部名稱時才 import。`bundle.js` 內含全部圖示，一律立即顯示。

## 外觀設定

- 主題與強調色放在設定頁的「外觀」，不放在頂部列。
- 主題：自動、淺色、深色三張預覽卡片（`ThemePicker`）。
- 強調色：8 個推薦色票，加上可以輸入任何色碼的欄位（`AccentPicker`）。每個推薦色在淺色主題本身就能當文字：在 `bg`、`surface`、`surface-sub`、`surface-chrome` 和它自己的 `accent-soft` 上都至少 4.5:1，白字放在它上面也至少 4.5:1，所以淺色主題的 `accent-text` 就是色票本身；預設色一定是其中之一。色票：藍 `#2457d6`、靛 `#5b4fd6`、紫 `#864ad1`、桃紅 `#ba3873`、紅 `#c53228`、橘 `#ab5101`、綠 `#077b42`、青 `#027874`。
- 切換主題時，所有顏色用 300 ms 漸變。

## 自訂強調色的換算

使用者換強調色時（`setAccent()`），其他強調相關 token 依下列方式重新計算：

- `accent`：填色用的強調色（主要按鈕、開關、勾選框、進度條、選中的頁碼）。對 `bg`、`surface`、`surface-sub`、`surface-chrome` 與換算出的 `accent-soft` 都至少 3:1，而且 `on-accent` 在它上面至少 4.5:1。強調色本身已經達標時就等於強調色（8 個推薦色在淺色主題都不變）；不夠時，淺色主題混入黑色、每步 4%，深色主題混入白色、每步 5%，直到兩個條件都成立。例如深色主題預設 `#2457d6` → `#6689e2`（在 `surface-sub` 上 3.09:1，`ink` 字在上面 5.42:1）、`#1a1a6e` → `#8d8db7`；淺色主題 `#ffe066` → `#99863d`。
- `accent-hover`、`accent-press`：由換算後的 `accent` 混入 12% 與 22%，淺色主題混黑色、深色主題混白色（往遠離頁面底色的方向，比例不會掉到 3:1 以下）。
- `on-accent`：白色與 `ink`（`#171512`）中對比較高者。深色主題的強調色一定夠亮，所以是 `ink`。
- `accent-soft`：淺色主題為白色混入 12% 強調色；深色主題為 `surface` 混入 22% 強調色（選中的列多半在卡片上，以卡片底色為準）。
- `accent-text`：強調色的文字色，對 `bg`、`surface`、`surface-sub`、`surface-chrome` 與換算出的 `accent-soft` 都要至少 4.5:1。強調色本身已經達標時就等於強調色（預設 `#2457d6` 在淺色主題不變）；不夠時，淺色主題混入黑色、每步 4%，深色主題混入白色、每步 5%，直到全部都達 4.5:1。例如淺色主題 `#ffe066` → `#7a6c31`、`#c4600f` → `#a5510d`、`#0f8a85` → `#0d7975`；深色主題 `#1a1a6e` → `#afafcc`，預設 `#2457d6` → `#92abeb`。讀 `bg`、`surface` 時接受 `#rgb`（打包工具會把 `#ffffff` 縮成 `#fff`）、`#rrggbb` 與 `rgb()`；讀不出來時 `accent-text` 就用強調色本身，不往黑或白混。
- `focus`（以及舊名稱 `focus-ring`）：等於 `accent-text`。
- 用強調色寫的文字、緊貼文字的圖示和狀態記號一律讀 `accent-text`，不讀 `accent`。
- 語意色：飽和度跟隨強調色。

## 教材主題（teaching preset）

Slidev 教材投影片使用 `data-theme="teaching"`。投影片的 CSS 只讀 token 名稱，數值由這個 preset 提供。

已確認的選擇：

- 混合方案：中性色與字型沿用設計系統，強調色、直角與細線邊框沿用投影片風格。
- 強調色：預設為青 `#027874`，即 8 個推薦色之一；觀眾可以用簡報的選色器改成其他顏色。
- 圓角：全部 0 px（`radius-xs`、`radius-sm`、`radius-chip`、`radius-md`、`radius-lg`）。
- 陰影：不用（`shadow-*` 為 none），外框用 1.5 px 的 `line`。
- 字型：標題與內文 Inter 加思源黑體，程式碼 Geist Mono。
- 只有淺色。

`accent-hover`、`accent-press`、`accent-soft`、`accent-text`、`on-accent`、`focus` 依「自訂強調色的換算」由 `#027874` 算出：它在 `surface-sub` 上為 4.89:1、在 `accent-soft` `#e1efee` 上為 4.51:1，白字在它上面為 5.33:1，所以 `accent-text` 就是 `#027874`，強調色底上的文字用白色。版面、字級與投影片規則見 `teaching-materials-style`。
