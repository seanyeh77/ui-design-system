---
'@seanyeh77/tokens': minor
'@seanyeh77/ui': minor
---

新增 `fonts-latin.css`（Inter、Geist Mono）和 `fonts-tc.css`（Noto Sans TC）：主 CSS 只放前者，中文字型的 CSS 另外非同步載入，不再擋住第一次畫面（做法見 AGENTS.md）。`fonts.css` 不變。
