# TimeControl

## 用法

監控畫面的時間控制：時鐘、兩行說明，以及「回放」和「回到現在」兩個按鈕；直排，適合放在 400 px 的側欄。

```js
h(UI.TimeControl, {
  time: replaying ? replayAt : now,
  replaying: replaying,
  onReplayChange: setReplaying,
  onNow: function () {
    setReplaying(false);
  },
  status: replaying ? '回放中：14:10 起的紀錄。' : '即時：每 10 秒更新一次。',
  detail: '紀錄範圍 2026/11/20（五）12:00 到 16:24',
});
```

- 第一行 `status`（內文）說明目前看的是什麼；第二行 `detail`（13 px 灰字），例如紀錄範圍或最後更新時間。
- 回放中要移到某個時間點，用 LineChart 的播放頭（`playhead`）。

## 細節

- 時鐘 28 px Geist Mono（24 小時制），即時時是現在，回放時是回放到的時間。
- 「回放」是次要按鈕，回放中變成「停止回放」；「回到現在」只有回放中可以按。
