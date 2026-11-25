# 維護設計系統

改這個 repo（元件、token、規則、工具）時讀這份；只是用設計系統做頁面時讀 [AGENTS.md](../AGENTS.md)。

## 結構

pnpm workspace。`pnpm install` 之後，`pnpm check` 依序 build、型別檢查、lint 和測試全部套件；CI 另外跑文件網站、每個預覽的 `ui check` 和畫面比對。

| 路徑 | 內容 |
| --- | --- |
| `packages/tokens/tokens.json` | 所有 token（淺色、深色）和 preset，`usage` 一律英文。`pnpm --filter @seanyeh77/tokens build` 產生 CSS、Tailwind 主題和型別。 |
| `packages/ui/src/components/<Name>/` | `<Name>.tsx`、`README.md`、`<Name>.stories.tsx`（Storybook）、`preview.html`（純 HTML 範例，Design System artifact 的卡片） |
| `packages/ui/src/components/<Name>/<Name>.css`、`packages/ui/src/styles/*.css` | 元件樣式，只用 token 變數：每個元件一個檔，加上共用檔（`base`、`field`、`chart`、`motion`、`table`、`utilities`、`touch`、`floating`、`focus`）。`packages/ui/src/styles.css` 依 cascade 順序列出每個檔，build 把它們合成 `dist/styles.css`（在 `@layer ui.components` 裡）並寫出 `dist/css/` 的分檔。新的 CSS 檔要加進這份清單（否則 `pnpm test` 失敗）。 |
| `packages/blocks/src/` | 頁面範本；根目錄的 `registry.json` 列出它們 |
| `packages/eslint-plugin-ui`、`packages/cli` | lint 規則、`ui check`、`ui shots`、`ui docs`、`ui list` |
| `tests/visual/baseline/` | 每個預覽的畫面基準圖：`<Name>-<390 或 1280>-<light 或 dark>.png` |
| `apps/docs` | Storybook；`pnpm site` 把整個文件網站建到 `site/`（含 `llms.txt` 和 `/md/`） |
| `docs/` | `guidelines.md`（核心規則）、主題檔、這份、`decisions.md`（決策紀錄）；`docs/maintaining/` 放元件的實作規格 |

## 元件

- TypeScript strict、React 19（`ref` 是 prop），會浮起或鎖焦點的都用 Base UI。從 `src/index.ts` 匯出元件和它的型別。
- 每個 prop 一行 JSDoc（會變成 props 表格）；`scripts/check-jsdoc.ts` 在 `pnpm test` 檢查每個匯出的 `*Props`。寫錯就編譯不過的型別優於 README 的一句話；型別擋不住的加 `devWarn`，寫原因和修法（英文）。
- 新元件要有 `README.md`、story 和 `preview.html`，`preview.html` 第一行是 `<!-- @dsCard group="Data" height=400 -->`；有行為時加測試（`src/**/*.test.tsx`，Vitest 跑在真的 Chromium）。每個 story 也會在 jsdom 裡渲染、點擊和伺服器渲染（`src/components.jsdom.test.tsx`）：呼叫只有瀏覽器有的 API（`ResizeObserver`、Range 量測、canvas、`scrollIntoView`、pointer capture）前先檢查，不 polyfill 全域。
- 分組：`group` 是 `ui list` 和 `llms.txt` 的分組，名稱在 `packages/cli/src/usage.ts` 的 `GROUPS`。沒有預覽的模組（hook）在 README 最後加一行同樣的 `@dsCard` 註解。
- 名稱和預設文字不限專案：不用某個專案的詞（不把「函式」「編譯器」寫成內建文字），專案用 props 傳自己的字。

## 文件

- 用繁體中文，技術名詞保留英文，每個數字帶單位。只寫現在的規則，不寫開發經過（「以前」「升級後」「原本」）；改法寫在 changeset。
- README 以 `## 用法` 開頭：一句話（是什麼、什麼時候用、不用時改用什麼）、最小範例、3 到 6 條最常寫錯的規則，細節放在後面的 `##`。第一句是 `llms.txt` 和 `ui list` 的摘要。README 保持在約 8 KB 以內，agent 用不到的實作規格放 `docs/maintaining/<Name>.md`。
- 規則放哪裡：單一元件的規則在它的 README；每一頁都需要的在 `docs/guidelines.md`；某一種頁面的在它的主題檔。每條規則只說一次，其他地方給連結。新的主題檔加進 `packages/cli/src/usage.ts` 的 `GUIDES`（`llms.txt` 和 `ui docs` 的閱讀順序）和 `apps/docs/scripts/pages.ts`。
- AGENTS.md 是做頁面的閱讀路徑（套件裡的 `docs/agents.md` 是它的複本），保持精簡（約 6 KB）。

## 畫面比對

- CI 對每個 `site/preview/*.html` 在 390 px 與 1280 px、淺色與深色截圖（`ui shots … --compare tests/visual/baseline --diff visual-diff`），和基準圖不同就失敗：顏色距離超過 0.1 的像素算不同，超過 0.02 % 的像素不同或尺寸改變就算有變化。job summary 列出變化的圖，`visual-diff` artifact 有 `<name>-diff.png`（紅色是差異）、`-expected.png`、`-actual.png`。
- 改變是預期的，或新的預覽還沒有基準圖時：在分支上跑 **Update visual baselines** workflow（Actions → Update visual baselines → Run workflow）。它在和 CI 相同的環境截圖，以「更新畫面基準圖」commit，再對那個 commit 跑 CI。跑之前先看 diff：它接受所有變化。不要 commit 自己電腦產生的基準圖：字型和 Chromium 版本畫出的字略有不同，CI 會失敗。本機在 `pnpm build && pnpm site` 之後用 `node packages/cli/dist/cli.js shots site/preview/<Name>.html --compare tests/visual/baseline --diff visual-diff` 看變化（只到本機和 CI 畫得一樣的程度）。

## 發布

- 改到已發布的套件就加 changeset（`pnpm changeset`）；不需要發布的改動加空的（`pnpm changeset --empty`）。合併「Version packages」PR 時經由 trusted publishing 發布到 npm（每個套件在 npmjs.com 把這個 repo 的 `publish.yml` 設為 Trusted Publisher，不用 token）。push 到 `main` 會重建文件網站。
- commit 不加 Claude 的 co-author 或 Claude-Session trailer。

## 設計決策

- 新的設計決策由 SeanYeh 決定：他從每個選項都有 live demo 的 option lab 裡挑。提出選項，不自己改 token、規則或元件行為。
- 只記錄使用者確認過的：規則寫進上面說的檔案，每次 lab 決定的原話寫進 `docs/decisions.md`。
- 自己選的預設值一定要標出來：寫在 `docs/decisions.md` 的「AI 定的細節（待確認）」，不論是哪個 agent 選的；SeanYeh 把細節交給 agent 時，連同他的原話記下來。待確認的項目整理在 `decisions.md` 最後的「待確認清單」。
