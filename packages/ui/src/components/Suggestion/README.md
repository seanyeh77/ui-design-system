# Suggestion

## 用法

修正建議：發現寫錯的地方時，直接給出建議的寫法，可以一鍵複製。

```js
h(UI.Suggestion, {
  before: '`flush_ring` 在 `ring.c:96` 把資料寫回檔案。',
  after: '`flush_ring` 在 `ring.c:104` 把資料寫回檔案。',
});
```

- 上下兩行：舊的在上（「−」，淡紅底），新的在下（「+」，淡綠底）。
- 只有新的寫法、沒有舊的時，不給 `before`。
- 反引號包起來的部分是行內程式碼；檔案和行號可以用 `refHref` 或 `onRef` 變成連結（同 CodeText，也可以給 `isRef`）。

## 細節

- 舊的底色 `danger-soft`，新的 `success-soft`。螢幕閱讀器會念「原本：」和「改成：」。
- 文字用一般字體。
- 右上角是複製圖示（提示「複製修正」）。按了把 `copyText`（預設是 `after` 原文，保留反引號，方便貼回 Markdown）複製到剪貼簿，圖示變成綠色的勾、提示寫「已複製」，2 秒後恢復。
