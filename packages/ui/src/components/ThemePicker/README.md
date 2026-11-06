# ThemePicker

主題選擇：自動、淺色、深色三張預覽卡片，放在設定頁的「外觀」。

- 每張卡片有一張小縮圖：自動是左上淺色、右下深色。
- 選中的卡片用 2 px 強調色外框，文字變粗。
- 不傳 `onChange` 時會直接呼叫 `UI.setTheme()`：在根元素設 `data-theme`，選擇存在 localStorage。
- 自動：跟著系統的 `prefers-color-scheme`，系統改變時也會跟著換。
- 切換時所有顏色用 300 ms 漸變；減少動態效果時直接切換。頁面載入時呼叫一次 `UI.initTheme()`。
