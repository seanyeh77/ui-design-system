---
'@seanyeh77/ui': minor
---

版面、狀態與範本的全面修正。

- 新增 `Link`：文字連結，`accent-text` 色加底線，`external` 另開分頁並加圖示，`render` 給路由器的連結；沒有 class 的 `<a>`（Markdown、舊內容）也套用連結色，不再是瀏覽器預設的藍色。
- 新增 `PageHeader`：詳細頁的頁首（標題、狀態與一行資訊、一個主要按鈕、外框按鈕、「⋯」選單；手機上外框按鈕收進「⋯」）。標題只出現一次：詳細頁的標題給 PageHeader，AppShell 不給 `title`。
- 新增 `SettingsRow`：設定的一列（名稱、說明、右邊的 Switch），整列是 `<label>`。Switch 新增 `aria-describedby`。
- `Grid` 的 `columns` 可以給比例，例如 `[2, 1]`（主要內容加側欄），960 px 以下一欄。
- `Badge`：一律是狀態圓圈加文字，沒有底色和陰影；新增 `tone`（`neutral`、`info`、`success`、`warning`、`danger`）和 `closed`、`online`、`offline` 預設（型別 `BadgePreset`，`BadgeStatus` 仍是原本 5 種）；`fail` 的圓圈改成空心加 ×；只有 `warning`、`danger` 的文字上色加粗，`doing` 改成一般粗細。遷移：`variant` 已停用，直接拿掉；放在頁面上（不在 Card、DataTable 裡）的 Badge 不再是浮起的 Chip。
- `Tag`：`variant="forecast"` 換成 `icon="trend-up" tone="info"`，`variant="demo"` 換成 `icon="info"`；舊寫法這一版仍可用，開發模式會提醒。
- `AppShell`、`TopBar`：新增 `tags`（標題旁，例如「示範資料」）；`breadcrumb` 停用（麵包屑放在內容最上方的 `<Breadcrumb>`）；`<main>` 加上 `id="main"`；頂部列標題至少保留完整寬度或 45 %，專案切換器先縮。
- `ProjectSwitcher`：狀態改用 Badge 的圓圈；放不下時狀態文字整段拿掉，名稱只用一個「…」截斷。
- `Card`：標題至少保留 8 個字，放不下時 `actions` 換到標題下一列靠右。
- `Alert`：拿掉上緣色條；動作按鈕 40 px，移到內文下方（有沒有「✕」都對齊）；「✕」40 px。
- `EventTimeline`：`kind` 可以是任何字串，新增 `kinds`（圖示、名稱、tone）與 `actor`；跨好幾天時每天上方有日期。
- `SettingsLayout`：選中的分類寫進網址 hash（`urlSync`，給了 `value` 時不寫），換分類時念出名稱；手機上卡片撐滿寬度；內容最寬 760 px，卡片間距 32 px；在 AppShell 裡標題重複時提醒。`SettingsSection` 與 `DangerZone` 標題 17 px；`DangerZone` 改成卡片陰影、只有標題是紅色。
- `SideNav`：底部的圖釘和收合圖示 22 px，和項目圖示對齊。`NotificationBell` 的名稱改成「通知中心」。
- `CodeView`：沒有 `file` 或 `title` 時是以語言命名的 group（不是 landmark）；註解不再用斜體。
- 強制色彩模式（Windows 高對比）：焦點、選取指示、勾選與開關、狀態圓點和卡片邊緣都看得到。
