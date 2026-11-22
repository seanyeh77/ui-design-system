---
'@seanyeh77/ui': patch
'@seanyeh77/ui-cli': patch
---

文件改成依需要讀取：`docs/guidelines.md` 只留每一頁都需要的核心規則，其他規則分到主題檔（`layout`、`forms`、`data`、`monitoring`、`code`、`theme`、`motion`）和各元件的 README，套件的 `docs/` 一併附上這些主題檔。每個元件的 README 開頭新增「用法」：一句話說明、最短的範例與最常用錯的規則。`ui docs <Name>` 預設只印「用法」，加 `--full` 印整份 README；`ui docs` 也能印主題檔，`ui list` 列出主題檔與元件的一句話說明。
