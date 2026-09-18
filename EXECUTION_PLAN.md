# SteelGratingCalculator.com — Claude Code 执行计划

> **项目代号**: steelgrating
> **目标**: 在 2-3 周内上线一个超越 chinamesh 的钢格栅计算工具站
> **技术栈**: Astro 5 + Tailwind CSS v4 + 暗色工业主题（复用 meshcalculator 设计系统）
> **商业模式**: SEO 工具站 → 询盘表单 → 安平/河北工厂导流
> **执行日期**: 2026-09-18

---

## 第 0 步：项目初始化

```bash
# 在 student-projects 下创建新项目
cd /home/agentuser/student-projects
mkdir steelgratingcalculator
cd steelgratingcalculator

# 用 Astro 官方模板初始化
npm create astro@latest . -- --template minimal --typescript strict --install

# 安装依赖
npm install @astrojs/sitemap @astrojs/tailwind tailwindcss@^4

# 配置 astro.config.mjs
```

**astro.config.mjs**:
```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://steelgratingcalculator.com',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**从 meshcalculator 复制的设计系统文件**:
- `src/styles/global.css` → 完整复制，品牌色从 amber 改为 blue
- `src/layouts/Base.astro` → 复制并修改站点名/导航

---

## 第 1 步：核心计算引擎（最高优先级）

### 文件: `src/lib/grating-engine.ts`

这是整个站点的核心。所有 calculator 页面都调用这个引擎。

```typescript
// ============================================
// NAAMM MBG 531 / MBG 534 钢格栅计算引擎
// 参考: NAAMM MBG 534-14, MBG 531-24
// ============================================

export interface GratingSpec {
  series: string;           // "19W4", "19W2", "15W4" 等
  bearingBarWidth: number;  // 承载杆宽度 (mm)
  bearingBarDepth: number;  // 承载杆高度 (mm)
  bearingBarPitch: number;  // 承载杆间距 (mm)
  crossBarPitch: number;    // 横杆间距 (mm)
  crossBarDiameter: number; // 横杆直径 (mm) — 扭杆或圆杆
  material: 'carbon' | 'stainless' | 'aluminum';
  surface: 'plain' | 'serrated' | 'galvanized';
}

export interface CalcResult {
  weightPerSqm: number;     // kg/m²
  weightPerSqFt: number;    // lb/ft²
  openAreaPercent: number;  // 开孔率 %
  sectionModulus: number;   // 截面模量 in³/ft
  momentOfInertia: number;  // 惯性矩 in⁴/ft
  uniformLoad: number;      // 均布载荷 psf (基于 1" 挠度)
  concentratedLoad: number; // 集中载荷 lbs/ft width
  deflection: number;       // 实际挠度 (in)
}

// ---- 材料常量 ----
const MATERIALS = {
  carbon:     { density: 7850,  E: 29e6,  F: 18000, name: "Carbon Steel" },
  stainless:  { density: 7930,  E: 28e6,  F: 20000, name: "Stainless Steel 304/316" },
  aluminum:   { density: 2700,  E: 10e6,  F: 12000, name: "Aluminum 6061-T6 / 6063-T6" },
};

// ---- NAAMM 标准型号数据表 ----
// 数据来源: NAAMM MBG 531-24 Table 1
// 注意: 以下数据必须从公开 load table 交叉验证
export const NAAMM_SERIES: Record<string, Omit<GratingSpec, 'material'|'surface'>> = {
  "19W4": { series:"19W4", bearingBarWidth:19.05, bearingBarDepth:4.76, bearingBarPitch:30.16, crossBarPitch:100, crossBarDiameter:6.35 },
  "19W2": { series:"19W2", bearingBarWidth:19.05, bearingBarDepth:4.76, bearingBarPitch:30.16, crossBarPitch:50,   crossBarDiameter:6.35 },
  "19P4": { series:"19P4", bearingBarWidth:19.05, bearingBarDepth:4.76, bearingBarPitch:40.64, crossBarPitch:100, crossBarDiameter:6.35 },
  "19P2": { series:"19P2", bearingBarWidth:19.05, bearingBarDepth:4.76, bearingBarPitch:40.64, crossBarPitch:50,   crossBarDiameter:6.35 },
  "15W4": { series:"15W4", bearingBarWidth:15.88, bearingBarDepth:3.97, bearingBarPitch:30.16, crossBarPitch:100, crossBarDiameter:6.35 },
  "15W2": { series:"15W2", bearingBarWidth:15.88, bearingBarDepth:3.97, bearingBarPitch:30.16, crossBarPitch:50,   crossBarDiameter:6.35 },
  "15P4": { series:"15P4", bearingBarWidth:15.88, bearingBarDepth:3.97, bearingBarPitch:40.64, crossBarPitch:100, crossBarDiameter:6.35 },
  "13W4": { series:"13W4", bearingBarWidth:12.70, bearingBarDepth:3.18, bearingBarPitch:30.16, crossBarPitch:100, crossBarDiameter:6.35 },
  "13P4": { series:"13P4", bearingBarWidth:12.70, bearingBarDepth:3.18, bearingBarPitch:40.64, crossBarPitch:100, crossBarDiameter:6.35 },
  "11W4": { series:"11W4", bearingBarWidth:11.11, bearingBarDepth:2.77, bearingBarPitch:30.16, crossBarPitch:100, crossBarDiameter:6.35 },
  "11W2": { series:"11W2", bearingBarWidth:11.11, bearingBarDepth:2.77, bearingBarPitch:30.16, crossBarPitch:50,   crossBarDiameter:6.35 },
  "11S4": { series:"11S4", bearingBarWidth:11.11, bearingBarDepth:2.77, bearingBarPitch:41.27, crossBarPitch:100, crossBarDiameter:6.35 },
  "10W4": { series:"10W4", bearingBarWidth:9.53,  bearingBarDepth:2.38, bearingBarPitch:30.16, crossBarPitch:100, crossBarDiameter:6.35 },
  "8W4":  { series:"8W4",  bearingBarWidth:7.94,  bearingBarDepth:1.98, bearingBarPitch:30.16, crossBarPitch:100, crossBarDiameter:6.35 },
  "7P4":  { series:"7P4",  bearingBarWidth:6.99,  bearingBarDepth:1.78, bearingBarPitch:40.64, crossBarPitch:100, crossBarDiameter:6.35 },
};

// ---- 国标 GB/T 型号数据表 ----
export const GB_SERIES: Record<string, Omit<GratingSpec, 'material'|'surface'>> = {
  "G325/30/100": { series:"G325/30/100", bearingBarWidth:25, bearingBarDepth:3,  bearingBarPitch:30, crossBarPitch:100, crossBarDiameter:6 },
  "G325/30/50":  { series:"G325/30/50",  bearingBarWidth:25, bearingBarDepth:3,  bearingBarPitch:30, crossBarPitch:50,  crossBarDiameter:6 },
  "G405/30/100": { series:"G405/30/100", bearingBarWidth:40, bearingBarDepth:5,  bearingBarPitch:30, crossBarPitch:100, crossBarDiameter:6 },
  "G405/30/50":  { series:"G405/30/50",  bearingBarWidth:40, bearingBarDepth:5,  bearingBarPitch:30, crossBarPitch:50,  crossBarDiameter:6 },
  "G505/30/100": { series:"G505/30/100", bearingBarWidth:50, bearingBarDepth:5,  bearingBarPitch:30, crossBarPitch:100, crossBarDiameter:6 },
  "G505/30/50":  { series:"G505/30/50",  bearingBarWidth:50, bearingBarDepth:5,  bearingBarPitch:30, crossBarPitch:50,  crossBarDiameter:6 },
  "G605/30/100": { series:"G605/30/100", bearingBarWidth:60, bearingBarDepth:5,  bearingBarPitch:30, crossBarPitch:100, crossBarDiameter:6 },
  "G605/30/50":  { series:"G605/30/50",  bearingBarWidth:60, bearingBarDepth:5,  bearingBarPitch:30, crossBarPitch:50,  crossBarDiameter:6 },
  "G325/40/100": { series:"G325/40/100", bearingBarWidth:25, bearingBarDepth:3,  bearingBarPitch:40, crossBarPitch:100, crossBarDiameter:6 },
  "G405/40/100": { series:"G405/40/100", bearingBarWidth:40, bearingBarDepth:5,  bearingBarPitch:40, crossBarPitch:100, crossBarDiameter:6 },
};

// ---- 重量计算 ----
export function calcWeight(spec: GratingSpec): { kgPerSqm: number; lbPerSqFt: number } {
  const mat = MATERIALS[spec.material];
  
  // 承载杆数量 per meter (沿宽度方向)
  const bearingBarsPerMeter = 1000 / spec.bearingBarPitch;
  
  // 单根承载杆重量 per meter (长度方向)
  const barCrossSection = spec.bearingBarWidth * spec.bearingBarDepth; // mm²
  const barWeightPerMeter = barCrossSection * 1e-6 * mat.density; // kg/m
  
  // 横杆数量 per meter (沿长度方向)
  const crossBarsPerMeter = 1000 / spec.crossBarPitch;
  
  // 单根横杆重量 per meter (宽度方向)
  const crossBarWeightPerMeter = (Math.PI * spec.crossBarDiameter ** 2 / 4) * 1e-6 * mat.density;
  
  // 总重量 per m²
  let kgPerSqm = bearingBarsPerMeter * barWeightPerMeter + crossBarsPerMeter * crossBarWeightPerMeter;
  
  // 镀锌增重 ~6%
  if (spec.surface === 'galvanized') {
    kgPerSqm *= 1.06;
  }
  
  return {
    kgPerSqm: roundTo(kgPerSqm, 2),
    lbPerSqFt: roundTo(kgPerSqm * 0.2048, 2), // 1 kg/m² = 0.2048 lb/ft²
  };
}

// ---- 开孔率计算 ----
export function calcOpenArea(spec: GratingSpec): number {
  // 开孔率 = 1 - (承载杆遮挡面积 + 横杆遮挡面积)
  const bearingBlocked = spec.bearingBarWidth / spec.bearingBarPitch;
  const crossBlocked = spec.crossBarDiameter / spec.crossBarPitch;
  const openArea = (1 - bearingBlocked) * (1 - crossBlocked) * 100;
  return roundTo(openArea, 1);
}

// ---- 截面特性 (NAAMM MBG 534) ----
export function calcSectionProps(spec: GratingSpec): { S: number; I: number } {
  const mat = MATERIALS[spec.material];
  const b = spec.bearingBarWidth / 25.4;  // convert to inches
  const d = spec.bearingBarDepth / 25.4;
  const K = 12 / (12 / (spec.bearingBarPitch / 25.4)); // bars per foot
  
  // Section modulus per foot width (in³/ft)
  const S = K * b * d * d / 6;
  
  // Moment of inertia per foot width (in⁴/ft)  
  const I = K * b * d * d * d / 12;
  
  return { S: roundTo(S, 3), I: roundTo(I, 4) };
}

// ---- 载荷计算 (NAAMM MBG 534 Section 3) ----
export function calcLoadCapacity(
  spec: GratingSpec, 
  span: number, // 跨度 (inches)
  deflectionLimit: number = 0.25 // 最大允许挠度 (inches)
): {
  uniformLoad: number;      // psf
  concentratedLoad: number; // lbs/ft width
  actualDeflection: number; // inches at uniform load
} {
  const mat = MATERIALS[spec.material];
  const { S, I } = calcSectionProps(spec);
  const L = span; // inches
  const L_ft = L / 12; // feet
  
  // 均布载荷 capacity based on stress (psf)
  // U = 96 * M / L² where M = F * S (in-lbs per ft width)
  const M = mat.F * S; // in-lbs per ft width
  const U_stress = (96 * M) / (L_ft * L_ft); // psf
  
  // 均布载荷 capacity based on deflection
  // D = 5 * U * L⁴ / (4608 * E * I) — solve for U
  const U_defl = (deflectionLimit * 4608 * mat.E * I) / (5 * Math.pow(L, 4));
  
  // 取较小值
  const uniformLoad = Math.min(U_stress, U_defl);
  
  // 集中载荷 capacity (lbs/ft width)
  // C = 4 * M / L
  const concentratedLoad = (4 * M) / L_ft;
  
  // 实际挠度 at uniform load
  const actualDeflection = (5 * uniformLoad * Math.pow(L, 4)) / (4608 * mat.E * I);
  
  return {
    uniformLoad: roundTo(uniformLoad, 0),
    concentratedLoad: roundTo(concentratedLoad, 0),
    actualDeflection: roundTo(actualDeflection, 3),
  };
}

// ---- 辅助函数 ----
function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

// ---- 型号推荐 ----
export function recommendSeries(
  span: number,        // 跨度 (feet)
  load: number,        // 所需均布载荷 (psf)
  material: 'carbon' | 'stainless' | 'aluminum' = 'carbon'
): string[] {
  const recommendations: { series: string; margin: number }[] = [];
  
  for (const [name, baseSpec] of Object.entries(NAAMM_SERIES)) {
    const spec: GratingSpec = { ...baseSpec, material, surface: 'plain' };
    const capacity = calcLoadCapacity(spec, span * 12);
    const margin = capacity.uniformLoad / load;
    
    if (margin >= 1.0) {
      recommendations.push({ series: name, margin });
    }
  }
  
  // 按 margin 排序，返回最经济的 3 个
  return recommendations
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 3)
    .map(r => r.series);
}
```

---

## 第 2 步：核心工具页面（5 个 Calculator）

### 页面 1: `/steel-grating-weight-calculator` （核心中的核心）

**目标关键词**: `steel grating weight calculator` (KD ~15-25, Vol ~800-1500/mo)

**文件**: `src/pages/steel-grating-weight-calculator.astro`

**功能**:
- 下拉选择: NAAMM 系列 (19W4, 19W2, ..., 7P4) | 国标 GB/T (G325/30/100, ...)
- 材质切换: 碳钢 | 不锈钢 304/316 | 铝合金
- 表面处理: 原钢 | 镀锌 (自动 ×1.06) | 锯齿 (重量不变)
- 自定义模式: 手动输入 承载杆宽/高/间距 + 横杆间距/直径
- 实时计算: kg/m², lb/ft², 单张板重量 (输入板尺寸)
- 结果区: 大数字 + 复制按钮 + 分享链接 + 打印

**SEO 元素**:
```yaml
title: "Steel Grating Weight Calculator — Free Online | SteelGratingCalculator"
description: "Calculate steel grating weight per m² / ft² for NAAMM (19W4, 19W2, 15W4...) and GB/T (G325/30/100...) series. Carbon steel, stainless, aluminum. Free, no signup."
h1: "Steel Grating Weight Calculator"
schema: WebApplication + FAQPage
```

**内容结构**:
1. Calculator 工具 (首屏)
2. 公式说明 (静态, 类似 chinamesh 但更好)
3. 常见型号重量速查表 (19W4 ≈ X kg/m², 15W4 ≈ Y kg/m²...)
4. 镀锌增重说明
5. 实际案例 (chinamesh 的迪拜案例改编)
6. FAQ (5-8 个常见问题)
7. 询盘 CTA

---

### 页面 2: `/bar-grating-load-calculator` （差异化武器）

**目标关键词**: `bar grating load calculator`, `bar grating load table` (KD ~10-20)

**文件**: `src/pages/bar-grating-load-calculator.astro`

**功能**:
- 选择 NAAMM 系列 + 材质
- 输入跨度 (feet 或 meters, 自动换算)
- 选择挠度限制: L/200, L/240, L/360 (或自定义)
- 输出:
  - 均布载荷 capacity (psf + kg/m²)
  - 集中载荷 capacity (lbs/ft + kg/m)
  - 实际挠度 (inch + mm)
  - **载荷-挠度曲线图** (SVG 实时生成, 这是 killer feature)
- 型号对比模式: 同时选 2-3 个型号, 并排比较

**关键交互**:
```
[输入区]          [结果区]
系列: [19W4 ▼]    均布载荷: ████████ 247 psf
材质: [碳钢 ▼]    集中载荷: ████████ 1,240 lbs/ft
跨度: [4.0 ft]    实际挠度: ████ 0.18 in (L/267)
挠度限制: [L/240] 
                  [载荷曲线图 SVG]
                  [复制] [分享] [打印] [下载 PDF]
```

---

### 页面 3: `/grating-size-selector` （智能推荐）

**目标关键词**: `grating size selector`, `how to select steel grating` (低竞争)

**文件**: `src/pages/grating-size-selector.astro`

**功能**:
- 反向计算: 用户输入 跨度 + 所需载荷 + 使用场景
- 输出: 推荐 3 个型号 (按经济性排序)
- 每个推荐显示: margin of safety, 重量, 价格估算区间
- 场景预设: 人行道 / 平台 / 排水沟盖 / 楼梯踏步 / 重型设备区

---

### 页面 4: `/grating-open-area-calculator` （快速工具）

**目标关键词**: `grating open area calculator`, `grating open area percentage`

**文件**: `src/pages/grating-open-area-calculator.astro`

**功能**:
- 选择系列 → 自动显示开孔率
- 自定义: 输入杆宽/间距 → 实时开孔率
- 可视化: 简化的格栅截面示意图 (SVG)

---

### 页面 5: `/grating-deflection-calculator` （专业工具）

**目标关键词**: `grating deflection calculator`, `grating span calculator`

**文件**: `src/pages/grating-deflection-calculator.astro`

**功能**:
- 输入: 系列 + 跨度 + 实际载荷
- 输出: 实际挠度 + 是否满足 L/240 / L/360
- 安全提示: 红色警告 if 挠度超限

---

## 第 3 步：SEO 内容矩阵

### 型号页面（每个 NAAMM 系列一个页面）

**文件模式**: `src/pages/19w4-load-table.astro`, `src/pages/19w2-load-table.astro` ...

**页面结构**:
```yaml
title: "19W4 Load Table & Weight Chart — NAAMM MBG 531"
description: "Complete 19W4 bar grating load table, weight per ft², section properties. NAAMM MBG 531 standard. Carbon steel & stainless."

内容:
  1. H1: "19W4 Bar Grating — Load Table & Specifications"
  2. 规格速查表 (bearing bar size, pitch, weight, open area)
  3. 载荷表 (span 2ft-10ft, uniform load capacity, deflection)
  4. 截面特性 (S, I)
  5. 材质对比 (碳钢 vs 不锈钢 vs 铝)
  6. 典型应用
  7. 与其他型号对比 (内链到 19W2, 15W4)
  8. 询盘 CTA
```

**需要生产的型号页面** (15 个):
- 19W4, 19W2, 19P4, 19P2 (19mm 系列)
- 15W4, 15W2, 15P4 (15mm 系列)
- 13W4, 13P4 (13mm 系列)
- 11W4, 11W2, 11S4 (11mm 系列)
- 10W4, 8W4, 7P4 (轻载系列)

**数据生产方法**:
- 用 `grating-engine.ts` 批量生成静态 JSON 数据
- 每个型号的 load table 是静态 HTML (SEO 友好)
- 不需要动态计算，直接渲染

### 标准页面

1. `/naamm-mbg-531-explained`
   - NAAMM MBG 531-24 标准解读
   - 型号命名规则 (19W4 = 19mm bar, W= welded, 4 = 4/16" depth)
   - 与国标 GB/T 700-2007 对比

2. `/astm-a123-galvanized-grating`
   - ASTM A123 镀锌标准
   - 镀锌增重 6% 的依据
   - 锌层厚度要求

3. `/gb-t-steel-grating-standard`
   - 国标 GB/T 700-2007 / YB/T 4001-2007
   - 国标型号 G325/30/100 含义
   - 与 NAAMM 型号对照表

### 对比页面

1. `/19w4-vs-19w2`
2. `/19w4-vs-15w4`
3. `/welded-vs-press-locked-grating`
4. `/carbon-steel-vs-stainless-grating`
5. `/naamm-vs-gb-grating-standards`

### 应用/场景页面

1. `/industrial-platform-grating`
2. `/walkway-grating-specification`
3. `/drainage-grating-load-requirements`
4. `/offshore-grating-specification`
5. `/mining-grating-applications`

---

## 第 4 步：首页与信息架构

### 首页 `/`

**文件**: `src/pages/index.astro`

**结构**:
```
[Hero]
  H1: "Steel Grating Calculator — Free Online Tools"
  Sub: "Calculate weight, load capacity, deflection & open area for NAAMM & GB/T steel grating. Trusted by engineers & buyers worldwide."
  [CTA: Start Calculating →]

[Tool Grid — 5 个工具卡片]
  🧮 Weight Calculator     → /steel-grating-weight-calculator
  📊 Load Calculator       → /bar-grating-load-calculator
  🎯 Size Selector         → /grating-size-selector
  🔍 Open Area Calculator  → /grating-open-area-calculator
  📏 Deflection Calculator → /grating-deflection-calculator

[型号速查表]
  15 个 NAAMM 型号的 weight/load/open area 简表
  [View Full Table →]

[Why Trust Us]
  - NAAMM MBG 531 / MBG 534 标准公式
  - 与公开 load table 交叉验证
  - 安平工厂直供资源
  - 免费无注册

[FAQ — 5 个]

[询盘 CTA]
  "Need a quote from Anping factories? Get 3 quotes in 24 hours."
  [Request Quote →]
```

### 询盘页面 `/request-a-quote`

**文件**: `src/pages/request-a-quote.astro`

**简化版**（参考 pvfcalculator）:
- 姓名, 邮箱, 公司, 国家
- 产品类型 (焊接格栅/压锁格栅/楼梯踏步)
- 型号 + 数量 + 尺寸
- 备注
- 提交 → 显示成功页

**注意**: 先不接后端，用 Formspree 或静态表单 + Netlify Forms

---

## 第 5 步：视觉设计系统

### 从 meshcalculator 复用并调整

**色彩系统** (meshcalculator 是 amber，steelgrating 改为 blue):

```css
/* src/styles/global.css */
@theme {
  /* Dark theme (default) */
  --color-ink-950: #07090c;
  --color-ink-900: #0c0f14;
  --color-ink-850: #11151c;
  --color-ink-800: #171c26;
  --color-ink-700: #232a38;
  --color-ink-600: #323b4d;
  --color-ink-500: #4a5568;
  --color-ink-400: #6b7686;
  --color-ink-300: #94a0b3;
  --color-ink-200: #c3cbd8;
  --color-ink-100: #dde3ec;
  --color-ink-50: #f2f5f9;

  /* Brand: Steel Blue */
  --color-accent-400: #60a5fa;
  --color-accent-500: #3b82f6;
  --color-accent-600: #2563eb;

  /* Semantic */
  --color-safe: #10b981;    /* 绿色 — 通过 */
  --color-warning: #f59e0b; /* 黄色 — 接近限制 */
  --color-danger: #ef4444;  /* 红色 — 超限 */

  --font-sans: "Inter", "Noto Sans SC", system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

### 工具页面布局规范

```
[暗色背景] ← 整站保持 meshcalculator 的暗色工业风
  ┌─────────────────────────────────┐
  │  [白色/浅灰卡片 — 工具区]        │  ← Calculator 用亮色卡片
  │                                 │     提高可读性
  │  输入区        │  结果区         │
  │  (左列)        │  (右列, 高亮)   │
  │                                 │
  └─────────────────────────────────┘
  [暗色内容区 — 公式/表格/FAQ]
```

**关键设计决策**:
- Calculator 区域用 `bg-ink-100` (浅色) 或 `bg-white` — 与暗色背景形成对比
- 结果数字用 `text-accent-500` (蓝色) + `text-5xl font-bold`
- 超限警告用 `text-danger` + 边框闪烁动画
- 载荷曲线图用 SVG 实时生成，品牌色

---

## 第 6 步：组件库

### `src/components/GratingCalculator.svelte` (或纯 Astro)

**推荐用纯 Astro + vanilla JS** (与 meshcalculator 一致，无框架依赖)

**组件结构**:
```astro
---
// src/components/WeightCalculator.astro
interface Props {
  defaultSeries?: string;
  showCustom?: boolean;
}
const { defaultSeries = "19W4", showCustom = true } = Astro.props;
---

<div class="calculator-container bg-white rounded-2xl shadow-xl p-6 md:p-8">
  <!-- 输入区 -->
  <div class="grid md:grid-cols-2 gap-8">
    <div class="space-y-4">
      <!-- 系列选择 -->
      <div>
        <label for="series" class="block text-sm font-semibold mb-1">Grating Series</label>
        <select id="series" class="w-full border rounded-lg px-3 py-2">
          <optgroup label="NAAMM (Inch-based)">
            <option value="19W4" selected>19W4 — 19×4.76mm, 30mm pitch</option>
            <option value="19W2">19W2 — 19×4.76mm, 30mm pitch, 50mm cross</option>
            <!-- ... 全部 15 个 -->
          </optgroup>
          <optgroup label="GB/T (Metric)">
            <option value="G325/30/100">G325/30/100 — 25×3mm, 30mm pitch</option>
            <!-- ... -->
          </optgroup>
          {showCustom && <option value="custom">Custom / Other</option>}
        </select>
      </div>
      
      <!-- 材质 -->
      <div>
        <label class="block text-sm font-semibold mb-1">Material</label>
        <div class="flex gap-2">
          <button class="material-btn active" data-material="carbon">Carbon Steel</button>
          <button class="material-btn" data-material="stainless">Stainless</button>
          <button class="material-btn" data-material="aluminum">Aluminum</button>
        </div>
      </div>
      
      <!-- 表面处理 -->
      <div>
        <label class="block text-sm font-semibold mb-1">Surface</label>
        <div class="flex gap-2">
          <button class="surface-btn active" data-surface="plain">Plain</button>
          <button class="surface-btn" data-surface="galvanized">Galvanized (+6%)</button>
          <button class="surface-btn" data-surface="serrated">Serrated</button>
        </div>
      </div>
      
      <!-- 自定义输入 (hidden by default) -->
      <div id="customInputs" class="hidden space-y-3 border-t pt-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="barWidth">Bearing Bar Width (mm)</label>
            <input type="number" id="barWidth" value="19.05" step="0.01">
          </div>
          <div>
            <label for="barDepth">Bearing Bar Depth (mm)</label>
            <input type="number" id="barDepth" value="4.76" step="0.01">
          </div>
        </div>
        <!-- ... -->
      </div>
    </div>
    
    <!-- 结果区 -->
    <div class="bg-ink-50 rounded-xl p-6 flex flex-col justify-center">
      <p class="text-sm text-ink-500 uppercase tracking-wide font-semibold">Weight</p>
      <p id="resultKg" class="text-5xl font-bold text-accent-500 mt-2">—</p>
      <p id="resultLb" class="text-xl text-ink-600 mt-1">—</p>
      <p id="resultSheet" class="text-sm text-ink-500 mt-3">—</p>
      
      <div class="mt-6 flex gap-2">
        <button id="copyBtn" class="btn-primary">Copy</button>
        <button id="shareBtn" class="btn-secondary">Share</button>
        <button id="printBtn" class="btn-secondary">Print</button>
      </div>
    </div>
  </div>
</div>

<script>
  // 调用 grating-engine.ts 的计算逻辑
  // 实时更新结果
</script>
```

### `src/components/LoadChart.svelte` (SVG 图表)

**功能**: 生成载荷-挠度曲线图

```typescript
// 输入: 系列, 材质, 跨度范围
// 输出: SVG path
// X轴: 跨度 (ft)
// Y轴: 均布载荷 (psf)
// 画 3 条线: stress limit, deflection L/240, deflection L/360
```

### `src/components/CTA.astro`

**询盘 CTA 组件**, 用在每个工具页底部:
```astro
<div class="mt-12 bg-gradient-to-r from-accent-600 to-accent-500 rounded-2xl p-8 text-center">
  <h3 class="text-2xl font-bold text-white">Need a Quote from Anping Factories?</h3>
  <p class="mt-2 text-blue-100">Get competitive quotes from verified steel grating manufacturers in 24 hours.</p>
  <a href="/request-a-quote" class="mt-4 inline-block bg-white text-accent-600 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors">
    Request Free Quote →
  </a>
</div>
```

---

## 第 7 步：布局与导航

### `src/layouts/Base.astro`

**从 meshcalculator 复制并调整**:
- 站点名: SteelGratingCalculator
- 导航: Tools | Load Tables | Standards | Applications | Blog | Request Quote
- 页脚: 免责声明, 隐私政策, 联系方式
- SEO: OG tags, Twitter cards, canonical, schema.org

### 导航结构

```
[Logo]  SteelGratingCalculator                    [Tools ▼] [Standards] [Applications] [Blog] [Request Quote]

Tools 下拉:
  - Weight Calculator
  - Load Calculator  
  - Size Selector
  - Open Area Calculator
  - Deflection Calculator

Standards:
  - NAAMM MBG 531
  - ASTM A123
  - GB/T Standards

Applications:
  - Industrial Platform
  - Walkway
  - Drainage
  - Offshore
  - Mining
```

---

## 第 8 步：SEO 技术配置

### Sitemap

`astro.config.mjs` 已配置 `@astrojs/sitemap`，自动抓取所有页面

### robots.txt

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /zh/

Sitemap: https://steelgratingcalculator.com/sitemap-index.xml
```

### Schema.org 标记

每个工具页加 `WebApplication` schema:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Steel Grating Weight Calculator",
  "url": "https://steelgratingcalculator.com/steel-grating-weight-calculator",
  "applicationCategory": "EngineeringCalculator",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "creator": { "@type": "Organization", "name": "SteelGratingCalculator" }
}
```

型号页面加 `TechArticle` schema + `FAQPage` schema

###  hreflang

暂不做多语言，纯英文站。如果未来加中文:
```html
<link rel="alternate" hreflang="en" href="https://steelgratingcalculator.com/...">
<link rel="alternate" hreflang="zh" href="https://steelgratingcalculator.com/zh/...">
```

---

## 第 9 步：数据验证清单（关键！）

### 公式验证

必须用公开来源交叉验证每个型号的计算结果:

**验证来源**:
1. NAAMM MBG 534-14 官方 PDF (公开)
2. Brown-Campbell load table (https://www.brown-campbell.com/)
3. AMICO load table (https://www.amico-international.com/)
4. McNICHOLS load table (https://www.mcnichols.com/)

**验证方法**:
```typescript
// 测试用例
const testCases = [
  { series: "19W4", span_ft: 4, expected_UL: 247, tolerance: 0.05 },
  { series: "19W4", span_ft: 6, expected_UL: 110, tolerance: 0.05 },
  { series: "15W4", span_ft: 4, expected_UL: 165, tolerance: 0.05 },
  // ... 每个型号至少 3 个测试点
];

// 如果误差 >5%, 检查公式或数据
```

**验证 checklist**:
- [ ] 19W4 重量: 与 Brown-Campbell 对比
- [ ] 19W4 载荷: 与 AMICO 对比
- [ ] 15W4 重量: 与 McNICHOLS 对比
- [ ] G325/30/100 重量: 与 chinamesh 对比 (≈22.5 kg/m²)
- [ ] 开孔率: 手算验证
- [ ] 镀锌增重: 确认 6% (chinamesh 数据)

---

## 第 10 步：部署上线

### Cloudflare Pages

```bash
# 构建
npm run build

# 部署到 Cloudflare Pages (通过 git 集成或 wrangler)
npx wrangler pages deploy dist --project-name steelgratingcalculator
```

### 域名绑定

1. Cloudflare Dashboard → Pages → steelgratingcalculator → Custom domains
2. 添加 `steelgratingcalculator.com`
3. 自动 SSL

### Google Search Console

1. 提交 sitemap
2. 请求索引核心页面

---

## 第 11 步：上线后检查清单

- [ ] 所有 calculator 功能正常
- [ ] 移动端显示正常
- [ ] 页面加载速度 < 2s (Lighthouse)
- [ ] Schema.org 验证通过 (Google Rich Results Test)
- [ ] sitemap.xml 可访问
- [ ] 询盘表单提交正常
- [ ] 每个页面有独特 title/description
- [ ] 无 404 链接
- [ ] 内链结构完整 (首页→工具→型号→标准)

---

## 第 12 步：Claude Code 执行指令

### 任务分解（按依赖顺序）

**Task 1: 项目初始化**
```
创建项目目录，安装依赖，配置 astro.config.mjs 和 tailwind。
从 meshcalculator 复制 global.css 和 Base.astro，修改品牌色为 blue。
```

**Task 2: 计算引擎**
```
创建 src/lib/grating-engine.ts，实现完整的 NAAMM 钢格栅计算逻辑。
包含: 重量、开孔率、截面特性、载荷容量、型号推荐。
所有公式必须从 NAAMM MBG 534 公开 PDF 提取并注释来源。
```

**Task 3: 核心工具页面**
```
创建 5 个 calculator 页面:
1. /steel-grating-weight-calculator — 核心
2. /bar-grating-load-calculator — 含 SVG 曲线图
3. /grating-size-selector — 智能推荐
4. /grating-open-area-calculator — 快速工具
5. /grating-deflection-calculator — 专业工具

每个页面包含: calculator 组件 + 公式说明 + FAQ + CTA
```

**Task 4: SEO 内容矩阵**
```
创建型号页面 (15 个 NAAMM + 9 个 GB/T):
- 每个页面有完整 load table, 静态渲染
- 交叉链接到相关型号
- 每个页面有唯一 title/description

创建标准页面:
- /naamm-mbg-531-explained
- /astm-a123-galvanized-grating
- /gb-t-steel-grating-standard

创建对比页面:
- /19w4-vs-19w2
- /welded-vs-press-locked-grating
- /carbon-steel-vs-stainless-grating
```

**Task 5: 首页与导航**
```
创建首页，包含:
- Hero + 5 个工具卡片
- 型号速查表
- FAQ
- CTA

创建导航组件，页脚组件。
```

**Task 6: 询盘系统**
```
创建 /request-a-quote 页面。
使用 Formspree 或静态表单处理提交。
```

**Task 7: SEO 优化**
```
添加 schema.org 标记到所有页面。
验证 sitemap.xml。
优化 title/description。
添加 OG tags。
```

**Task 8: 数据验证**
```
用公开 load table 交叉验证每个型号的计算结果。
误差 >5% 时标记并修正。
生成验证报告。
```

---

## 风险与缓解

| 风险 | 缓解 |
|---|---|
| 公式计算错误 | 用 Brown-Campbell/AMICO/McNICHOLS 公开数据交叉验证，每个型号 3+ 测试点 |
| chinamesh 内容优势 | 功能碾压 + 内容匹配 + 视觉碾压。chinamesh 无交互式 calculator |
| 搜索意图是内容而非工具 | 同时做工具页 + 内容页，内链互导 |
| 型号数据不全 | 先用 19W4/19W2/15W4 三个最常用型号上线，后续迭代补充 |
| 镀锌系数不准 | 用 1.06 (chinamesh 数据)，并在页面注明 "theoretical estimate, confirm with factory" |

---

## 最终交付物

1. **Git 仓库**: `student-projects/steelgratingcalculator/`
2. **线上站点**: `https://steelgratingcalculator.com`
3. **核心工具**: 5 个 calculator
4. **SEO 页面**: 15 个型号页 + 3 个标准页 + 3 个对比页 + 5 个应用页 = 26 个内容页
5. **文档**: 公式验证报告

---

> **执行原则**: 先工具后内容，先核心后长尾，先上线后迭代。
> 第一周必须让 `/steel-grating-weight-calculator` 和 `/bar-grating-load-calculator` 上线。
> 内容矩阵可以后续 2-4 周逐步补充。
