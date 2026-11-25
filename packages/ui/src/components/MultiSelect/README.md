# MultiSelect

## 用法

多選：選中的項目變成框內的標籤。只選一個用 Select。

```tsx
<MultiSelect label="標籤" options={tagOptions} value={tags} onChange={setTags} creatable />
```

- 能不能新增依情況決定：名稱、標籤這類使用者可以自由增加的才開 `creatable`；選項固定、使用者不該自己加的（例如狀態、權限）不要開。
- 框內顯示前 2 個標籤，其餘寫成「+n」（滑過可看全部，螢幕閱讀器念「另外 n 個：…」加上名稱）；`maxChips` 可以改數量。
- 和其他欄位一樣 40 px 高（手機 48 px），有 `hint`、`required`、`disabled`、`name`；`label` 必填。
- 移除：每個標籤的 ×、Backspace 移除最後一個，選了 2 個以上時框的右端有「清除」移除全部（Tab 可以移到，Enter 清除）；移除後念出「已移除 …」或「已清除…」。Esc 只關閉選單，選單沒開時交給外層（關閉 Drawer 或 Dialog），不會清掉已選的值。
- 有錯誤時給 `error`：紅框、框內右側的警告圖示，下方寫錯誤，出現時念一次。

## 細節

- 輸入文字篩選選單；選單裡每個選項前面有勾選框。
- `creatable` 時，輸入清單裡沒有的名字會出現「新增「…」」，也可以按 Enter；不能新增時顯示「找不到符合的選項」。
- 選單打開時 Esc 關閉選單；選單沒開、框裡有輸入的字時 Esc 清掉輸入的字。
