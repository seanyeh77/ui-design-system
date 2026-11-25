# Link

## 用法

文字連結：`accent-text` 色加底線，淺色、深色主題都看得清楚；用在句子裡或「查看全部」這類前往另一頁的文字。不前往任何地方的操作用 `Button variant="quiet"`。

```tsx
<Link href="/orders/1024">查看訂單</Link>
<Link href="https://example.com/docs" external>使用說明</Link>
<Link render={<NextLink href="/orders" />}>全部訂單</Link>
```

- 一律有底線（句子裡的連結不只靠顏色分辨），滑過時底線變粗。
- 連到其他網站時給 `external`：另開分頁，後面加 16 px 的外部連結圖示，螢幕閱讀器念「在新分頁開啟」；站內連結不加圖示。
- 用路由器的連結（Next.js、React Router）時傳給 `render`：Link 把 class、文字和其他 props 交給它，網址寫在路由器的連結上。
- 文字說出去哪裡（「查看訂單」），不寫「點這裡」。
- 沒有 class 的 `<a>`（Markdown、舊內容）也是同樣的顏色和底線，不會是瀏覽器預設的藍色。

## 細節

- 鍵盤焦點：一般的 2 px `focus` 外框，離文字 2 px。
- 外部連結的 `rel` 預設 `noopener noreferrer`，可以自己給。
