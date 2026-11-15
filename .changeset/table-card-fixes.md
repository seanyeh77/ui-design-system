---
'@seanyeh77/ui': patch
---

修正四個顯示問題：

- AppShell 的「跳到主要內容」連結在畫面外等待時不再帶陰影；原本陰影會滲進左上角，深色模式下側欄頂端多出一塊較黑的區域。按 Tab 聚焦時連結與陰影照常出現。
- `Card` 設 `padding: false` 時，標題列保留一般卡片的 16 px 內距；其中的 DataTable 工具列、捲動提示與頁碼也保留 16 px 左右內距，表格本身貼齊卡片左右與底部，不再畫自己的外框。
- DataTable 欄位設 `unit` 時，數字與單位之間的空格會顯示出來（「212.4 ms」，原本是「212.4ms」），複製的文字也有空格。
- Card 與 DataTable 的說明補上規則：卡片裡的表格，標題寫在 Card 的 `title`，DataTable 只設 `label`。
