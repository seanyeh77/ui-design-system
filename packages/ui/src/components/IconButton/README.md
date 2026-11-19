# IconButton

只有圖示的按鈕，一定要有 `label`。

- `label` 會成為 `aria-label` 與提示（Tooltip），寫成動作：「收合側邊欄」、「關閉」。不需要提示時設 `tooltip={false}`。
- 外框 `line-strong`，尺寸與 Button 同高（40 px）。
- 側邊欄的收合按鈕是例外：放在側邊欄左下角，無外框，收合後圖示左右翻轉。
- `icon`（必填）：Phosphor 圖示名稱，例如 `'trash'`；或自訂圖示的 24 px path。
- `filled`：用內建圖示的實心版，給按下（`aria-pressed`）或選取中的按鈕，例如 LayerGraph 的標籤按鈕。

```tsx
<IconButton icon="pencil-simple" label="編輯 api-gateway" onClick={edit} />
```

## 第一次使用的提示（hint）

給「說明」或「導覽」按鈕一個第一次使用的提示：按鈕右上角一個強調色圓點，按鈕左邊一個深色泡泡寫一句話，加上「開始」和 ×。

- 圓點 10 px，`accent` 色，外圈 2 px 是按鈕所在的背景色（TopBar 裡是 `surface-chrome`，其他地方是 `bg`），在任何底色上都看得出邊界。
- 泡泡在按鈕左邊、和按鈕同一列（垂直置中），箭頭向右指向按鈕，所以不會蓋到列下方的東西（例如 Workbench 的 `mainBar`）；會蓋住同一列左邊的按鈕，直到使用者按「開始」或 ×。泡泡的寬度縮到按鈕左邊的空間，文字換行；左邊不到 180 px 時（很窄的手機，或按鈕在畫面左側）改放在按鈕下方，保持在畫面內。深色底（`ink`）淺色字（`bg`），13 px，寬度最多 320 px。
- 泡泡是 `role="status"`，按鈕用 `aria-describedby` 指向它：螢幕閱讀器到按鈕時會念出提示。
- 圓點和泡泡一直留著，直到使用者按「開始」或 ×；之後傳 `undefined`，提示就消失。記住「已處理」是呼叫端的事：導覽用 `useTour` 的 `tour.hint()` 就會記住。
- 取代頁面上「第一次使用」的橫幅。

```tsx
const tour = useTour('codemap-flow');
<IconButton icon="question" label="導覽" onClick={tour.start} hint={tour.hint('導覽：五個步驟介紹各頁。')} />
<Tour open={tour.open} onClose={tour.close} steps={steps} />
```

`hint` 也可以自己給：`{ text, action, onAction, onDismiss }`，`action` 預設「開始」。

## 安靜樣式（variant="quiet"）

頂列、分頁列這類一排好幾個按鈕的地方用 `variant="quiet"`：32 px、沒有外框，滑過、按下或鍵盤焦點時才有底色，圖示是次要文字色。觸控螢幕上點擊範圍仍是 48 px。

```tsx
<IconButton variant="quiet" icon="magnifying-glass" label="搜尋" />
```

切換類的按鈕（例如收合面板）加 `aria-pressed`，按下時圖示變成主要文字色。
