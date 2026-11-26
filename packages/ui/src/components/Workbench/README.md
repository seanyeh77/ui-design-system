# Workbench

## 用法

像 VS Code 那樣閱讀與操作程式碼的工具頁：頂列、檔案總管、主畫面、右側欄、下方面板。邊界可以拖曳改大小，右側欄和下方面板的分頁（view）可以互換位置，版面記在瀏覽器裡。一般後台頁用 AppShell。

```tsx
import { Workbench, useWorkbench, TreeList, IconButton, SearchField } from '@seanyeh77/ui';

<Workbench
  storageKey="app"
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
</Workbench>;
```

- 外層要給高度（例如 `height: 100vh`）；Workbench 填滿它。給 `storageKey` 才會記住版面。
- `views` 和 `defaultLayout` 可以每次繪製都是新的陣列（`render` 讀最新的 state）：版面只看 view 的 `id` 和 `defaultLayout` 的內容，不必 `useMemo`。
- `brand` 的名稱是整頁的 `h1`，主畫面和它上方的列在 `main` 裡（名稱是 `label`，預設「編輯器」）：頁面不再另放 `h1` 或 `main`。
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

## 記住版面

- 給 `storageKey` 時，每個分頁在哪一邊、各邊開著哪個分頁、各區塊開或關、大小，存在 `localStorage` 的 `ui-workbench:` 加 `storageKey`；沒給時只記到重新整理為止。舊的 `id` 仍可用（存的資料相同），開發時 console 提醒改名。新增的 view 照 `defaultLayout` 放；拿掉的 view 自動忽略。
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

<Workbench ref={wb} storageKey="app" views={views}>
  …
</Workbench>;
```

## 讀取目前的版面

- `useWorkbench().layout`：目前的 `WorkbenchLayout`（`side`、`panel` 兩邊各有哪些分頁，`active.side`、`active.panel` 目前的分頁，`open` 開或關，`size` 大小）。Workbench 裡面的元件會跟著重新繪製。
- `onLayoutChange(layout)`：第一次繪製時和之後每次改變（換分頁、移動分頁、開關區塊、改大小）都會呼叫；內容沒變時不呼叫，所以可以直接 `onLayoutChange={setLayout}` 存進頁面的 state。
- `ref` 的 `getLayout()`：呼叫當下的版面。

把下方面板目前的分頁寫進網址：

```tsx
<Workbench
  ref={wb}
  storageKey="app"
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

外觀、鍵盤與無障礙的完整規格在 repo 的 `docs/maintaining/Workbench.md`。

## 區塊名稱的翻譯

區塊名稱只能用 `addMessages` 改，每個區塊兩種寫法，都不加冠詞（句子自己有 the）：

- 原 key（`檔案總管`、`右側欄`、`下方面板`）：單獨出現或在句首，例如 `Side bar`、`Side bar width`。
- `句中::` 加原 key：在句子中間，例如 `Hide the side bar`。普通名詞小寫，專有名詞（`Explorer`）照樣大寫。

```ts
addMessages('en', { 右側欄: 'Outline', '句中::右側欄': 'outline' });
```

只給原 key 時句中也用它。
