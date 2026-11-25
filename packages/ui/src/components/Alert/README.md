# Alert

## 用法

頁面或區塊內持續顯示的提示：白底卡片，左邊狀態圖示。操作完成的短暫提示用 Toast；要使用者決定的用 Dialog。

```tsx
<Alert tone="warning" title="憑證 3 天後到期" actionLabel="更新" onAction={renew}>
  到期後 api-gateway 會拒絕連線。
</Alert>
```

- 四種 `tone`：`info`、`success`、`warning`、`danger`。
- 只有 `info` 與 `success` 能關閉（傳 `onDismiss`）；`warning` 與 `danger` 不能關閉。
- 動作是內文下方的 40 px 外框按鈕（`actionLabel`、`onAction`），文字只用動詞；有沒有「✕」都從同一個位置開始。
- 本身就是卡片：單獨使用時不再包一層 Card；放進 Card 時自動拿掉陰影。

## 細節

- 外型：`surface` 底色、`shadow-card` 陰影、`radius-md` 圓角，沒有色條；狀態只靠圖示（形狀不同）和它的顏色，`info` 的圖示是 `accent-text`。
- 「✕」40 px，在右上角。
