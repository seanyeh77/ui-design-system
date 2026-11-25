---
'@seanyeh77/ui': minor
---

照一致的命名：NotificationBell 的面板用 `open`、`defaultOpen`、`onOpenChange`，點一則通知是 `onSelect(item)`（之後面板關閉）；`onOpen` 已棄用，仍然可用。SideNav 用 `collapsed` 加 `onCollapsedChange(collapsed)`、`pinned` 加 `onPinnedChange(pinned)`；`onToggle`、`onPin` 已棄用，仍然可用。棄用的名稱在開發時 console 提醒改名。
