---
'@seanyeh77/ui': minor
---

codemap lab3 試用回饋：

- MobileTabBar：每個圖示下方加一行 11 px 文字（選中的粗體），文字就是按鈕的名稱。只有圖示的樣式保留成 `labels={false}`；AppShell 用 `tabLabels` 傳下去。
- TreeList：整棵樹只佔一個 Tab 停點。列裡的連結和按鈕不在 Tab 順序裡，在列上按 → 進入，← 或 Esc 回到列，↑ ↓ 到上下一列。第 5 層以後的「L5」標記滑過時顯示「第 5 層」。
- CommandPalette：結果清單下方一行「共 N 筆」；新的選填 `total`，呼叫端截斷結果時寫「顯示 N 筆，另有 M 筆，請輸入更長的字」，螢幕閱讀器也念這一句。已列出結果、還在載入更多時，清單下方一行「搜尋中」。
- CodeView：焦點在程式碼裡時，Home／End 到第一行／最後一行，PageUp／PageDown 一次 20 行；新的選填 `sections`，`[` `]` 跳到上一段／下一段並念出段落名稱。
- Switch README：要讓點文字也能切換，把文字和開關包在同一個 `<label>` 裡。
