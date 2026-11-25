# ThemePicker

## 用法

主題選擇：自動、淺色、深色三張預覽卡片，放在設定頁的「外觀」，不放在頂部列。

```tsx
initTheme(); // 頁面載入時一次

<ThemePicker />;
```

- 不傳 `onChange` 時直接呼叫 `setTheme()`：在根元素設 `data-theme`，選擇存在 localStorage。伺服器渲染和瀏覽器第一次渲染都先選「自動」，接手後才顯示存下的選擇，不會有 hydration 不一致。
- 用了 preset（`initTheme({ preset: 'teaching' })`）時，preset 只有淺色：選擇會記住，畫面維持 preset。
- 頁面載入時呼叫一次 `initTheme()`。
- 自動：跟著系統的 `prefers-color-scheme`，系統改變時也會跟著換。

## 細節

- 每張卡片有一張小縮圖：自動是左上淺色、右下深色。
- 選中的卡片用 2 px 強調色外框，文字變粗。
- 切換時所有顏色用 300 ms 漸變；減少動態效果時直接切換。
