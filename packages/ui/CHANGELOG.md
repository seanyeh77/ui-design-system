# @seanyeh77/ui

## 0.8.1

### Patch Changes

- 339b776: 焦點救援（ActionBar、Tabs）：按下後變成停用的按鈕，焦點有時沒有移到旁邊的按鈕、留在 `body`。瀏覽器在下一次畫面更新時才把焦點移走，現在會在那時再檢查一次。
- 09d1537: CommandPalette、Tour：關閉時如果有關閉動畫，或電腦比較慢，焦點有時留在 `body`，沒有回到開啟的按鈕或新頁面的標題。現在關閉後會每一格畫面檢查，直到視窗真的移除（最多 2 秒）；焦點掉到 `body` 時移回開啟的按鈕，按鈕不在了就移到主要內容的標題。

## 0.8.0

### Minor Changes

- 68b7c0f: DataTable：欄位新增 `hidden?: boolean`（預設 `false`）。設為 `true` 的欄位一開始不顯示，仍列在「欄位」選單裡，勾選後顯示；給新的 `resetKey` 時欄位的勾選回到預設。

## 0.7.1

### Patch Changes

- 6119d5e: LayerGraph：標籤避開所有的線。往上的線的標籤一行放不下時換成 2 到 4 行，還是沒有位置就把兩層之間的空隙加高（每次 24 px，最多 144 px）；往下的線的標籤也一樣，先換到箭頭另一側。數字和單位不拆開。範例加上同一對方框同時有往下和往上的線、手機寬度的例子。

## 0.7.0

### Minor Changes

- e991df7: Accessibility from codemap's screen-reader, tablet and phone run. New `announce(text)` (one polite live region) and `focusMain()`. Focus never falls to the page: Tour and CommandPalette give it back to their opener on close (or move it to the new page's title when the opener is gone), Tabs keep it on the selected tab, ActionBar hands it to a neighbour when the pressed button goes away or turns disabled. Components announce: TreeList 「已展開，3 個子項目」, DataTable 「顯示 6 筆」, CommandPalette 「找到 6 筆結果」 and 「找不到…」, Tabs and SideNav the new page. AppShell has a 「跳到主要內容」 skip link. LayerGraph's line buttons sit in a group instead of an image, and labels are not read twice. CodeView reads line by line (「第 62 行」, not copied), names its code block, marks the target with `aria-current` and gets `ref.focusTarget()`. TreeList names are 「名稱，meta，path」, children sit in `role="group"`. Term reads 「說明 caller」, Tour 「第 1 步，共 5 步」, Tabs 「全部 26 個」. Touch screens: a Tooltip closes on a tap elsewhere or a scroll.
- 4f5890f: LayerGraph: a 「圖／清單」 switch shows every box and line as a selectable text list (`listView`, `listLabels`); the sideways scroll is remembered when the diagram comes back (`scrollKey`); a line up a layer keeps its label beside the lane, between the layers, instead of widening the diagram. AppShell: from 600 to 1024 px there is no sidebar; TopBar's new `onMenu` button opens the navigation in a drawer from the left (Drawer's new `side`).

## 0.6.1

### Patch Changes

- 2e8d631: MobileTabBar: back to icons only (T0), as before 0.6.0: no names under the icons, each tab named by its `aria-label`, the bar 60 px tall.

## 0.6.0

### Minor Changes

- 8f9e284: LayerGraph draws lines to a higher layer (for example a data channel back up through a shared item). The line leaves the source's side, runs up a lane beside the boxes and enters the target's side, the arrow pointing at the box: the left lane when the target is the leftmost box of its layer, the right lane otherwise, and from below when the target sits between two boxes. The diagram widens on that side; the label sits outside the lanes and never covers a box, another label or a line. These lines are selectable like the others (`selectedEdge`, `onSelectEdge`, hover, keyboard).
- f920576: MobileTabBar: every tab shows its name under the icon (12 px; the bar is 64 px tall), and the name is its accessible name. Tour on phones: the target scrolls up under the top bar and the card sits below it, above the bottom tabs, never covering either; a target too tall for both gets the card over its lower part, still above the tabs. Tour: the target now scrolls fully into view on every width (a smooth scroll stopped halfway under the modal's scroll lock).

### Patch Changes

- 4e7a669: From codemap's touch, dark-mode and keyboard run. InlineCode: a link on its own (no text beside it) gets the 48 px touch area on touch screens, like Term; links inside a sentence keep their line. Dark mode: code links mix 25% `ink` into `accent-text` and reach 5:1 on their chip (4.18:1 before). CodeView: a wrapped line's continuation has a 2 px bar in its indent, and lines break after commas, dots, opening brackets and operators, never inside `->`, `==` or `&&`. Scroll hint: 「向右捲動」 with a mouse, 「左右滑動」 on touch screens. CommandPalette: screen readers hear the kind first, 「環境變數 IBTRACE_SHM」, without the extra comma.
- 76f204a: LayerGraph: on touch screens the shared-item boxes no longer cover the whole page. Their enlarged touch area (::after) measured against the window because the box was `position: static`; it is `relative` now. Tooltip: closes when its trigger loses focus, only one is open at a time, and a closing Tooltip leaves at once instead of waiting for its entrance animation, so tabbing through cut-off DataTable cells no longer leaves Tooltips stacked. ui check: reports touch areas larger than their own control (they cover other controls) and no longer counts them as big enough targets.

## 0.5.0

### Minor Changes

- e17cbf2: DataTable: a long cell cut off on desktop shows its whole text in a Tooltip on hover or keyboard focus. A table wider than its container (e.g. beside a detail panel) gets a fade on the right edge and a 「左右滑動」 hint under it until the first sideways scroll. LayerGraph: shared items are small boxes under the diagram, selectable with the same `selected` and `onSelect`; the boxes that use the selected one show 「使用 N 次」 (`useLabel`). Tooltip: `wrap` for long text and `disabled`.

### Patch Changes

- 87d835f: Fixes from codemap's first-time-user feedback. Tabs: `unit` (and `TabItem.unit`) after each count, with a dev warning when a count has none. DataTable: `summary.unit` (default 「筆」) after the summary counts, 「筆」 after view counts, and no 「第 1–6 筆，共 6 筆」 line when everything fits on one page. LayerGraph: the legend lists only the kinds of line the diagram has; edge aria-labels drop the backticks; the 「左右滑動」 hint sits under the diagram instead of over a box and keeps its space after the first scroll. CodeView: the language reads 「C 語言」 instead of a lone 「C」, as plain muted text, and screen readers hear 「程式語言：C 語言」.

## 0.4.1

### Patch Changes

- 74d39d3: LayerGraph: a diagram wider than its box keeps scrolling at full size, now with a fade on the right while more is to the right and a 「左右滑動」 hint until the first scroll. Hovering a selectable line makes it darker and 2 px thicker and underlines its label.
- b036f55: Tour: measure the card when its popup mounts. 0.4.0 measured too early, saw a 0 px card and put it above a target almost as tall as the window, so it ran off the top. Now neither side fits and the card sits inside the target at the bottom center of the window.

## 0.4.0

### Minor Changes

- 9dc8165: LayerGraph: selectable edges. `LayerGraphEdge.id` (default `${from}->${to}`), controlled `selectedEdge` and `onSelectEdge`. A click on a line or its label selects it; again, or on the empty diagram, clears it. Tab, Enter or Space and Escape work on lines. Selecting a line clears the selected box and the other way round. Without `onSelectEdge` nothing changes.
  
  ui check lists LayerGraph's selectable lines as exempt touch targets: the label is the touch target.

### Patch Changes

- 5c08281: Tour: the card always stays inside the window, 12 px (`--space-3`) from every edge. When neither side of the target has room, it sits inside the target at the bottom center of the window; a card taller than the window scrolls its text and keeps the buttons at the bottom. A target taller than the window scrolls into view from its top.

## 0.3.0

### Minor Changes

- 9e7a950: Breaking: DataTable `format: 'percent'` no longer adds the % sign; add `unit: '%'` (as KpiCard). Rows hidden by filters, search, views or the summary are unchecked, so `bulkActions` only gets visible rows. Drawer `actions` can be `(requestClose) => …` so the footer 取消 asks before discarding changes. A collapsed SideNav parent opens its first page. Every check box uses the same drawn check, drawn only when it turns on.
  
  New ESLint rule `ui/no-tailwind-defaults` (error in `recommended`): Tailwind's own palette, radii and shadows, in className and in cn()/clsx()/cva() calls.
