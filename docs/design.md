# Resume Editor — Design System

本文档为 **UI 令牌、实现约束与构建门禁** 的权威来源（与 `CLAUDE.md` 中 Design Tokens 一致）。实现时遵循 **§3 全局规范**、**§4 Rules / Constraints**；走查时对照 **§1**、**§2**、**§4**。

产品级背景与数据模型见 `docs/superpowers/specs/2026-04-02-resume-generator-design.md`；**视觉与交互细则以本文为准**，spec 中不再维护重复令牌表。

---

## 1. Tokens（规范值）

| Token | 值 | Tailwind / CSS 映射建议 |
|-------|-----|-------------------------|
| Font UI | Inter + Noto Sans SC | `font-sans`（`app/globals.css` 已配置） |
| Text primary | `#18181b` | `text-text-primary` / `text-foreground` |
| Text secondary | `#3f3f46` | `text-text-secondary` |
| Text muted | `#71717a` | `text-text-muted` / `text-muted-foreground` |
| Text disabled | `#a1a1aa` | `text-text-disabled` |
| BG page | `#fafafa` | `bg-page` / `bg-background` |
| BG card | `#ffffff` | `bg-card-bg` / `bg-card` |
| BG subtle | `#f4f4f5` | `bg-subtle` / `bg-muted` |
| Border | `#e4e4e7` | `border-border-custom` / `border-border` |
| Accent red | `#dc2626` | 仅破坏性操作、错误文案与错误容器（见 §4.1） |
| Radius input | **6px** | `rounded-md` |
| Radius card | **8px** | `rounded-lg` |
| Radius panel / 弹层 | **12px** | `rounded-xl`（含 AlertDialog 内容区） |
| Spacing 基线 | 4px | `4 / 8 / 12 / 16 / 20 / 24 / 32` 及对应 Tailwind 步进 |
| Max content width | 1280px | `max-w-[1280px]` |
| Editor 分栏 | 50 / 50 | — |
| 工具条控件高度 | **36px** | CSS `--control-height: 2.25rem`（见下） |

### 1.0 工具条高度（Tabs 与按钮对齐）

同一行内的 **水平 `TabsList`**、**主按钮 `Button size="lg"`**、**方形图标按钮 `Button size="icon-lg"`**（如返回）必须共用 **`--control-height`**，避免「分段器矮、主按钮高」的错位。

- 变量定义：`app/globals.css` → `:root { --control-height: 2.25rem; }`  
- **Tabs**：`components/ui/tabs.tsx` 中水平列表默认 `h-[var(--control-height)]`。Root 使用 `data-orientation="horizontal|vertical"`，样式必须写 **`group-data-[orientation=horizontal]/tabs`**（勿使用不存在的 `data-horizontal`，否则列表高度类不会生效）。  
- **Button**：`size="lg"` 为 `h-[var(--control-height)]`；`icon-lg` 为 `size-[var(--control-height)]`（与同排 Tabs 齐平）。  
- 表单内、表格工具条等需要更矮的控件仍用 `default`（`h-8`）或 `sm`（`h-7`），**不要**与顶栏 Tabs 混排时再用 `default` 作主 CTA。

### 1.1 字号层级（壳层）

| 角色 | 目标 | 推荐 |
|------|------|------|
| 页面主标题 | 24px | `text-2xl font-semibold text-text-primary` |
| 区块 / 卡片标题 | 16px 或略小 | `text-base font-medium` 或 `text-sm font-medium` |
| 正文 / 表单主文案 | 14px | `text-sm` |
| 辅助 / 元信息 | 12px | `text-xs text-text-muted` |

架构 spec 曾写「12px body」；**当前实现以壳层 14px 正文为准**，12px 用于辅助信息。若改版需同步更新本文档。

### 1.2 PDF / 打印稿字号（Playwright）

**检索结论（简历 / 打印正文）**：公开资料普遍将简历正文放在 **10–12pt（磅）** 区间——偏 **12pt** 更利于打印阅读；版面极紧时常见 **10–11pt**，但**不宜长期低于 10pt** 作为正文。排版应优先使用 **pt**（物理字号），避免屏幕 **px** 小数与打印引擎换算带来的随意感。

**本项目约定**（`components/pdf/templates/classic.ts`，**整数 pt**，与壳层 px 体系独立）：

| 角色 | 字号 | 说明 |
|------|------|------|
| 正文基准（经历描述、技能列表等） | **11pt** | 继承 `body` |
| 姓名 | **20pt** | 标题层级 |
| 分节标题（如「工作经历」） | **12pt** | 全大写条目标题 |
| 公司 / 学校等条目标题行 | **11pt** | `font-weight: 600`，与正文同号加粗 |
| 联系方式、日期、职位/学位副行 | **10pt** | 次要信息 |
| 个人总结 | **11pt** | `line-height: 1.6` |

**约束**：新增或改版 PDF 模板时，正文字号须在 **10–12pt** 内取整；禁止在打印 CSS 中使用 **非整数 px/pt** 作为正文字号。编辑器内 `PDFPreview` 仍为屏幕预览缩放，不要求与上表逐像素一致，但导出 PDF 必须遵守上表。

---

## 2. 走查参考与已批准例外

### 2.1 已批准例外

- **`components/editor/PDFPreview.tsx`（A4 屏幕预览）**：允许 `text-[10px]`、`text-[11px]`、`rounded-sm` 等与壳层 token 不一致的取值，**不等于** Playwright 导出字号；导出规范见 **§1.2**。**禁止**在应用壳其它页面滥用任意像素字号（§4.6）。

### 2.2 第三方 / shadcn 已知差异

- `components/ui/badge.tsx`：`rounded-4xl` 胶囊形，按组件库惯例保留。  
- `components/ui/tabs.tsx`：轨道 `p-[3px]` 为库默认；若严格 4px 网格可改为 `p-1`，属微调。

### 2.3 历史走查（已落代码，以当前实现与 §4 为准）

首轮走查已统一：流程页 H1、Textarea/Card 圆角层级、Processing 错误态用 `destructive` 语义色、Upload 分段与编辑器模板切换对齐（`Tabs` + `TabsList` + `TabsTrigger`）、SectionEditor 展开用 `Button variant="link"`、AlertDialog 维持 panel 12px。`ToggleGroup`（`spacing={0}`）圆角合并顺序已在组件内修复，供其它分段场景使用。不再保留逐条「问题 / 建议」表，避免与 §4 重复。

---

## 3. 全局规范（产品、流程、构建）

### 3.1 第一性原理与极简设计

- 交互与流程从 **用户任务** 出发（目标、最少步骤、失败恢复），再选控件；避免「先有组件再凑页面」。  
- **极简**：少装饰、少分支、同一意图单一主路径；与架构 spec §6 *Principles* 中 *Minimalist* 一致（无多余装饰、让内容呼吸）。

### 3.2 构建前的设计走查（放行条件）

- 在 **`npm run build` 通过** 或 **合并进主分支** 之前，须完成一次设计走查（**不是** `npm publish` 专用流程）。  
- 对照 **§1 Tokens、§2.1 例外、§4**，覆盖主流程（上传 → 处理 → 编辑 → 导出）的 **颜色、圆角、间距、字号、控件来源**。  
- **放行**：无未解决违背；已批准例外须在 PR / 合并说明可追踪。构建仍须通过 TypeScript / Next 等工程校验。

### 3.3 设计系统优先与矛盾处理

- 遵循本文 **§1**、`app/globals.css`、`components/ui/*` 及既有组合方式；禁止在业务页用一次性 class 堆出「新控件」。  
- **全新组件**：非现有 primitive 的标准组合、未与产品/设计负责人确认、且无法映射到当前 token 的独立视觉/交互。  
- 需求与现有系统冲突时，**先与用户确认** 并更新本文档或记录决议后再实现；禁止私建第二套视觉体系。

---

## 4. Rules / Constraints（实现细节）

Code review 与日常开发按条自检。

1. **颜色**  
   - 错误容器：**禁止** `red-50` / `red-200` 等粉色调色板。  
   - 使用 `destructive`、`destructive/10`、`border-destructive/25` 等与 `--destructive: #dc2626` 一致的组合。

2. **圆角层级**  
   - 表单控件：**6px** → `rounded-md`。  
   - 卡片式容器：**8px** → `rounded-lg`。  
   - 大面板与弹层：**12px** → `rounded-xl`。  
   - 禁止把 `rounded-xl` 当作默认卡片圆角。

3. **页面主标题**  
   - 全屏流程页（Upload、Processing 等）**H1** 同级：`text-2xl font-semibold text-text-primary`，子屏须在 PR 说明。

4. **交互控件**  
   - 分段单选（如 STAR/PDCA、语言）：与结果页模板切换 **同一套** — `Tabs` + `TabsList` + `TabsTrigger`；其它页面若需分段且无需 tab 语义，可用 `ToggleGroup`（`spacing={0}`，禁止手写并排 `button`）。  
   - 次要文字操作（展开/收起等）：**Button** `link` / `ghost` + 统一字号；禁止无说明的裸 `<button>`。

5. **间距**  
   - 优先 `gap-2/3/4/6/8`、`p-4/5/6/8` 等与 4px 基线一致的刻度。  
   - 半格（如 `mb-1.5`）仅限紧凑辅助文案；壳层慎用 `p-[3px]` 等（shadcn 内部除外）。

6. **字号**  
   - 壳层禁止任意 `text-[11px]` 等；**例外仅 §2.1 PDF 预览**。

7. **文档冲突**  
   - 与架构 spec 或其它文档冲突时，**以本文 + `app/globals.css` 为准**；更新 spec 指向或在本 **§5 Changelog** 记录。

8. **按钮宽度**  
   - `default` / `outline` / `secondary` / `destructive` 且尺寸为 `xs` / `sm` / `default` / `lg` 时：统一 **`min-width: var(--button-text-min)`**（`:root` 默认 `10rem`），短文案不显得过窄；文案更长时按钮仍可超出该最小值撑开，并配合 `max-w-full` 避免溢出父级。  
   - **`link` / `ghost`**：不设统一最小宽（`min-w-0`），用于行内、图标、工具条等紧凑场景。  
   - **`icon` / `icon-*`**：不参与上述最小宽。  
   - 同一行两个主操作（如「一键重写 / 重新审核」）：优先 **`grid grid-cols-2` + 子按钮 `w-full`**，保证等宽列；极窄屏可 `grid-cols-1 sm:grid-cols-2`。  
   - 小号弹层（`AlertDialog` `size="sm"`）底部双按钮：footer 在栅格布局下为子级 **`button` 设 `w-full`**，与上条一致。

---

## 5. Changelog

- **2026-04-07**：建立并迭代本文档 — 首轮走查落代码（H1、圆角层级、错误色、Upload 分段控件、SectionEditor、AlertDialog）；新增 §3 全局规范与 **`npm run build` 前** 走查门禁；精简 §2（移除已修复的 A1–A8 详表）；同步修订架构 spec §5 目录、§6 改为指向本文、Upload MVP 说明与 `app/globals.css` 路径。
- **2026-04-08**：Upload 写作框架/语言改为与编辑器一致的 `Tabs`；修复 `ToggleGroupItem` 上 `toggleVariants` 圆角覆盖顺序导致分段内凹圆角问题。
- **2026-04-08**：PDF `classic` 模板正文字号改为整数 **pt**（11pt 基准等）；新增 **§1.2** 打印稿字号规范（依据常见 10–12pt 简历阅读建议）。
- **2026-04-08**：走查修复 — Upload 顶栏 H1 升为 `text-2xl`；去除 `red-50`/`amber-50` 等非 token 色块（质量审核角标、Processing 改写预览）；壳层 `text-[10px]` 改为 `text-xs`（PDF 预览例外保留）。新增 **`--button-text-min`** 与 **§4.8**；`Button` 复合变体统一文本按钮最小宽；`ghost`/`link`/`icon` 排除；Upload 双主按钮与质量审核双按钮栅格等宽；AlertDialog `size="sm"` 底部双钮 `w-full`。
- **2026-04-08**：新增 **`--control-height`**（36px），水平 `TabsList` 与顶栏/工具条主按钮 `size="lg"`、返回键 `icon-lg` 对齐；Upload「生成简历」、编辑器「下载 PDF」与模板 Tabs 同高；**§1.0** 记录约定；AlertDialog 底部按钮 `min-h` 对齐该变量。
- **2026-04-08**：修复 Tabs 高度未生效 — `Tabs` Root 仅有 `data-orientation`，将 `group-data-horizontal/tabs` 全部改为 **`group-data-[orientation=horizontal]/tabs`**；Root 布局改为默认 **`flex-col`**（横向 Tab 时列表在上、面板在下），`orientation=vertical` 时用 `flex-row`。
- **2026-04-08**：首页通过 **`HomeUploadGate`（client + `dynamic(..., { ssr: false })`）** 挂载 `UploadPage`，避免 dev 缓存导致 Tabs 类名服务端/客户端不一致的 hydration 报错；改类名后请 **`rm -rf .next` 并重启 dev**。
