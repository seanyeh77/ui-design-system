# Toast

## 用法

操作完成後的短暫提示，出現在畫面右下角。持續顯示的提示用 Alert。

```tsx
{toast && <Toast actionLabel="復原" onAction={undo}>已刪除 3 筆</Toast>}
```

- 出現 3 s 後消失：頁面掛上它，3 s 後移除。
- 文字寫發生了什麼，用過去式：「已刪除 3 筆」。
- 附「復原」（`actionLabel="復原"`）。
- 內容是字串時，反引號包住的文字顯示成行內程式碼（InlineCode），不顯示反引號。

## 細節

- 卡片樣式：`surface` 底色、`line` 細框、`shadow-overlay` 陰影。
