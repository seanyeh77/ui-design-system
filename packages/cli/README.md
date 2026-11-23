# @seanyeh77/ui-cli

SeanYeh 設計系統的命令列工具。用 `npx @seanyeh77/ui-cli …` 執行（單打 `npx ui` 會跑到另一個無關的 npm 套件）。

```bash
npm i -D @seanyeh77/ui-cli
npx playwright install chromium   # ui check 與 ui shots 用的瀏覽器；或設定 CHROMIUM_PATH
```

- `ui check <檔案或 URL>`：在 390 px 與 1280 px、淺色與深色打開頁面，檢查 console 錯誤、水平溢出、小於 48 px 的觸控目標、卡片裡的卡片、原生控制項、沒放進 layer 又蓋過元件的重設 CSS 等，有問題時 exit 1。
- `ui shots <檔案或 URL>`：固定時間、停止動畫的截圖，寫成基準圖（`--out`）或和基準圖比對（`--compare`）。
- `ui docs [Name] [--full]`：印出元件的用法區塊或使用規則。
- `ui list`：列出每份規則與每個元件的一句說明。

`npx @seanyeh77/ui-cli` 不加參數會印出完整說明。

## 文件

- 文件網站：<https://seanyeh77.github.io/ui-design-system/>
- 給 AI agent 的使用說明：[AGENTS.md](https://github.com/seanyeh77/ui-design-system/blob/main/AGENTS.md)
