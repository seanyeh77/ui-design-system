# Tour

第一次使用的導覽：一次介紹一個地方，整頁變暗，只亮出要介紹的地方。

- 亮出的地方加 3 px 強調色框；說明卡放在它下方（放不下時換到上方），寬 320 px，寫「1 / 3」、標題和一兩句說明（說明裡的反引號會變成行內程式碼）。
- 按鈕：左邊「略過」，右邊「上一步」和主要按鈕「下一步」，最後一步是「完成」。按 Esc 等於略過。導覽進行時頁面不能操作。
- 用 `UI.useTour(key)` 記住這個瀏覽器看過了沒有：沒看過會自動打開，看完或略過後不再出現。
- 頁面上要有「重看導覽」（例如說明選單或頁面底部的連結），呼叫 `tour.start()`。
- `target` 可以是 CSS selector、ref 或元素；selector 會用第一個看得到的元素，所以 `'.ui-search, .ui-search-icon'` 在電腦和手機都會找到搜尋入口。找不到時說明卡放在畫面中間。
- 步驟最多 3 到 5 步，只介紹第一次看不出用法的地方。

```js
const tour = UI.useTour('codemap-flow');
h(UI.Tour, {
  open: tour.open, onClose: tour.close,
  steps: [
    { target: '.ui-search, .ui-search-icon', title: '搜尋', text: '搜尋函式、檔案、元件與環境變數。快捷鍵 Ctrl K。' },
    { target: '#flow-tree', title: '流程樹', text: '名稱旁的標籤是關係的來源，點選問號查看依據。' },
    { target: '#notes', title: '檢查筆記', text: '錯誤的位置附有修正建議，可直接複製。' }
  ]
}),
h('button', { className: 'ui-link-btn', onClick: tour.start }, '重看導覽')
```
