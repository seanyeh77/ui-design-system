# SettingsLayout

## 用法

設定頁：左側分類，右側內容；改完自動儲存，沒有「儲存」按鈕。

```tsx
<SettingsLayout
  categories={[
    { id: 'general', label: '一般', content: <SettingsSection title="個人資料">…</SettingsSection> },
    { id: 'account', label: '帳號', content: <DangerZone description="刪除後無法復原。" actionLabel="刪除帳號" confirm={{ title: '刪除帳號？' }} onAction={remove} /> },
  ]}
/>
```

- 每個分類的內容用 `SettingsSection` 分成卡片；SettingsSection 本身就是卡片，不再包 Card。
- 自動儲存：使用者改完就存，右下角出現 Toast「已儲存」（`toast`），3 s 後消失。
- 刪除帳號這類操作放在最後一個分類的最下方，用 `DangerZone` 紅框隔開，按下後先跳確認對話框。
- 主題與強調色放在「外觀」分類（ThemePicker、AccentPicker）。

## 細節

- 分類清單 180 px，選中的分類有左側強調色指示條；手機寬度時改成上方橫向分類。
