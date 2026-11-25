# NotificationBell

## 用法

頂部列的通知鈴鐺與通知中心，放在 AppShell 或 TopBar 的右側。

```tsx
<AppShell actions={<NotificationBell items={notifications} onOpen={open} onReadAll={readAll} />} …>
```

- 鈴鐺上有紅色數字角標（`danger`），超過 99 顯示 99+；沒有未讀時不顯示。
- 通知依時間分組（`group`，例如「今天」、「更早」），由新到舊。
- 點一則通知交給 `onOpen` 處理（通常是標成已讀並前往）。
- 通知的 `body` 裡反引號包住的文字顯示成行內程式碼（InlineCode），不顯示反引號。

## 細節

- 點鈴鐺從下方彈出 360 px 的面板，點外面或按 Esc 關閉。
- 未讀通知左側有強調色圓點。
- 「全部標為已讀」在面板標題列右側，有未讀時才出現。
- 鈴鐺和面板的名稱是「通知中心」，有未讀時念「通知中心，3 則未讀」；避免和設定頁的「通知」分類同名。
