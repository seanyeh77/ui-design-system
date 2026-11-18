---
'@seanyeh77/ui': patch
---

修正強調文字色（`--accent-text`）在預設強調色下變成黑色：打包工具（Vite、esbuild、lightningcss）會把 `tokens.css` 的 `#ffffff` 縮寫成 `#fff`，`setAccent()` 讀不懂 3 位數色碼，對比算不出來，一路混入黑色，所有連結和行內程式碼連結都變黑。現在讀 `--bg`、`--surface` 時接受 `#rgb`、`#rrggbb`、帶透明度的寫法與 `rgb()`；仍然讀不出來時，`--accent-text` 就用強調色本身，不往黑或白混。
