---
'@seanyeh77/ui': patch
---

LayerGraph 記住左右捲動位置時用 `storageKey`，沒給時用方框 id 的短雜湊（不再把所有 id 串成一個長字串），最多記 50 張圖，最舊的先忘。Graph 的說明、預覽和 story：圖比外框寬時一開始把選取的方框捲到中間。
