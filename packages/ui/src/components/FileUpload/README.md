# FileUpload

## 用法

檔案上傳：一行拖放區，下方列出檔案與進度。上傳本身由頁面實作。

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

## 細節

- 拖放區是一行虛線框：「拖放檔案，或 選擇檔案」；拖到上方時框變強調色、底色變淺。
- 每個檔案：名稱、大小、8 px 進度條（百分比在下方），完成時變綠並顯示「完成 ✓」。
- 每個進度條的無障礙名稱是「檔名 上傳進度」，螢幕閱讀器分得出是哪個檔案。
- 失敗：檔案外框變紅，下方紅字寫原因。
