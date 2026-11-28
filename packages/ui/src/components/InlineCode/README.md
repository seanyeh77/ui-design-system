# InlineCode

## 用法

句子裡的程式碼、檔案路徑和 ID。含反引號的整段文字用 CodeText；多行程式碼用 CodeView。

```tsx
<InlineCode>APP_SHM</InlineCode>
<InlineCode href="/code/child.c#L86">child.c:86</InlineCode>
<InlineCode look="name" href="#fn/_sync_as">VirtualRouter._sync_as</InlineCode>
<InlineCode look="location" onClick={openLine}>harness/controller.py:540</InlineCode>
```

- 指向某個地方的（檔案和行號、函式）是連結：給 `href` 或 `onClick`。
- `look="name"`：函式、類別、變數；`look="location"`：檔案和行號。兩種都一定要給 `href` 或 `onClick`；不指向任何地方的維持灰底（預設 `look="chip"`）。
- Geist Mono 只用在程式碼本身，周圍的中文句子維持一般字體。

## 細節

- 外觀：淺灰底（`surface-sub`）、Geist Mono、字級是周圍文字的 0.875 倍，圓角 4 px，左右 5 px 內距。
- 在表格裡（DataTable 的格子與展開詳細、Markdown 表格）改成白底（`surface`）加 1 px 框線（`line`）：表格的偶數列也是 `surface-sub`，灰底在那裡看不出範圍。
- 指向某個地方的（例如檔案和行號 `child.c:86`）是連結：強調文字色（`accent-text`）加底線，給 `href` 或 `onClick`。
- 24 個字元以內的不會從中間斷行（例如 `h->post_send` 不會斷成 `h-` 和 `>post_send`）；更長的路徑才會換行。
- Geist Mono 只用在程式碼本身，周圍的中文句子維持一般字體。

## 名稱與位置

一段說明裡常常同時出現程式的名稱和它所在的檔案，例如「`VirtualRouter._sync_as` `harness/controller.py:540` 呼叫 …」。這兩種連結用 `look` 換成不同外觀，不再是兩個一樣的灰底底線塊：

- `look="name"`：函式、類別、變數，點了跳到定義。強調文字色（`accent-text`）的 Geist Mono，周圍文字的 0.875 倍，沒有底色也沒有底線；滑過或鍵盤焦點時出現 1 px 底線（離文字 3 px），焦點另有和其他控制項一樣的 2 px `focus` 外框。
- `look="location"`：檔案和行號。灰色（`ink-muted`）、13 px（次要文字的大小，比內文小一號），不斷行；滑過或焦點時變強調文字色加底線。空間不夠時（DataTable 的手機卡片，值的那一欄比路徑窄）不超出，改用「…」截斷：先截資料夾，留下檔名和行號（`codemap/…/tshelper.ts:42`），檔名本身也放不下時截在檔名尾端；截斷時滑過、點一下或鍵盤焦點會用 Tooltip 顯示完整路徑，點擊照樣前往連結，螢幕閱讀器念的名稱仍是完整路徑。桌面的表格和句子裡維持原樣。
- 兩種都一定要給 `href` 或 `onClick`，沒有的話 TypeScript 不會編譯：不指向任何地方的文字維持灰底（預設的 `look="chip"`）。
- 深色模式下在表格的灰色列（`surface-sub`）上，文字色混入 25% 的 `ink`，對比維持 4.5:1 以上。

```js
h(
  'p',
  null,
  h(UI.InlineCode, { look: 'name', href: '#fn/_sync_as' }, 'VirtualRouter._sync_as'),
  ' ',
  h(UI.InlineCode, { look: 'location', onClick: openLine }, 'harness/controller.py:540'),
  ' 每 5 秒同步一次路由。',
);
```

`UI.Markdown` 和 `CodeText` 會自動用位置外觀（Markdown 也會用名稱外觀），見各自的說明。

## CodeText

把含有反引號的文字（例如來自 Markdown 的筆記）轉成一般文字加 InlineCode，畫面上不會出現反引號。

```js
h(UI.CodeText, {
  text: '`worker_spawn` 在 `child.c:86` 設定 `APP_SHM`',
  refHref: function (ref) {
    return '/code/' + ref;
  }, // 或 onRef(ref)
});
```

- 看起來像「檔名:行號」或「檔名:起-迄」的片段（`trace.c:321-322`）會變成位置連結（`look="location"`：灰色 13 px，滑過或焦點時變強調色加底線）；其他片段是一般的行內程式碼。用 `isRef` 可以改判斷方式。
- 沒有給 `refHref` 或 `onRef` 時，全部都是一般的行內程式碼。

引用連結：

- `refHref(ref)` 回傳網址就是連結；回傳 `undefined` 表示這個引用沒有目標，顯示成一般的行內程式碼。
- `onRef(ref, event)`：點擊時呼叫，元件會先 `preventDefault()`，網址和 hash 不會改變；按住 Ctrl、⌘、Shift 或用滑鼠中鍵時仍照 `href` 開新分頁。
- `isRef(span)`：決定哪些反引號內容算引用，預設是 `檔名.副檔名:行號`。`UI.Suggestion` 和 `UI.Term` 也接受同樣的 `refHref`、`onRef`、`isRef`。

## 觸控

- 觸控螢幕上，單獨出現的連結（旁邊沒有文字，例如卡片裡一行只有 `child.c:86`）點擊範圍擴大到至少 48 × 48 px，外觀不變；句子裡的連結維持行高，照 WCAG 2.2 的行內例外。
- 深色模式的連結文字色混入 25% 的 `ink`，在淺灰底上對比至少 4.5:1。
