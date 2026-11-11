# Section

一頁裡可以收合的一段內容，例如程式碼地圖的「概觀」、設定頁或報告頁的分段。收合時仍看得到標題和一行摘要。

- 外觀：標題 20 px 粗體（h4 字級），比 16 px 的內容大；標題左邊有箭頭，展開時轉 90 度。標題右邊同一行是一行摘要（13 px、次要文字色），放不下時以「…」截斷。段落之間一條細線（`line`）。
- 動畫：展開與收合 260 ms，和 TreeList 子項目長出來一樣；`prefers-reduced-motion` 時不做動畫。
- 標題列是 `<h3>` 裡的 `<button>`，帶 `aria-expanded` 與 `aria-controls`；Enter 與空白鍵切換。螢幕閱讀器的標題清單找得到每一段。用 `level` 改標題層級，大小不變。
- 摘要是按鈕的一部分，會跟著標題念出來；不要放連結或按鈕。

```js
h(UI.Section, { id: 'external', title: '外部指令', summary: '29 個指令、4 個 namespace、3 個沒有逾時', lazy: true }, h(UI.DataTable, {/* … */}));
```

## Props

| Prop                   | 說明                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`                | 段落標題。                                                                                                                                                                        |
| `summary`              | 標題右邊的一行重點，收合時也顯示。可放 ReactNode，但不放互動元素。                                                                                                                |
| `defaultOpen`          | 不受控：一開始是否展開，預設 `false`。有記住的狀態（`storageKey`）時以記住的為準。                                                                                                |
| `open`、`onOpenChange` | 受控用法。點標題、網址跳到這段、「全部展開／全部收合」都會呼叫 `onOpenChange`。                                                                                                   |
| `id`                   | 錨點。網址 hash 是這個 id（載入時，或點了頁內的 `#id` 連結）時自動展開，並捲到標題。                                                                                              |
| `lazy`                 | 收合時完全不渲染內容。預設 `false`：內容留在頁面上但隱藏（`hidden="until-found"`），瀏覽器的頁內搜尋（Ctrl+F）找到裡面的字時自動展開。很長的段落（例如上百筆的表格）再設 `lazy`。 |
| `storageKey`           | 用這個 key 把開合狀態存在 localStorage（`ui-section:<key>`）。讀寫失敗時照常運作，只是不記住。                                                                                    |
| `level`                | 標題的 heading 層級，預設 3。                                                                                                                                                     |

## SectionGroup

一組 Section，上方右側有「全部展開」與「全部收合」兩個按鈕，各帶圖示；全部已展開時「全部展開」停用，全部已收合時「全部收合」停用。

```js
h(
  UI.SectionGroup,
  { actions: h(UI.Button, { icon: 'link' }, '複製連結') },
  h(UI.Section, { title: '元件', summary: '6 個元件、138 個函式', defaultOpen: true }, '…'),
  h(UI.Section, { title: '進入與結束', summary: '2 個進入點', defaultOpen: true }, '…'),
  h(UI.Section, { title: '外部指令', summary: '29 個指令', lazy: true }, '…'),
);
```

- `actions`：同一列、兩個按鈕左邊的其他控制項。
- 受控的 Section 也會收到「全部展開／全部收合」：由它的 `onOpenChange` 處理。
