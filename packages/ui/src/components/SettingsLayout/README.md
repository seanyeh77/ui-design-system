# SettingsLayout

## 用法

設定頁：左側分類，右側內容；改完自動儲存，沒有「儲存」按鈕。

```tsx
<SettingsLayout
  categories={[
    {
      id: 'notifications',
      label: '通知',
      content: (
        <SettingsSection title="通知">
          <SettingsRow label="部署失敗時寄 Email" description="寄到帳號的 Email。">
            <Switch label="部署失敗時寄 Email" checked={mail} onChange={saveMail} />
          </SettingsRow>
        </SettingsSection>
      ),
    },
    { id: 'account', label: '帳號', content: <DangerZone description="刪除後無法復原。" actionLabel="刪除帳號" confirm={{ title: '刪除帳號？' }} onAction={remove} /> },
  ]}
/>
```

- 每個分類的內容用 `SettingsSection` 分成卡片；SettingsSection 本身就是卡片，不再包 Card。
- 開關用 `SettingsRow`：左邊名稱和一句說明，右邊 Switch，整列是 `<label>`，點文字也會切換。Switch 的 `label` 和 SettingsRow 的 `label` 寫同一句。
- 什麼時候儲存：開關和選單改了就存；文字欄位離開欄位（blur）且驗證通過才存，不是每打一個字就存。存好後出現 Toast「已儲存」（`toast`），3 s 後消失。
- 刪除帳號這類操作放在最後一個分類的最下方，用 `DangerZone`，按下後先跳確認對話框。
- 放在 AppShell 裡時，標題給 AppShell（`title="設定"`），SettingsLayout 不給 `title`：標題只出現一次。
- 主題與強調色放在「外觀」分類（ThemePicker、AccentPicker）。
- SettingsSection 的 `description` 裡反引號包住的文字顯示成行內程式碼（InlineCode），不顯示反引號。

## 細節

- 分類清單 180 px，選中的分類有左側強調色指示條；手機寬度時改成上方橫向分類，內容的卡片撐滿寬度。
- 內容最寬 760 px（欄位不會拉到 1000 px 寬），卡片之間 32 px（`space-8`）。
- 選中的分類寫進網址的 hash（`#notifications`），重新整理或分享連結時打開同一個分類；`urlSync={false}` 關掉。給了 `value`（由外部控制）時不改網址。
- 換分類時螢幕閱讀器念出分類名稱（`announce`）。
- SettingsSection 標題 17 px（`text-title`），和 Card 標題相同。
