---
'@seanyeh77/ui': minor
---

codemap 第八輪回饋：

- LayerGraph 清單檢視：每一條關係都能選取，包括連到共用項目、圖上沒有畫成線的關係。點一下、Enter 或空白鍵都會呼叫 `onSelectEdge`，和點圖上的線一樣；選中的那一行 `aria-pressed="true"`。
- Tour：說明卡依序試目標下方、上方、右側、左側，選第一個放得進視窗而且不蓋住目標的位置；新增步驟選項 `keepVisible`，說明卡也不蓋住指定的內容（例如目標下方的表格）。都放不下時先捲動頁面，再不行才選蓋住目標最少的位置（原本是放在目標裡面）。
- LayerGraph 手機寬度：圖要左右捲動時，一開始捲到方框的最左邊，不再停在標籤留下的空白；一開始有選取時捲到該方框，之後選取的方框不在畫面內時捲到看得到它。
- LayerGraph 線上文字：標籤的位置要離自己的線比離其他線近，不會停在別條線旁；修正往上的線在方框右移後從方框後面穿過的錯誤。
- ProjectSwitcher：專案名稱和狀態分開，寬度不夠時先截斷狀態；手機上只寫名稱，狀態用圓點，完整文字在 `aria-label` 和 `title`。
- 文件網站的 LayerGraph、Tour、DataTable、ProjectSwitcher 示範加上 codemap 的重現案例。
