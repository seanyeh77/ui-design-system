# CommandPalette

一個搜尋找全部：頁面、設定、指令、檔案，以及專案自己的種類。任何頁面按 Ctrl K（Mac 是 ⌘K）都能打開。

- 入口：電腦上是 TopBar 的填色搜尋框，手機上（小於 600 px）TopBar 自動換成搜尋圖示。兩者都把 `onSearch` 接到打開面板。
- 樣子：畫面中間浮起的面板，電腦寬 640 px；手機上也置中浮起，左右各留 12 px，在頂部列下方，高度最多 55% 螢幕，留位置給鍵盤。
- 結果：所有種類混在一起，名稱開頭符合的排前面，再來是名稱中間符合，最後是說明或關鍵字符合；同分照資料原本的順序。最多顯示 50 筆。
- 每一筆：左邊是種類圖示，名稱（符合的字粗體），下面一行次要文字的說明。螢幕閱讀器先讀種類再讀名稱，例如「環境變數 IBTRACE_SHM」。名稱是程式碼（函式、路徑、變數）時給 `code: true`，改用 Geist Mono；說明裡的程式碼用反引號包起來。
- 種類圖示：內建 `頁面` `file-text`、`設定` `gear`、`指令` `command`、`檔案` `file-code`；專案自己的種類用 `kinds` 指定（例如 `{ 函式: 'brackets-curly', 環境變數: 'terminal-window' }`），或每筆的 `icon`。`items` 的型別可以加自己的欄位，`onSelect` 收到的是同一個型別。
- 還沒輸入時顯示 `recent`（「最近開啟」）；沒有就顯示提示。找不到時寫「找不到符合「x」的結果」。
- 鍵盤：↑ ↓ 選擇，Enter 打開，Esc 或「取消」關閉；面板底部寫這三個按鍵，觸控裝置不顯示。關閉後 focus 回到原本的位置。
- 資料要從伺服器搜尋時給 `filter: false`，在 `onQueryChange` 裡更新 `items`，等待時給 `loading`。

```tsx
const [open, setOpen] = React.useState(false);

<TopBar title="專案" onSearch={() => setOpen(true)} />
<CommandPalette
  open={open}
  onOpenChange={setOpen}
  placeholder="搜尋頁面、專案、設定"
  kinds={{ 專案: 'folder' }}
  items={[
    { id: 'p1', kind: '專案', label: 'api-gateway', detail: '最後部署 `v2.4.1`' },
    { id: 's1', kind: '設定', label: '通知', detail: '部署失敗時寄 Email' },
    { id: 'g1', kind: '頁面', label: '成本報表' },
  ]}
  onSelect={(item) => go(item.id)}
/>
```
