# /go/ 追踪跳转 Worker（ISSUE #8）

工厂目录（#10）上线前必须就位。所有外跳工厂链接经 `/go/<key>` 302 跳转，
用于统计点击——这是向工厂证明价值（收费依据）的数据来源。

## 文件

- `go-redirect.js` — Worker 代码。白名单制：只有 `ALLOWLIST` 里的 key 能跳转，其余 404。
- 每个 key 对应 `src/data/factories.json`（#10 数据层）里的一家工厂 `slug`。
- **录入/下架工厂时必须同步这里**：改 `ALLOWLIST` 后重新 `wrangler deploy`，否则详情页"访问官网"按钮 404。
- 数据 schema 和录入 checklist 见 `src/data/README.md`。

## 部署步骤

1. 安装/登录 wrangler（项目已部署在 Cloudflare）：
   ```bash
   npm i -g wrangler
   wrangler login
   ```
2. 部署到 workers.dev（最快验证）：
   ```bash
   cd worker
   wrangler deploy go-redirect.js --name meshcalculator-go --compatibility-date 2026-09-13
   ```
3. 绑定正式路由（二选一）：
   - **子域名**：`wrangler.toml` 加 `routes = [{ pattern = "go.meshcalculator.com/*", zone_name = "meshcalculator.com" }]`，并在 DNS 加 `go` CNAME 记录；
   - **同域路径**：路由 `meshcalculator.com/go/*` 指向本 Worker（Dashboard → Workers → Add route）。
4. （可选）GA4 服务端 `factory_click` 事件：GA4 后台创建 Measurement Protocol API Secret，然后：
   ```bash
   wrangler secret put GA4_MEASUREMENT_ID   # G-RSYRN427KH
   wrangler secret put GA4_API_SECRET       # 生成的 secret
   ```
   不配置也能正常跳转，只是没有服务端埋点（前端事件仍归 #13 处理）。

## 使用方式

页面里的外跳链接写成：

```html
<a href="https://meshcalculator.com/go/anping-example/">factory website</a>
```

Worker 会自动附加 UTM 参数（`utm_source=meshcalculator.com&utm_medium=factory_click&utm_campaign=directory`），
工厂侧用自己的 GA 就能看到来源。

## 注意

- **永不**把用户提交的原始 URL 直接交给这个 Worker 跳转（开放重定向风险），只加白名单 key。
- 跳转响应带 `X-Robots-Tag: noindex`，不会被 Google 索引。
- 换工厂网址只改 `ALLOWLIST`，不用动页面。
