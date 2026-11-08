# SplitPane

主要區域和側邊面板並排，中間的分隔線可以拖拉，調整面板寬度。用在需要看長內容的面板，例如程式碼、詳細資料。

```tsx
<SplitPane
  a={<Card title="架構">…</Card>}
  b={<CodeView file="src/libibtrace/shm.c" code={code} />}
  defaultB={420}
  minA={360}
  minB={280}
  storageKey="code-panel"
/>
```

## 版面

- `a` 是主要區域（左），`b` 是側邊面板（右）。分隔線改的是面板的寬度：`defaultB`（px，預設 420）是一開始的寬度。
- 兩邊都有最小寬度：`minA`（預設 360 px）、`minB`（預設 280 px）。拖拉、方向鍵都不會讓任何一邊比最小寬度窄；容器變窄時，面板先變窄。
- 分隔線是兩欄之間 16 px 的空隙，中間一條 1 px 的線（`line`），線的正中間有一個 10 × 40 px 的白色膠囊把手（`surface` 底、1 px `line` 外框、3 個直排的 3 px 圓點，`line-strong`），讓人看得出可以拖。滑過、拖拉中或用鍵盤移到時，線變成 3 px 強調色，把手的外框和圓點也變強調色。可以點的範圍是 48 px 寬，整條線都可以拖，不只把手。
- 寬度小於 960 px 時（看 SplitPane 自己的寬度，不是視窗），兩邊改成上下排列，面板在下面、佔滿寬度，不顯示分隔線。

## 操作

- 滑鼠或觸控：按住分隔線左右拖拉。拖拉時游標是左右箭頭，頁面上的文字不會被選到。
- 雙擊分隔線：回到 `defaultB`。
- 鍵盤：Tab 移到分隔線，← → 每次 16 px（← 讓面板變寬），Home 讓面板最寬（主要區域剩最小寬度），End 讓面板最窄，Enter 回到 `defaultB`。按住 Alt、⌘ 或 Ctrl 時不處理。
- 每次改變後呼叫 `onResize(寬度)`。

## 記住寬度

- 給 `storageKey` 時，面板寬度存在 `localStorage`（鍵名 `ui-split:` 加上 `storageKey`），下次打開時還原。沒給時重新整理後回到 `defaultB`。
- 讀寫 `localStorage` 失敗（瀏覽器封鎖、空間已滿）時照常運作，只是不會記住。

## 無障礙

- 分隔線是 `role="separator"`、`aria-orientation="vertical"`，名稱預設「調整面板寬度」（`label`）。
- `aria-valuenow` 是主要區域的寬度（px），`aria-valuemin` 是 `minA`，`aria-valuemax` 是面板最窄時主要區域的寬度；`aria-valuetext` 念「主要區域 764 px，面板 420 px」。`aria-controls` 指向面板。
