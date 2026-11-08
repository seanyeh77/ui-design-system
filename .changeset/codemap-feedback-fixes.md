---
'@seanyeh77/ui': patch
---

Fixes from codemap's first-time-user feedback. Tabs: `unit` (and `TabItem.unit`) after each count, with a dev warning when a count has none. DataTable: `summary.unit` (default 「筆」) after the summary counts, 「筆」 after view counts, and no 「第 1–6 筆，共 6 筆」 line when everything fits on one page. LayerGraph: the legend lists only the kinds of line the diagram has; edge aria-labels drop the backticks; the 「左右滑動」 hint sits under the diagram instead of over a box and keeps its space after the first scroll. CodeView: the language reads 「C 語言」 instead of a lone 「C」, as plain muted text, and screen readers hear 「程式語言：C 語言」.
