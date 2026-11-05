# Alert

頁面或區塊內持續顯示的提示：白底卡片，上緣一條 3 px 狀態色條。

- 外型：`surface` 底色、`shadow-card` 陰影、`radius-md` 圓角；上緣色條高度 `alert-bar` 3 px，圖示與色條同色。
- 四種 `tone`：`info`（`accent`）、`success`、`warning`、`danger`。
- 關閉：只有 `info` 與 `success` 會顯示右上角的關閉按鈕（需傳入 `onDismiss`）；`warning` 與 `danger` 不能關閉。
- 動作：用外框按鈕放在右側（`actionLabel`、`onAction`），按鈕文字只用動詞。
