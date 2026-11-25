---
'@seanyeh77/ui-cli': minor
---

`ui check` 等動畫和轉場結束（最多 1.5 s）才量測，淡出中的列不再被誤報；每個寬度與主題那一行算進打開的狀態的問題，各狀態的問題列在它底下。新的檢查：同一列表單欄位不同高、390 px 時置中的兩行以上段落、AppShell 頁面的文件本身也在捲動。`--shots` 也存每個打開的狀態。`ui shots` 等網路閒置和字型、量到兩次相同的高度才截圖；檔名包含查詢字串（`iframe.html?id=button--primary` 是 `iframe-id-button-primary`），不再互相覆蓋。`ui docs` 不印 HTML 註解。新增 `ui add <dashboard|list-detail|settings|login> [dir]`，不連網路寫出頁面範本。升級方式：用含查詢字串的網址產生的基準圖要重新產生（檔名改了）。
