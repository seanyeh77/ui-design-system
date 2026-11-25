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
- 開關用 `SettingsRow`：左邊名稱和一句說明，右邊 Switch，整列是 `<label>`，點文字也會切換。Switch 的 `label` 和 SettingsRow 的 `label` 寫同一句。SettingsRow 裡不放按鈕（點整列都會按到它）；整個區塊的操作（「還原預設」）給 SettingsSection 的 `actions`，用 `quiet` 按鈕，在標題列右端。
- 什麼時候儲存：開關和選單改了就存；文字欄位離開欄位（blur）且驗證通過才存，不是每打一個字就存：用 `useFormErrors`，`onBlur={() => form.onBlur('name') && save()}`（`onBlur` 回傳欄位是否正確）。存好後呼叫 `toast('已儲存', { id: 'saved' })`，連續修改時同一則重新計時；AppShell 裡不用另外放 `<Toaster />`；不用 `toast` prop（deprecated）。
- 刪除帳號這類操作放在最後一個分類的最下方，用 `DangerZone`，按下後先跳確認對話框。
- 主題與強調色放在「外觀」分類（ThemePicker、AccentPicker）。
- 網址：選中的分類寫進 hash（`#settings-notifications`），重新整理或分享連結時打開同一個分類。用 hash 當路由的 SPA（網址是 `#/settings`）會自動不寫；其他情況要關掉給 `urlSync={false}`，由外部控制時給 `value` 和 `onChange`。

## 細節

- 分類清單 180 px，選中的分類有左側強調色指示條；手機寬度時改成上方的 `Tabs`（和其他分頁同一個樣式，放不下時左右捲動），內容的卡片撐滿寬度。
- 內容最寬 760 px（欄位不會拉到 1000 px 寬），卡片之間 32 px（`space-8`）。
- hash 也讀沒有前綴的寫法（`#notifications`）。給了 `value`（由外部控制）時不改網址。
- 換分類時螢幕閱讀器念出分類名稱（`announce`）。
- SettingsSection 標題 17 px（`text-title`），和 Card 標題相同。
