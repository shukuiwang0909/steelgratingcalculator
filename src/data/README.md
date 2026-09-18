# 工厂目录数据层（factories.json）

线上 `factories.json` 只放**已核验的真实工厂**（品牌承诺：Every listing is a factory, not a reseller）。
`factories.example.json` 是本地测试用样例，永远不要把它原样拷到线上。

## 本地测试方法

1. 把 `factories.example.json` 的内容拷进 `factories.json`
2. `npm run build` → 访问 `/factories/`、`/factories/anping-example-mesh/`
3. 测完**还原为 `[]`** 再提交

## Schema（每个字段）

| 字段 | 必填 | 说明 |
|------|------|------|
| `slug` | ✅ | 唯一英文短横线 ID，用于 URL `/factories/<slug>/`，也是 `/go/` 白名单 key |
| `name` / `nameZh` | ✅ / 可选 | 工厂英文名 / 中文名 |
| `tier` | ✅ | `listed`（免费）或 `verified`（付费认证） |
| `categories` | ✅ | 数组，见下方可选值，决定列表页筛选和产品页关联 |
| `city` / `province` | ✅ | 如 `Anping` / `Hebei` |
| `website` | 可选 | 有则详情页显示 `/go/<slug>` 追踪直链；没有就隐藏 |
| `description` / `descriptionZh` | ✅ | 一句话简介（列表和详情共用） |
| `contact` | 仅 verified | `email` / `phone` / `whatsapp` |
| `founded` | 可选 | 成立年份 |
| `employees` | 可选 | 如 `"100–200"` |
| `exportMarkets` | 可选 | 数组，如 `["EU", "Middle East"]` |
| `certifications` | 可选 | 数组，如 `["ISO 9001"]` |
| `verifiedNote` | 仅 verified | 核验说明，如"营业执照 + 视频验厂已通过（2026-09）" |

## categories 可选值（与站内产品页一一对应）

`stainless-steel-wire-mesh`、`welded-wire-mesh`、`wire-mesh-fence-panels`、`chain-link-fence`、
`gabion-baskets`、`hexagonal-wire-mesh`、`expanded-metal`、`perforated-metal`

## 录入一家新工厂的完整 checklist

1. 核验通过（营业执照比对 + 视频看厂）
2. 往 `factories.json` 加条目（slug 起好后不再改，URL 会随之变）
3. **同步 `worker/go-redirect.js` 的 ALLOWLIST**：`"<slug>": "<website>"`，重新部署 Worker
4. 构建验证 + 链接扫描
5. 提交推送

## 红线

- **不卖排名**：tier 只控制联系方式/徽章展示，绝不影响排序
- Listed 免费且永久免费，不显示直邮联系方式
- 不合格/被投诉的工厂直接下架（删条目即可，路由自动消失）
