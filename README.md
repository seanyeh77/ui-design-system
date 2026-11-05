# 前端設計系統

一套 React 元件、設計 token 和使用規則：暖灰中性色、強調色 `#2457d6`，字體 Inter 加思源黑體，數字用 Geist Mono，有淺色與深色主題。

文件網站可以直接點、直接操作每個元件：<https://seanyeh77.github.io/ui-design-system/>

## 使用方式

元件掛在 `window.UI` 上，需要 React 18。

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="dist/tokens.css">
<link rel="stylesheet" href="dist/bundle.css">
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="dist/bundle.js"></script>
<script>
  var h = React.createElement;
  UI.initTheme();
  ReactDOM.createRoot(document.getElementById('root')).render(h(UI.Button, { variant: 'primary' }, '儲存'));
</script>
```

- 型別定義在 `dist/index.d.ts`。
- 主題：`UI.setTheme('light' | 'dark' | 'auto')`，強調色：`UI.setAccent('#2457d6')`。
- 介面文字：`UI.setLocale('en')` 切成英文，`UI.addMessages(locale, dict)` 加其他語系。
- 日期與數字：`UI.format`，例如 `UI.format.relative(date)`、`UI.format.money(1280)`、`UI.format.fileSize(bytes)`。

## 給 AI agent

使用規則寫在 [AGENTS.md](AGENTS.md)（`CLAUDE.md` 會引用它）。文件網站另外提供 <https://seanyeh77.github.io/ui-design-system/llms.txt>，列出所有規則、token 和元件說明的網址，agent 讀這一個檔案就能找到全部內容。

## 內容

| 路徑 | 內容 |
| --- | --- |
| `dist/` | `bundle.js`（全部元件）、`bundle.css`、`tokens.css`、`index.d.ts` |
| `tokens/tokens.json` | 色彩（淺色與深色）、字體、間距、圓角、陰影、尺寸 |
| `components/<名稱>/` | 每個元件的說明 `README.md` 和預覽 `preview.html` |
| `docs/guidelines.md` | 設計規則總整理 |
| `docs/layout.md`、`docs/motion.md` | 版面與動畫規則 |
| `docs/decisions.md` | 每個實驗室最後選定的設定 |
| `labs/` | 設計畫布上的選項實驗室原始檔 |
| `scripts/` | 產生 `tokens.css` 和文件網站的程式 |

## 修改流程

1. 改 `tokens/tokens.json` 後，執行 `python3 scripts/build_tokens.py` 重新產生 `dist/tokens.css`。
2. 元件改在 `dist/bundle.js` 和 `dist/bundle.css`，同時更新 `components/<名稱>/README.md`；新元件要加 `preview.html`，第一行寫 `<!-- @dsCard group="Data" height=400 -->`。
3. 本機預覽文件網站：`python3 scripts/build_site.py`，再用任何靜態伺服器打開 `site/`。
4. 推上 `main` 後，GitHub Actions 會自動重建並發布文件網站。

## 授權

MIT，見 [LICENSE](LICENSE)。
