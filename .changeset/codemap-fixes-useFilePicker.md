---
'@seanyeh77/ui': minor
'@seanyeh77/eslint-plugin-ui': patch
'@seanyeh77/ui-cli': patch
---

codemap 回報的五項修正：

- Workbench：`views` 或 `defaultLayout` 每次繪製都是新陣列時不再無限重繪（React #185）。版面只看 view 的 `id` 和 `defaultLayout` 的內容；`onLayoutChange` 只在版面內容改變時呼叫，可以直接傳 state 的 setter；分頁列的指示線位置不變時不再更新。
- Workbench：桌面下方面板上緣的邊界點擊範圍往上延伸到 24 px（WCAG 2.5.8），不蓋住面板的分頁列。
- 新增 `useFilePicker({ accept, multiple, onPick })`，回傳 `{ open }`：從 Button 的 `onClick` 或 Menu 項目的 `onSelect` 打開檔案選擇，hook 自己管隱藏的 `<input type="file">`。
- `no-native-controls`：有 `hidden` 屬性的 `<input>` 不算；`<input type="file">` 的訊息提到 `useFilePicker`。
- `ui check`：句子裡的 Term（`variant="inline"`，或旁邊有文字的預設樣式）和句子裡的連結一樣不算觸控目標，旁邊的文字在其他元素裡也一樣；「卡片外的文字」用 `overflow` 是 `hidden` 或 `clip` 的元素裁過、看得到的範圍量，`text-overflow: ellipsis` 截斷的文字不再被回報。
