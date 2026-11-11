---
'@seanyeh77/ui': patch
---

Markdown 表格：名稱與路徑不再被拆成一字一行。Markdown 改用 `overflow-wrap: break-word`（原本 `anywhere` 讓表格以為每欄都能縮到一個字寬，把 `VirtualRouter._probe_neighbor` 這類名稱壓成一字一行）；格子裡的路徑不換行，指令在空白處換行並至少 16 em 寬；放不下時表格左右捲動。
