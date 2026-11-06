# InlineCode

句子裡的程式碼、檔案路徑和 ID。

- 外觀：淺灰底（`surface-sub`）、Geist Mono、字級是周圍文字的 0.875 倍，圓角 4 px，左右 5 px 內距。
- 指向某個地方的（例如檔案和行號 `child.c:86`）是連結：強調文字色（`accent-text`）加底線，給 `href` 或 `onClick`。
- 24 個字元以內的不會從中間斷行（例如 `h->post_send` 不會斷成 `h-` 和 `>post_send`）；更長的路徑才會換行。
- Geist Mono 只用在程式碼本身，周圍的中文句子維持一般字體。

```js
h(UI.InlineCode, null, 'IBTRACE_SHM')
h(UI.InlineCode, { href: '/code/child.c#L86' }, 'child.c:86')
```

## CodeText

把含有反引號的文字（例如來自 Markdown 的筆記）轉成一般文字加 InlineCode，畫面上不會出現反引號。

```js
h(UI.CodeText, {
  text: '`ibmon_spawn` 在 `child.c:86` 設定 `IBTRACE_SHM`',
  refHref: function (ref) { return '/code/' + ref; }   // 或 onRef(ref)
})
```

- 看起來像「檔名:行號」或「檔名:起-迄」的片段（`trace.c:321-322`）會變成連結；其他片段是一般的行內程式碼。用 `isRef` 可以改判斷方式。
- 沒有給 `refHref` 或 `onRef` 時，全部都是一般的行內程式碼。
