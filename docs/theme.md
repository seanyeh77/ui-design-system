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
| 語意色 | `success`、`warning`、`danger` 各有實色、`-text`、`-soft`；資訊用 `info-text`、`info-soft` |
| 固定實色上的文字（危險按鈕、數字徽章、檔案類型標籤、色票、開啟的開關圓點） | `on-solid` |
| 有錯誤的欄位聚焦光暈 | `danger-ring` |
| 搜尋結果的符合文字底色 | `mark` |
| 對話框、抽屜、搜尋面板的遮罩；導覽聚光區外 | `scrim`、`scrim-strong` |
| 表格固定欄的邊緣陰影 | `edge-shadow` |
| 檔案圖示的副檔名色塊 | `file-pdf`、`file-video`、`file-audio`、`file-slides`、`file-doc`、`file-sheet`、`file-image`、`file-code`、`file-other` |
| 資料的顏色 | `chart-1` 到 `chart-4`、`heat-1` 到 `heat-7`、`diverge-*`（見 DataColors） |

文字 token 在兩套主題都對它的底色達到 4.5:1；`line-strong` 對 `surface` 達到 3:1。

間距、圓角與陰影：密度緊密，區塊間距 `space-8` 32 px；中圓角 `radius-xs` 4 px（行內程式碼、鍵帽、分段控制）、`radius-sm` 6 px、`radius-md` 10 px、`radius-lg` 14 px；表面用柔和陰影 `shadow-card`。

## 字型

- 搭配方式：無襯線為主，等寬字只用在標籤與數字。
- 無襯線：Inter，中文用思源黑體（Noto Sans TC），對應 `sans`。等寬：Geist Mono，對應 `mono`。
- 字型檔內附在 `dist/fonts.css`（Inter、Geist Mono、Noto Sans TC，字重 400 到 700），不從 Google Fonts 載入，離線或內網也能用；瀏覽器只下載頁面用到的字。

## 圖示

- 圖示組：Phosphor（MIT 授權，可商用），平常用 Regular 線條版；選中時換成同一個圖示的實心版（Fill）並用強調色，例如側邊欄和手機底部分頁列的選中項目。
- 線寬：Phosphor 的線寬固定，不另外調整；自訂的 24 × 24 線條圖示用 2 px（`icon-stroke`）。
- 用法：`h(UI.Icon, { name: 'house' })`，加 `filled: true` 用實心版；名稱照 Phosphor，常用的 80 個已內建，`icons` 列出全部名稱（也接受 Lucide 的名稱，例如 `trash-2`）。元件的 `icon` 屬性接受同樣的名稱，或自訂圖示的 24 px path。

## 外觀設定

- 主題與強調色放在設定頁的「外觀」，不放在頂部列。
- 主題：自動、淺色、深色三張預覽卡片（`ThemePicker`）。
- 強調色：8 個推薦色票，加上可以輸入任何色碼的欄位（`AccentPicker`）。每個推薦色在淺色主題本身就能當文字：在 `bg`、`surface`、`surface-sub`、`surface-chrome` 和它自己的 `accent-soft` 上都至少 4.5:1，白字放在它上面也至少 4.5:1，所以淺色主題的 `accent-text` 就是色票本身；預設色一定是其中之一。色票：藍 `#2457d6`、靛 `#5b4fd6`、紫 `#864ad1`、桃紅 `#ba3873`、紅 `#c53228`、橘 `#ab5101`、綠 `#077b42`、青 `#027874`。
- 切換主題時，所有顏色用 300 ms 漸變。

## 自訂強調色的換算

使用者換強調色時（`setAccent()`），其他強調相關 token 依下列方式重新計算：

- `accent-hover`、`accent-press`：強調色混入 12% 與 22% 黑色。
- `accent-soft`：淺色主題為白色混入 12% 強調色；深色主題為 `surface` 混入 22% 強調色（選中的列多半在卡片上，以卡片底色為準）。
- `accent-text`：強調色的文字色，對 `bg`、`surface`、`surface-sub`、`surface-chrome` 與換算出的 `accent-soft` 都要至少 4.5:1。強調色本身已經達標時就等於強調色（預設 `#2457d6` 在淺色主題不變）；不夠時，淺色主題混入黑色、每步 4%，深色主題混入白色、每步 5%，直到全部都達 4.5:1。例如淺色主題 `#ffe066` → `#7a6c31`、`#c4600f` → `#a5510d`、`#0f8a85` → `#0d7975`；深色主題 `#1a1a6e` → `#afafcc`，預設 `#2457d6` → `#92abeb`。讀 `bg`、`surface` 時接受 `#rgb`（打包工具會把 `#ffffff` 縮成 `#fff`）、`#rrggbb` 與 `rgb()`；讀不出來時 `accent-text` 就用強調色本身，不往黑或白混。
- 只有文字跟著換：`accent` 本身（填色、進度條、選取框、色點、線）維持使用者選的顏色。用強調色寫的文字和緊貼文字的圖示一律讀 `accent-text`，不讀 `accent`。
- `on-accent`：白色與 `ink` 中對比較高者。
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

`accent-hover`、`accent-press`、`accent-soft`、`accent-text`、`on-accent` 依「自訂強調色的換算」由 `#027874` 算出：它在 `surface-sub` 上為 4.89:1、在 `accent-soft` `#e1efee` 上為 4.51:1，白字在它上面為 5.33:1，所以 `accent-text` 就是 `#027874`，強調色底上的文字用白色。版面、字級與投影片規則見 `teaching-materials-style`。
