# FileUpload

## 用法

檔案上傳：一行拖放區，下方列出檔案與進度，上傳本身由頁面實作；只從按鈕或選單項目打開檔案選擇時改用 `useFilePicker`。

```tsx
<FileUpload
  files={files}
  onAdd={(added) => upload(added)}
  onRetry={(f) => retry(f.id)}
  limitText="PDF，最大 20 MB"
  accept=".pdf"
/>
```

- 用 `onAdd` 收到檔案，自己上傳，再更新 `files` 裡的 `progress`、`status`（`uploading`、`done`、`danger`）。失敗時把原因和修正方式寫在 `error`。
- 限制（類型、大小）寫在拖放區右邊（`limitText`）。
- 失敗時給 `error`：一句原因加修正方式，旁邊有「重試」。
- 從按鈕或選單項目打開檔案選擇（「開啟檔案」，沒有拖放區）用 `useFilePicker`，不自己放 `<input type="file">`：

```tsx
const picker = useFilePicker({ accept: '.json', onPick: (files) => load(files[0]) });
<Button onClick={picker.open}>開啟檔案</Button>
<Menu label="更多操作" items={[{ label: '開啟檔案', icon: 'folder-open', onSelect: picker.open }]} />
```

## `useFilePicker`

- 回傳 `{ open }`；選項 `accept`、`multiple`、`onPick(files)`（取消時不呼叫）。
- `open()` 要直接在點擊的處理函式裡呼叫（Button 的 `onClick`、Menu 項目的 `onSelect`）：瀏覽器只在使用者操作當下打開檔案選擇，先 `await` 再呼叫會被擋下。
- hook 自己管一個隱藏的 `<input type="file">`：第一次 `open()` 時放進 `document.body`，元件卸載時移除；伺服器渲染時不碰 document。選完會清空，同一個檔案可以再選一次。

## 細節

- 拖放區是一行虛線框：「拖放檔案，或 選擇檔案」；拖到上方時框變強調色、底色變淺。
- 每個檔案：名稱、大小、8 px 進度條（百分比在下方），完成時變綠並顯示「完成 ✓」。
- 每個進度條的無障礙名稱是「檔名 上傳進度」，螢幕閱讀器分得出是哪個檔案。
- 失敗：檔案外框變紅，下方紅字寫原因。
