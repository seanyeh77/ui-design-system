# DataColors

## 用法

資料用的顏色：圖表的類別色、熱度色階、差值發散色階，以及預測值的斜線紋理；全部有淺色與深色兩套，由 `tokens.css` 提供。用 LineChart、BarChart、ZoneMap 時已經套好；自己畫資料時讀這份。

```js
h('div', { style: { background: 'var(--' + UI.heatToken(24.6, 20, 30) + ')', color: UI.textOn(UI.heatToken(24.6, 20, 30)) } }, '24.6 °C');
```

- 色階只用在資料的填色，不當作文字色或邊框色；上面的字用 `textOn(fill)`。
- 狀態不能只靠顏色：數值一定寫出來；告警加「⚠」文字與 4 px `warning` 或 `danger` 邊框。
- 類別色依序 `chart-1` 到 `chart-4`；類別超過 3 時，圖例一定有文字。

## 類別色

`chart-1` 藍、`chart-2` 青、`chart-3` 橘、`chart-4` 暖灰，依序使用；只有一組時用 `chart-1`。`chart-4` 給「其他」「人工」這類次要的一類。類別超過 3 時，圖例一定有文字，色帶旁有標籤。

## 熱度色階

`heat-1`…`heat-7`，冷 → 熱：藍 → 中性暖灰 → 橘紅。數值對應哪一段由頁面決定：

```js
var token = UI.heatToken(24.6, 20, 30); // 'heat-4'
```

## 差值發散色階

預測和實際的差這類有正負的值：`diverge-neg-strong`、`diverge-neg`、`diverge-zero`、`diverge-pos`、`diverge-pos-strong`（負藍、0 中性灰、正橘）。

```js
UI.divergeToken(-0.4, { zero: 0.2, strong: 1.5 }); // 'diverge-neg'
```

## 色階上的字

`UI.textOn(fill)` 在深色（#171512）和白色之間選對比較高的；`fill` 可以是色值或 token 名稱（例如 `'heat-6'`，跟著目前的主題）。熱度、差值和類別色的每一段都有 4.5:1。

```js
h('div', { style: { background: 'var(--heat-6)', color: UI.textOn('heat-6') } }, '28.9 °C');
```

## 預測、非實測

在有填色的元素加 class `ui-forecast`：疊上 45° 斜線（線 4 px、間距 9 px，顏色 `forecast-stripe`，是文字色 14% 不透明），底色和文字不變。旁邊或裡面放 `Tag icon="trend-up" tone="info"`「預測」。

```js
h('div', { className: 'ui-forecast', style: { background: 'var(--heat-4)' } }, '25.8 °C ', h(UI.Tag, { icon: 'trend-up', tone: 'info' }, '預測'));
```

## 監控畫面的字級

全螢幕、常駐、遠看的監控畫面：最小字 13 px，SVG 軸標 12 px。大螢幕等比放大，倍數是「視窗寬 ÷ 1440」與「視窗高 ÷ 900」的較小者，下限 1、上限 1.5。
