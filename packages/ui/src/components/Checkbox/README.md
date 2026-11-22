# Checkbox

## 用法

勾選框，取代瀏覽器原生的 checkbox。立即生效的設定用 Switch；從清單選多個用 MultiSelect。

```tsx
<Checkbox checked={agree} onChange={setAgree} label="同意服務條款" />
```

- 整列（框加文字）都可以點，高度 40 px。
- `checked="mixed"` 顯示橫線，給「只勾了一部分」的上層項目。
- 所有勾選框（包括表格的欄位選單、篩選和多選的選項）都用同一個勾。

## 細節

- 方框 22 px，小圓角（`radius-sm`），未勾選時 2 px `line-strong` 邊框。
- 勾選後強調色實心，白色勾號以描繪動畫（200 ms）畫出。
- 鍵盤 focus 時整列（框加文字）外圍出現 2 px `focus` 外框，和其他控制項相同。
