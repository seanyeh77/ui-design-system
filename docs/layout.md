# 版面與導覽

頁面外框用元件就好（`AppShell`、`ConsoleLayout`、`Workbench`）；這份給要自己排外框、導覽或說明的頁面。內容的排法（`Page`、`Grid`、一個區塊一張 Card）見 [guidelines.md](guidelines.md)。

## Dashboard 類

- 側邊欄加頂部列（`AppShell`）。
- 側邊欄預設不釘選：平常是 72 px 的圖示列（`sidebar-collapsed`），滑鼠停在上面或用 Tab 移進去時展開成 240 px（`sidebar-width`），疊在內容上，離開後收回。左下角的圖釘按鈕釘選側邊欄，釘選後固定在內容旁邊，可以收合成 72 px。
- 主要區域旁邊要能調整寬度的側邊面板（程式碼、詳細資料）用 `SplitPane`；寬度小於 960 px 時上下排列。

## 展示類

產品介紹、說明網站這類沒有側邊欄的頁面：

- 頂部用 `TopBar`：`title` 寫網站名稱，右邊（`children`）放幾個前往各頁的 `Link`；沒有搜尋時給 `onSearch={false}`。
- 內容用 `Page` 和 `Grid`，和 Dashboard 類相同。
- 頁尾精簡一行：`ink-muted` 的 `text-compact` 小字（版權、聯絡方式的 `Link`），上方一條 `line` 分隔線；自己寫這一行時只用 token。

## 共通規則

- 手機導覽：底部分頁列。
- 頁首行為：往下捲時隱藏，往上捲時出現。

## 斷點

| 名稱 | 寬度 (px) | Token |
|---|---|---|
| 手機 | 0 到 599 | 小於 `bp-tablet` |
| 平板 | 600 到 959 | `bp-tablet` |
| 桌面 | 960 到 1279 | `bp-desktop` |
| 大螢幕 | 1280 以上 | `bp-wide` |

- 導覽的邊界是 1024 px，只管導覽：AppShell 在 600 到 1024 px（含 1024 px）沒有側邊欄，頂部列左邊的選單按鈕打開導覽抽屜；大於 1024 px 有側邊欄。頁面排版（`Grid`、`SplitPane`）照上表的斷點。
- 表單欄位：`FormGrid` 自己寬 640 px 以上雙欄，以下單欄（container query）。

## 導覽

各元件的細節見它的 README；這裡是整頁要一致的部分。

- 側邊欄（`SideNav`，AppShell 內建）：選中用左側指示條（水滴方式移動）；項目高 40 px；組與組之間分隔線；收合後滑過顯示名稱提示。品牌用 `brand={{ mark, name, href }}`。
- 頂部列（`TopBar`）：左邊頁面標題，右邊填色搜尋框（附 Ctrl K 提示，Mac 上寫 ⌘K）；手機上搜尋框換成搜尋圖示。
- 同一頁裡切換內容不同的檢視：分頁（`Tabs`），內容依序浮起；分頁上的數字帶單位。同一份內容的兩三種顯示方式：分段控制（`SegmentedControl`）。兩者外觀不同：分頁是文字加底線，分段控制是灰底上的白塊。
- 手機底部分頁列（`MobileTabBar`，AppShell 內建）：放不下的頁面放在最後一格「更多」。
- 專案狀態：頂部列右邊放 `ProjectSwitcher`。通知：頂部列的 `NotificationBell`。主題與強調色放在設定頁的「外觀」，不放在頂部列。

## 搜尋與說明

- 搜尋：`CommandPalette`，一個搜尋找全部（頁面、設定、指令、檔案，以及專案自己的種類）。任何頁面按 Ctrl K（Mac 是 ⌘K）都能打開，入口是頂部列的搜尋框。
- 第一次使用的導覽：`Tour` 加 `useTour(key)` 記住看過了沒有。可以略過，看完或略過後不再自動出現；頁面上要有「重看導覽」。有「導覽」按鈕的頁面不自動打開，改在按鈕上提示（`IconButton` 的 `hint`）；不用「第一次使用」橫幅。
- 讀者可能看不懂的名詞和關係標籤：`Term`；句子裡用 `variant="inline"`。
- 發現寫錯的地方：`Suggestion`，舊的和新的上下兩行，可以複製修正。
- 整頁元件：錯誤頁 `ErrorPage`、登入頁 `LoginCard`、設定頁 `SettingsLayout`（改完自動儲存，危險操作放最下方的 `DangerZone`；選中的分類寫進網址 hash，頁面自己用 hash 做路由或同一頁有兩個 SettingsLayout 時給 `urlSync={false}`）。
