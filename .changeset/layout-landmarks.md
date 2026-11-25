---
'@seanyeh77/ui': minor
---

Workbench 和 ConsoleLayout 的地標完整（axe 的 region、page-has-heading-one 不再失敗）：Workbench 的 `brand` 名稱是 `h1`，主畫面和它上方的列在 `main` 裡（名稱是 `label`），各邊界放在它調整的區塊裡；外框不再是帶名稱的 `group`。ConsoleLayout 的底列也在 `main` 裡，手機上頂列以下整欄都在 `main`。外觀不變。Workbench 用 `storageKey` 記住版面，和其他會記住選擇的元件同名；沒給時只記到重新整理為止。`id` 已棄用，仍然可用（存的資料相同），開發時 console 會提醒改名。
