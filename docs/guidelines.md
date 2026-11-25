# 前端設計系統：核心規則

每一頁都適用的規則。元件自己的規則在該元件 README 的「用法」（`ui docs <Name>`）；頁面有下列主題時再讀：

| 檔案 | 什麼時候讀 |
|---|---|
| [layout.md](layout.md) | 自己排頁面外框、導覽、搜尋、第一次使用的導覽 |
| [forms.md](forms.md) | 表單 |
| [data.md](data.md) | 表格、結果清單、檔案清單、KPI、圖表 |
| [monitoring.md](monitoring.md) | 全螢幕常駐的監控畫面 |
| [code.md](code.md) | 閱讀程式碼的工具：程式碼、架構圖、文件 |
| [theme.md](theme.md) | token 對照、主題與強調色、Slidev 教材主題 |
| [motion.md](motion.md) | 自己做動畫 |

## 外觀

- 暖灰中性色；主題有自動（跟隨系統）、淺色、深色。強調色預設 `#2457d6`，使用者可以自訂；中量使用：主要按鈕、連結、圖示、標籤與選取狀態。
- 卡片用陰影分層。卡片裡不放卡片：區塊用 `Card`，卡片裡再分區用 `surface-sub` 底色或分隔線。
- 自己的 CSS 只用 token（`var(--surface)`、`var(--space-4)`；Tailwind 用 `bg-surface`、`text-ink-muted`），不用 Tailwind 內建的顏色、圓角和陰影。強調色的文字讀 `accent-text`，不讀 `accent`。
- 密度緊密：區塊間距 `space-8` 32 px；圓角 `radius-xs` 4 px 到 `radius-lg` 14 px（數值見 [theme.md](theme.md)）。

## 字體與圖示

- Inter 加思源黑體；Geist Mono 只用在數字、程式碼、路徑和 ID，不用在中文句子或整行說明。
- 內文 16 px、行高 1.65、標題字重 700。介面標題（頁面、卡片、對話框）、按鈕、分頁、表頭不換行；Markdown 文件內容裡的標題可以換行。內文一種大小，次要文字小一級，不為單一列另設字級。表格數字等寬並靠右。
- 圖示 Phosphor Regular，選中時換實心加強調色；按鈕、表格、輸入框裡 20 px，側邊欄與底部分頁列 22 px，選單與小標記 16 px。名稱用 `ui docs icons` 查。
- 沒有 logo 時用文字名稱加一個 `accent` 色方塊（AppShell 的 `brand` 會自己做）。

## 控制項

- 不用原生 `<select>`、`<table>`、`<input>`、`<textarea>`、`<button>`、`<a>`、勾選框：用 Select、DataTable、TextField、TextArea、Button、Link、Checkbox。
- 按鈕的層級（`primary`、`secondary`、`quiet`、`danger`）和危險動作的確認寫在 Button 的用法（`ui docs Button`）。只有圖示的按鈕用 `IconButton`，一定有 `label`。
- 按鈕與輸入框 40 px，寬度小於 600 px 時輸入框 48 px；觸控點擊範圍至少 48 × 48 px，句子裡的連結和名詞說明例外。
- 鍵盤焦點一律是 2 px `focus` 外框；錯誤是紅框加圖示加原因；停用灰底灰字。
- 浮層：要使用者決定用 Dialog，編輯一筆資料用 Drawer，按鈕旁的少量設定用 Popover，更多操作用 Menu，短提示用 Tooltip。開關一律是 `open`、`defaultOpen`、`onOpenChange`。
- 值一律是 `value` 加 `onChange(value)`；欄位都有 `label`（看不到時加 `hideLabel`）；從清單選的元件用 `options`。

## 版面

- Dashboard 類用 `AppShell`；監控畫面用 `ConsoleLayout`；程式碼工具用 `Workbench`；展示類（產品介紹、說明網站）只用頂部導覽，見 [layout.md](layout.md)。
- 內容滿版，`Page` 上下排區塊，`Grid` 排卡片：等寬 `columns={3}`，不等寬給比例 `columns={[2, 1]}`（主要內容加側欄）。每個區塊一張 `Card`。
- 頁面標題只出現一次：清單頁、Dashboard、設定頁寫在頂部列（AppShell `title`）；詳細頁是那筆資料的名稱，寫在 `PageHeader`，AppShell 不給 `title`。麵包屑放在內容最上方（`Breadcrumb`），不放頂部列。
- 斷點：手機小於 600 px、平板 600 到 959 px、桌面 960 px 以上（大螢幕 1280 px 以上）。AppShell 的導覽另以 1024 px 為界：600 到 1023 px 改成導覽抽屜，1024 px 以上有側邊欄，小於 600 px 改成底部分頁列。手機上長文字靠左。

## 常見頁面

- 清單頁：清單放在一張 `Card`（`padding={false}`，不給 `title`：標題已在頂部列，DataTable 給同字的 `label`）。主要操作「新增」給 DataTable 的 `action`，在工具列右端，不放 Card 標題列、不放側邊欄。筆數由 DataTable 顯示，標題旁不寫。一頁有好幾個區塊時（Dashboard、詳細頁），表格的 Card 才給 `title`。
- 詳細頁：`Breadcrumb`、`PageHeader`（名稱、狀態、一行資訊、一個 `primary`、其他操作），下面 `Grid columns={[2, 1]}`。
- Dashboard：最上方一排 `KpiCard`，下面圖表和小表格各一張 Card。期間選擇（`DateRangePicker` 加 `hideLabel`，或「今天／7 天／30 天」的 SegmentedControl）放在內容最上方、第一排卡片之前，不放頂部列；整頁都是示範值時給 AppShell `tags={<Tag icon="info">示範資料</Tag>}`。
- 設定頁：`SettingsLayout` 放在 AppShell 裡，標題給 AppShell（`title="設定"`），SettingsLayout 不給 `title`；改完自動儲存（存檔時機見 SettingsLayout）。
- 表單頁（新增、編輯一整頁）：整份表單一張 Card，欄位用 `FormGrid`，按鈕在表單最下方靠右，`primary`（「建立」「儲存」）在最右，「取消」`secondary` 在它左邊。編輯一筆資料而不離開清單用 Drawer。

## 狀態與回饋

- 狀態（進度、結果、連線）用 `Badge`，圓點加文字，只有要處理的狀態醒目：已啟用 `tone="success"`、已停用和已取消 `status="closed"`、在線 `online`、離線 `offline`。「這是什麼」的分類用 `Tag`，一律灰色。
- 載入：立即顯示和內容同大小的 `Skeleton`（表格、KPI、圖表各一塊），不用轉圈。載入失敗：在那個區塊的位置放 `Alert tone="danger"`，寫原因，動作「重試」。
- 空清單：還沒有任何資料時，Card 裡放 `EmptyState`（下一步怎麼開始，「新增」放在它的 `action`）取代 DataTable；搜尋或篩選後沒有結果時，DataTable 自己顯示一句 `emptyText`，工具列留著。
- 操作完成：`toast('已儲存')`；能復原時附「復原」。顯示時間、復原和放 Toaster 的位置寫在 Toast 的用法（`ui docs Toast`）。要一直顯示的提示用 Alert。

## 格式

- 日期 `2026/11/04（三）`，年份一律顯示，加星期；時間 24 小時制，接在「）」後面不加空格（`2026/11/04（三）13:00`）；一週內用相對時間（「2 小時前」，`RelativeTime` 會自己更新）。
- 金額 `NT$ 1,280`；負數用減號；小數依單位（金額 0、百分比 1、容量 1 位）；大數字只有 KPI 卡片和圖表的軸縮寫（萬、億）。
- 數字是數字：表格給 `numeric` 加 `unit`、時間長度 `format: 'duration'`，不寫成「46 分」這種字串。檔案大小、時間長度用 `format.fileSize()`、`format.duration()`。
- 日期和數字經過 `format`。介面文字直接寫繁體中文；頁面要支援好幾種語言時才經過 `t()`（和 `setLocale`、`addMessages` 一起從 `@seanyeh77/ui` 匯入）。
- 句子裡的程式碼、路徑和 ID 用 `InlineCode`；含反引號的整段文字用 `CodeText`。元件收字串的說明、提示、錯誤和內文也把反引號裡的文字顯示成行內程式碼。路徑、行號、ID 這類指向某處的文字都是連結。
- AI 寫的句子、段落、清單項目或表格格子，最後加 `AiMark`「AI 撰寫」。

## 文字語氣

- 按鈕只用動詞（「儲存」、「刪除」），不寫「確定」。錯誤訊息寫原因加修正方式：「Email 格式不正確，例如 name@example.com」。
- 一句話講一件事，寫成「名稱：做什麼」（「Ctrl K：搜尋」）；說明最多 2 句，每句約 25 字以內。
- 畫面已經看得出來的不寫；同一件事只說一次。正式書面用語：「查看依據」，不寫「點一下看原因」。
- 標題和連結不用問句：「重看導覽」，不寫「第一次使用？重看導覽」；確認對話框的標題例外（「刪除這個專案？」）。
- 技術名詞保留常見英文，第一次出現時用 `Term` 說明；長的解釋放文件，介面上給連結。

## 無障礙

- 焦點不掉回頁面最上方：浮層關閉回到打開它的元素，換頁後呼叫 `focusMain()`；變化用 `announce(text)` 念出。
- 「跳到主要內容」、`main` landmark、`aria-current="page"` 由 AppShell 內建。
- 名稱照口語：「說明 caller」、「第 1 步，共 5 步」、「全部 26 個」；不含按鈕文字和「…」。

## 完成前檢查

執行 `npx @seanyeh77/ui-cli check <檔案或網址>`，再加 `--shots shots/` 看截圖：有元件的地方都用了元件；Geist Mono 只在數字和程式碼上；卡片一層陰影（TreeList、KpiCard、Alert、SettingsSection、DangerZone 本身就是卡片）；結果清單裡要處理的項目排在前面或能從摘要篩選。

標示「看情況」的項目不是固定規則：依情境選擇，並說明選了哪一種。
