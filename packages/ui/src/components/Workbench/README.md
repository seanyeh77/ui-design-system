# Workbench

## 用法

像 VS Code 那樣閱讀與操作程式碼的工具頁：頂列、檔案總管、主畫面、右側欄、下方面板。邊界可以拖曳改大小，右側欄和下方面板的分頁（view）可以互換位置，版面記在瀏覽器裡。一般後台頁用 AppShell。

```tsx
import { Workbench, useWorkbench, TreeList, IconButton, SearchField } from '@seanyeh77/ui';

<Workbench
  id="app"
  brand={{ mark: <Logo />, name: 'app', href: '#overview' }}
  crumbs={[{ label: 'harness' }, { label: 'controller.py' }]}
  mainBar={<IconButton variant="quiet" icon="arrow-square-out" label="用 VS Code 開啟" onClick={openInEditor} />}
  actions={<Actions />}
  explorerFilter={{ value: q, onChange: setQ, label: '篩選檔案與函式' }}
  explorer={<Explorer />}
  explorerFoot={<Button icon="gear">設定</Button>}
  views={[
    { id: 'outline', title: '大綱', render: () => <Outline /> },
    { id: 'problems', title: '問題', render: () => <Problems />, attention: problems.length > 0 },
  ]}
  defaultLayout={{ side: ['outline'], panel: ['problems'] }}
>
  <CodeView code={code} file={file} header="float" copy />
</Workbench>
```

- 外層要給高度（例如 `height: 100vh`）；Workbench 填滿它。
- `mainBar`（36 px 的列）只放 `IconButton variant="quiet"` 或 `SegmentedControl iconOnly`；不放 40 px 的一般按鈕、輸入框、Select 或 Tabs。
- 主畫面裡的 CodeView 用 `header="float"`：檔名已經在麵包屑上。
- 檔案總管的樹用 `TreeList kind="plain" density="compact" bare`；選了東西之後呼叫 `useWorkbench().explorerPicked()`。
- 要有「還原預設版面」：`useWorkbench().resetLayout()`，按鈕放在 `actions` 或說明選單。

## 版面

- 頂列 48 px：左邊是收合檔案總管的按鈕和 `brand`；右邊是 `actions`，再來是收合下方面板與右側欄的按鈕。
- 主畫面上方一條 36 px 的列：左邊是麵包屑（`crumbs`），右邊是 `mainBar`（頁面自己的小按鈕，例如「用 VS Code 開啟」，用 `IconButton variant="quiet"`，在這條列裡是 28 px）。和右側欄、下方面板的分頁列、檔案總管的篩選列同高，三條橫線對齊。沒有 `crumbs` 也沒有 `mainBar` 時不畫這條列。
- `mainBar` 裡可以放的東西（列高 36 px，上下各留 4 px）：
  - `IconButton variant="quiet"`：在這條列裡是 28 px。
  - `SegmentedControl iconOnly`：28 px 高，例如 Markdown 檔案的「預覽／原始碼」。
  - 不要放 40 px 的一般按鈕、輸入框、Select 或一般 `Tabs`，會超出這條列。需要文字說明的動作用 `IconButton` 的提示（tooltip）。
- 麵包屑放不下時，前面的層先縮成刪節號，最後一層最後才縮；手機上也顯示完整路徑。
- 主畫面裡的 CodeView 用 `header="float"`：檔名已經在麵包屑上，不必再畫一列標頭（見 CodeView 的說明）。
- 三個開關按鈕的圖示是外框加一塊：區塊開著時那一塊填滿，關著時只剩分隔線。按鈕有 `aria-pressed`，tooltip 寫快捷鍵。
- `actions` 放頁面自己的按鈕，用 `IconButton variant="quiet"`。
- 檔案總管：`explorerFilter` 是最上方 36 px 的篩選列（放大鏡加無框的輸入框，滑過或輸入時才有底色），篩選由頁面自己做；`explorerHead` 放其他固定在上方的東西；`explorer` 捲動；`explorerFoot`（例如「設定」）固定在下。樹用 `TreeList kind="plain" density="compact" bare`。
- 主畫面（`children`）：架構圖、文件或程式碼。
- 右側欄與下方面板：由 `views` 組成，每個 view 是一個分頁。`defaultLayout` 決定一開始在哪一邊，沒列到的放下方面板。

## 大小

| 區塊 | 預設 | 最小 | 最大 |
| --- | --- | --- | --- |
| 檔案總管寬度 | 260 px | 180 px | 480 px |
| 右側欄寬度 | 320 px | 240 px | 560 px |
| 下方面板高度 | 220 px | 120 px | 版面高度的 60% |

- 拖曳邊界改大小；邊界是 `role="separator"`，螢幕閱讀器念目前數值。
- 鍵盤：焦點在邊界上時，方向鍵一次 16 px，Shift 加方向鍵一次 64 px，Home、End 到最小、最大。雙擊恢復預設。
- 邊界平常是 1 px 分隔線，滑過 150 ms 後、拖曳中、鍵盤焦點時變成 2 px 強調色線。

## 分頁換位置

- 拖曳分頁到另一邊：滑鼠在分頁左半邊插在它前面，右半邊插在它後面，以 2 px 強調色直線標出；放到內容區排在最後。被拖的分頁半透明，目標區塊變 `accent-soft` 底色加虛線框與「放開以移到下方面板」。放開後位置不變時寫「位置不變」。
- 收起來或沒有分頁的一邊，拖曳時在原位置出現放置區。
- 鍵盤：分頁列右邊的「把目前分頁移到另一邊」按鈕；移到收起來的一邊時，那一邊自動打開。分頁之間用左右鍵移動。
- 分頁放不下時，多的收進最後的「更多 N」選單；目前的分頁一定留在分頁列上。
- `attention: true` 的 view 在分頁上有一個小圓點；它所在的區塊關著時，頂列的開關按鈕上也有。

## 快捷鍵

- Ctrl B（macOS ⌘B）：檔案總管。焦點在輸入框裡時不處理，讓輸入框照常使用。
- Ctrl J（⌘J）：下方面板。
- Ctrl Alt B（⌘⌥B）：右側欄。
- Esc：關掉疊在主畫面上的檔案總管或右側欄。

## 記住版面

- 每個分頁在哪一邊、各邊開著哪個分頁、各區塊開或關、大小，存在 `localStorage` 的 `ui-workbench:` 加 `id`。新增的 view 照 `defaultLayout` 放；拿掉的 view 自動忽略。
- 「還原預設版面」：在 Workbench 裡面用 `useWorkbench().resetLayout()`，按鈕放在哪由頁面決定（例如 `actions` 或說明選單）。

```tsx
function Actions() {
  const wb = useWorkbench();
  return <IconButton variant="quiet" icon="arrow-u-up-left" label="還原預設版面" onClick={wb.resetLayout} />;
}
```

## 打開某個分頁：show(viewId)

連結、搜尋結果或網址要把使用者帶到某個分頁時，用 `show(viewId)`：

- 找到這個 view 目前在哪一邊（右側欄或下方面板），設成那一邊目前的分頁，並打開那一邊。不改變分頁的位置。
- 寬螢幕：照一般展開，並記住打開的狀態。
- 窄螢幕（右側欄疊在主畫面上時）：把右側欄疊上來。
- 手機：打開合併的面板並切到這個分頁。
- 沒有這個 id 時不做任何事，開發模式在 console 提醒。
- 掛載時就可以呼叫（例如網址帶著分頁）：不用等版面量完寬度。

在 Workbench 裡面（view、`actions`、`explorer` 的內容）用 `useWorkbench()`：

```tsx
function Notice({ item }) {
  const wb = useWorkbench();
  return (
    <button type="button" className="ui-link-btn" onClick={() => wb.show('check')}>
      到檢查看細節
    </button>
  );
}
```

在 Workbench 外面（例如外層元件處理網址）用 `ref`，拿到 `WorkbenchHandle`：`show`、`toggle`、`resetLayout`、`explorerPicked`、`phone`，以及 `getLayout()`。

```tsx
const wb = React.useRef<WorkbenchHandle>(null);

// 載入或按上一頁時，打開網址指定的分頁（#code?f=…&v=impact）
React.useEffect(() => {
  const open = () => {
    const v = new URLSearchParams(location.hash.split('?')[1]).get('v');
    if (v) wb.current?.show(v);
  };
  open();
  window.addEventListener('popstate', open);
  return () => window.removeEventListener('popstate', open);
}, []);

<Workbench ref={wb} id="app" views={views}>…</Workbench>
```

## 讀取目前的版面

- `useWorkbench().layout`：目前的 `WorkbenchLayout`（`side`、`panel` 兩邊各有哪些分頁，`active.side`、`active.panel` 目前的分頁，`open` 開或關，`size` 大小）。Workbench 裡面的元件會跟著重新繪製。
- `onLayoutChange(layout)`：第一次繪製時和之後每次改變（換分頁、移動分頁、開關區塊、改大小）都會呼叫。
- `ref` 的 `getLayout()`：呼叫當下的版面。

把下方面板目前的分頁寫進網址：

```tsx
<Workbench
  ref={wb}
  id="app"
  views={views}
  onLayoutChange={(l) => {
    const url = new URL(location.href);
    const [path, query = ''] = url.hash.slice(1).split('?');
    const q = new URLSearchParams(query);
    if (l.active.panel) q.set('v', l.active.panel);
    history.replaceState(null, '', '#' + path + '?' + q.toString());
  }}
>
```

`open` 是寬螢幕記下的開關。窄螢幕上疊在主畫面上的區塊、手機的合併面板是否打開不在 `layout` 裡；手機上在合併面板換分頁時，`active` 會跟著更新。

## 窄螢幕

寬度看的是 Workbench 本身。

- 1280 px 以下：右側欄平常不佔位置，按頂列按鈕後從右邊滑入疊在主畫面上，後面加半透明遮罩。
- 960 px 以下：檔案總管也一樣，從左邊滑入。在樹裡選了東西之後呼叫 `useWorkbench().explorerPicked()`，檔案總管自動關閉。
- 600 px 以下（手機）：
  - 右側欄和下方面板的分頁合成一張面板。頂列的「下方面板」「右側欄」按鈕打開它，先顯示那一邊目前的分頁。
  - 面板固定在下半部（預設 45%），主畫面留在上半部，兩邊都能捲、都能點，沒有遮罩。拖動中間的握把調整高度（最小 120 px，最大 75%），雙擊恢復 45%。
  - 分頁列可以左右捲動；在內容上左右滑動切換分頁；按住分頁 0.3 秒後拖動排序，分頁列即時排成放開後的順序；「往左移」「往右移」按鈕做同一件事。順序是右側欄的分頁接著下方面板的分頁，移過交界時，寬螢幕上它也換到另一邊。
  - 檔案總管佔 85% 寬。
  - 產品名稱隱藏，`brand.mark` 留著；麵包屑在主畫面上方，整列都給它。
- 疊在主畫面上的區塊不記開關：載入、還原、換寬度時都先收起；寬螢幕記下的開關不受影響。

## 動畫

- 寬螢幕收合、展開區塊：區塊滑出、滑入，主畫面同時變寬、變窄，300 ms。拖曳邊界時不加動畫。
- 疊加的區塊：照側邊抽屜，彈性滑入 450 ms、滑出 300 ms，遮罩淡入 300 ms。
- 分頁底線：照 Tabs 的水滴（前端 120 ms、後端 440 ms）。
- 換分頁時內容各區塊依序浮起，間隔 40 ms。
- 系統設定減少動態效果時不動。
