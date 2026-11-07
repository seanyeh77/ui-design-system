# IconButton

只有圖示的按鈕，一定要有 `label`。

- `label` 會成為 `aria-label` 與提示（Tooltip），寫成動作：「收合側邊欄」、「關閉」。不需要提示時設 `tooltip={false}`。
- 外框 `line-strong`，尺寸與 Button 同高（40 px）。
- 側邊欄的收合按鈕是例外：放在側邊欄左下角，無外框，收合後圖示左右翻轉。
- `icon`（必填）：Phosphor 圖示名稱，例如 `'trash'`；或自訂圖示的 24 px path。

```tsx
<IconButton icon="pencil-simple" label="編輯 api-gateway" onClick={edit} />
```
