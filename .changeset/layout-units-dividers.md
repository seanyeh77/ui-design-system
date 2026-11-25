---
'@seanyeh77/ui': minor
---

數字和單位不再分開換行：`format.fileSize`、`format.compact`（萬、億）、`format.money`（NT$ 後面）改用不換行空格（U+00A0），元件收的字串（說明、提示、EventTimeline 的事件文字、FileUpload 的 `limitText`）也自動把「數字 單位」之間的空格換成不換行空格。比對這些字串的測試要改用 ` `。ZoneMap 數值和單位之間的空格改用單位的字型（Inter），不再是 Geist Mono h2 大小約 20 px 的空隙。SplitPane、Workbench 的邊界和 LayerGraph 的高度把手可以不拖曳調整（WCAG 2.5.7）：點一下依序切換最小、預設、預設的 1.5 倍（LayerGraph：最矮、畫出的高度、最高），念出新的大小，操作方式寫在 `aria-description`。
