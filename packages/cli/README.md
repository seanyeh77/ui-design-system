# @seanyeh77/ui-cli

SeanYeh 設計系統的命令列工具。用 `npx @seanyeh77/ui-cli …` 執行（單打 `npx ui` 會跑到另一個無關的 npm 套件）。

```bash
npm i -D @seanyeh77/ui-cli
npx playwright install chromium   # ui check 與 ui shots 用的瀏覽器；或設定 CHROMIUM_PATH
```

- `ui check <檔案或 URL>`：在 390 px 與 1280 px、淺色與深色打開頁面，檢查 console 錯誤、水平溢出、小於 48 px 的觸控目標、1280 px 時小於 24 px 又擠著別的目標的目標（WCAG 2.5.8）、卡片裡的卡片、原生控制項、被截斷又沒有 Tooltip 或 title 的介面文字、跑出卡片外的文字、同一列工具列或表單欄位不同高、390 px 時置中的兩行以上段落、AppShell 頁面的文件本身也在捲動、沒放進 layer 又蓋過元件的重設 CSS，以及 axe-core 的 WCAG 2.0、2.1、2.2 A 與 AA 規則，有問題時 exit 1。每次量測前等動畫和轉場結束（最多 1.5 s）。頁面沒有 viewport meta 時，390 px 只回報一次「缺 viewport meta」，不檢查觸控目標。 file:// 頁面的字型被 CORS 擋下時不算 console 錯誤，每頁最後寫一行 note，提醒用 http 開頁面。
  - 它也會點開每個分頁（`[role=tablist]`）、SettingsLayout 的每個分類，以及工具列與頂欄裡 `[aria-haspopup]` 按鈕的選單，檢查打開後的畫面（淺色與深色、兩種寬度，每頁最多 12 個狀態），只回報原本沒有的問題。24 px 檢查的鄰近目標只算看得到的部分：被儲存格或其他 `overflow` 裁掉的連結不算。
  - 每個寬度與主題那一行的結果算進頁面和打開的狀態；各狀態的問題列在「after opening …」底下。
  - `--open <selector>` 點開頁面上第一個符合的元素（對話框、側欄）並檢查，可以重複；`--no-interact` 不自動點分頁、分類和選單；`--no-axe` 不跑 axe-core。`--shots <資料夾>` 存每個寬度與主題的整頁截圖，也存每個打開的狀態。
- `ui shots <檔案或 URL>`：固定時間、停止動畫的截圖，寫成基準圖（`--out`）或和基準圖比對（`--compare`）。整頁截圖包含頁面自己的捲動區（AppShell 的主內容）裡捲到下面的內容。檔名來自檔案名稱或網址的路徑，再接查詢字串和 hash（`http://localhost:5173/settings#billing` 是 `settings-billing`，`iframe.html?id=button--primary` 是 `iframe-id-button-primary`）。網路閒置、字型載入、高度連續兩次相同之後才截圖。
- 每個指令加 `--help` 印出自己的說明。
- `ui docs [Name] [--full]`：印出元件的用法區塊或使用規則；不加名稱時先印閱讀順序（guidelines 最先），再列出全部文件。
- `ui add <dashboard|list-detail|settings|login> [資料夾]`：把頁面範本寫進專案，內容在這個套件裡，不連網路（預設 `src/components/blocks/<範本>`；已有的檔案保留，`--force` 才覆寫）。和文件網站的 shadcn registry 是同一份範本。
- `ui list`：依閱讀順序列出每份規則，再依分組（和 llms.txt 相同）列出每個元件的一句說明。

`npx @seanyeh77/ui-cli` 不加參數會印出完整說明。

Playwright 在 `@seanyeh77/ui` 與這個套件固定成同一個確切版本：畫面基準圖是用它的 Chromium 產生的，升級 Playwright 就要重新產生基準圖（Update visual baselines workflow）。

## 文件

- 文件網站：<https://seanyeh77.github.io/ui-design-system/>
- 給 AI agent 的使用說明：[AGENTS.md](https://github.com/seanyeh77/ui-design-system/blob/main/AGENTS.md)
