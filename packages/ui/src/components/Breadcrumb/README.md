# Breadcrumb

## 用法

目前頁面在層級中的位置；放在內容區最上方，不放在頂部列。

```tsx
<Breadcrumb items={[{ label: '專案', href: '/projects' }, { label: 'api-gateway' }]} />
```

- 分隔符號用箭頭「›」，一般字（Inter 與思源黑體），14 px，`ink-muted`。
- 最後一層是目前頁面：`ink`、字重 600，帶 `aria-current="page"`，不給 `href`。
