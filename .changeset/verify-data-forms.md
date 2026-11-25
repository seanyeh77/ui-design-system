---
'@seanyeh77/ui': minor
---

資料、表單與設定的修正：

- RelativeTime 與 DataTable 的 `format: 'relative'`：伺服器渲染時先輸出完整日期時間，瀏覽器接手後換成依瀏覽器時鐘算的相對時間，不再停在伺服器的字。`format.relative` 把 60 s 以內的未來時間寫成「現在」。
- KpiCard 新增 `direction`（`'up'` 或 `'down'`，哪個方向比較好），好壞由 `delta` 的正負算出；`good` 改成只用來直接指定。好壞以灰色的「（改善）」「（變差）」寫在比較期間後面，不只靠顏色；`delta={0}` 沒有箭頭。
- DataTable：沒有 `summary` 的一頁表格顯示「24 筆」，螢幕閱讀器一律念得到筆數；新增 `unit`，頁碼、已選、合計和朗讀都用它；新增 `loading`、`loadingRows`；手機卡片的欄位名稱固定 6 rem、日期不換行；切換摘要時滑出的列不再畫到卡片外；欄位與篩選寫在 render 裡也不會每次重新排序篩選；寫網址改用 `window.history`，沒有時略過。
- MultiSelect：選單沒開時 Esc 不再清掉已選的值（交給外層的 Drawer 或 Dialog），選 2 個以上時有「清除」，移除會念出；高度 40 px。
- Select：沒有值又有錯誤時，警告圖示在右端箭頭旁。
- DatePicker、DateRangePicker：打開時焦點在選中的日期，沒有值時在今天。
- Checkbox、RadioGroup：點擊範圍和焦點外框只包住框與文字。
- SettingsLayout：hash 寫成 `#settings-<id>`（仍讀 `#<id>`），hash 路由（`#/…`）時不讀也不寫；手機的分類改用 Tabs。SettingsSection 新增 `actions`。
- useFormErrors 新增 `isValid(name)`，`onBlur(name)` 回傳欄位是否正確。
- Toast：觸控螢幕不顯示「Ctrl Z」。
