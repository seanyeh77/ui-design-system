# CommandPalette

一個搜尋找全部：函式、檔案、元件、環境變數、頁面。任何頁面按 Ctrl K（Mac 是 ⌘K）都能打開。

- 入口：電腦上是 TopBar 的填色搜尋框，手機上（小於 600 px）TopBar 自動換成搜尋圖示。兩者都把 `onSearch` 接到打開面板。
- 樣子：畫面中間浮起的面板，電腦寬 640 px；手機上也置中浮起，左右各留 12 px，在頂部列下方，高度最多 55% 螢幕，留位置給鍵盤。
- 結果：所有種類混在一起，名稱開頭符合的排前面，再來是名稱中間符合，最後是說明或關鍵字符合；同分照資料原本的順序。最多顯示 50 筆。
- 每一筆：左邊是種類圖示，名稱（符合的字粗體），下面一行次要文字的說明。名稱是程式碼（函式、路徑、變數）時給 `code: true`，改用 Geist Mono；說明裡的程式碼用反引號包起來。
- 種類圖示：`函式` `brackets-curly`、`檔案` `file-code`、`元件` `stack`、`環境變數` `terminal-window`、`頁面` `file-text`、`設定` `gear`、`指令` `command`；其他種類用 `kinds` 或每筆的 `icon` 指定 Phosphor 名稱。
- 還沒輸入時顯示 `recent`（「最近開啟」）；沒有就顯示提示。找不到時寫「找不到符合「x」的結果」。
- 鍵盤：↑ ↓ 選擇，Enter 打開，Esc 或「取消」關閉；面板底部寫這三個按鍵，觸控裝置不顯示。關閉後 focus 回到原本的位置。
- 資料要從伺服器搜尋時給 `filter: false`，在 `onQueryChange` 裡更新 `items`，等待時給 `loading`。

```js
const [open, setOpen] = React.useState(false);
h(UI.TopBar, { title: '流程', onSearch: () => setOpen(true) }),
h(UI.CommandPalette, {
  open, onOpenChange: setOpen,
  placeholder: '搜尋函式、檔案、元件',
  items: [
    { id: 'f1', kind: '函式', label: 'trace_post_send', code: true, detail: '`src/…/hooks/ops.c:55`' },
    { id: 'e1', kind: '環境變數', label: 'IBTRACE_POST_LOG', code: true, detail: '在 `env.c:31` 讀取' },
    { id: 'p1', kind: '頁面', label: '影響範圍', detail: '改一個函式會影響誰' }
  ],
  onSelect: (item) => go(item)
})
```
