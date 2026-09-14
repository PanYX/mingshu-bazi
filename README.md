<div align="center">

<img src="assets/header.svg" alt="mingshu-bazi：面向 AI Agent 的八字排盘 CLI" width="880" />

**面向 AI Agent 的八字排盘 CLI**

一次调用拿到命盘事实和确定判断：四柱、藏干十神之外，还有格局、旺衰依据、用神喜忌、调候、财库、贵人、神煞和事业宫。

任何能执行本地命令的 AI Agent，都能按 JSON discovery 契约稳定调用。

[![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=node.js&logoColor=white)](#快速开始)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Agent Ready](https://img.shields.io/badge/Agent-Ready-00b0aa)](#在-ai-助手里使用)

[快速开始](#快速开始) · [真实输出](#真实输出) · [返回内容](#返回内容) · [官网排盘](https://mingshu.help/workspace?start=form&utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) · [接入指南](https://mingshu.help/tools/ai?utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) · [文档](#文档)

</div>

> [!IMPORTANT]
> **线上可用。** 服务端已经上线：默认地址 `https://mingshu.help`，接口版本 `v1`，引擎 `bazi-v3-true-solar`；五种语言的接入页在 https://mingshu.help/tools/ai 。直接从 GitHub 安装，不用注册额外账号。第一次使用，复制下面「快速开始」里的话发给你的 AI 助手即可。

本仓库是**客户端与 Agent Skill**。确定性的排盘引擎、解读服务、账号与付费报告运行在官网服务端，不在这个仓库里。

---

## 这个项目解决什么问题

多数「八字 Skill」只能返回四柱和十神。用户接着问「我的用神是什么」，Agent 就只能自己编。

这里把确定性判断交给引擎，把解释留给用户自己的 AI：

| 场景 | mingshu-bazi 提供 |
|---|---|
| 排盘 | `chart` 一次返回四柱、藏干十神、日主与五行权重 |
| 判断 | 格局、旺衰（含得令／得地／得势逐条依据）、用神喜忌、调候评级、流通 |
| 结构 | 财星与财库、担财能力、事业宫、贵人、神煞、干支关系、风险偏好 |
| 时间口径 | 真太阳时或钟表时间必须明确选择；夏令时歧义直接拒绝，不静默降级 |
| Agent 调用 | `capabilities`、`doctor`、`example`、`validate` 等 discovery 命令 |
| 多语言 | 简中、繁中（台湾）、繁中（香港）、英文、日文；事实与摘要不变，只换文字 |
| 隐私 | 不写库、链接不含出生资料、不扣费、不生成 AI 长文 |

---

## 真实输出

`mingshu chart --input birth.json`，示例资料（非真实用户）：

```text
辛 · 从强格 · 从强
用神: 金    喜神: 土    忌神: 火
调候: 丙 · 壬 · 戊 (极佳)
五行: 木 4%   火 10%   土 43%   金 38%   水 5%
十神: 比劫 38%   印绶 43%   食伤 5%   财星 4%   官杀 10%
年柱  辛未  比肩
月柱  辛丑  比肩
日柱  辛巳  日主
时柱  己亥  偏印
大运: 甲辰 2021-2030 · 乙巳 2031-2040 · 丙午 2041-2050 · 丁未 2051-2060
```

加 `--json` 之后，旺衰会带上完整依据：

```json
{
  "pattern": "从强格",
  "strength": {
    "label": "从强",
    "deLing": { "ok": true, "text": "月令为丑生身" },
    "deDi": { "ok": true, "texts": ["年支未生身", "日支巳克身", "时支亥泄身"] },
    "deShi": { "ok": true, "texts": ["年干辛帮身", "月干辛帮身", "时干己生身"] }
  },
  "useful": ["金"],
  "favorable": ["土"],
  "unfavorable": ["火"]
}
```

---

## 快速开始

**打开 Codex、Claude Code，或其他能帮你安装工具的 AI 助手，把下面这段话复制到聊天输入框发送。** 不用自己打开终端，也不用注册 npm 账号。

```text
请帮我安装个人命书，让我能在当前 AI 助手里排八字。
项目地址：https://github.com/PanYX/mingshu-bazi
请先阅读项目中的 docs/agent-install.md，按当前助手完成安装和连接检查。安装好后，告诉我怎么开始使用。
```

助手会检查电脑环境、安装工具，并完成接入。如果需要你点击授权或补装软件，跟着它的提示做就好。

## 在 AI 助手里使用

安装完成后，直接对助手说：

> 使用个人命书，帮我排八字。

它会向你确认出生日期、出生时间、用的是公历还是农历，以及出生地，再排盘并解释结果。你不用自己准备文件或填写代码。

如果助手提示需要重新加载，按提示新开一个对话或重启助手，再发一次上面这句话。

**如果你用的聊天工具不能安装或运行本地工具，直接[在官网排盘](https://mingshu.help/workspace?start=form)就可以。**

想自己动手安装，或需要升级、排错，可以查看[详细安装说明](docs/install.md)。

---

## 返回内容

| 字段 | 内容 |
|---|---|
| `calculation` | 引擎版本、历法转换、实际采用的时间口径 |
| `facts` | 四柱、日主、五行、藏干十神（固定中文枚举） |
| `derived` | 五行与十神分组权重、当前起 30 年窗口内的大运 |
| `judgments` | 引擎判断：格局、旺衰与依据、用神喜忌、调候、流通、财星财库、担财能力、事业宫、贵人、神煞、干支关系、风险偏好 |
| `display` | 当前语言的标签、四柱，以及可直接打印的 `brief` 摘要行 |
| `chartDigest` | 引擎原始数据的摘要，切换语言不变 |

`judgments` 会按请求语言本地化。事实、枚举、数值和摘要不随语言变化——同一张盘用五种语言请求，`chartDigest` 完全一致。

---

## 判断口径与边界

- 格局、旺衰、用神、喜神、忌神、调候都来自固定表格，是**本引擎的判断**，可能与其他流派结论不同。返回里也带这句话，供 Agent 转述。
- 五行与十神百分比是引擎权重，不是概率，也不是现实测量值。
- 大运只覆盖返回中标注的时间窗口，可能为空。
- 需要明确的出生日期、已知的当地出生时间和历法；第一版不估算未知时辰，支持 1900–2099 年。
- 真太阳时需要城市级地点。地点无法解析，或出生时间落在夏令时歧义区间时，会直接报错，不会改换口径。
- 不返回付费报告正文、中文模板句与旧版流年评分。

---

## 支持的语言

简体中文、繁体中文（台湾）、繁体中文（香港）、英文、日文。请求时用 `locale` 指定，默认 `zh-CN`。

---

## 隐私与费用

- 排盘只把出生资料发到你指定的服务地址；不写数据库、不创建档案。
- 官网链接只带来源统计参数，不含出生资料，也不会自动导入或保存命盘。
- 客户端不扣费、不调用模型。用你自己的 AI 解释时，消耗的是那个 AI 的额度。
- 本地文件、终端历史和 Agent 的对话记录由你自己管理。

---

## 常用命令

| 命令 | 用途 |
|---|---|
| `setup` | 引导安装 Skill 并检查服务连接 |
| `version --json` | 查看 CLI 版本与 Node.js 版本 |
| `capabilities --json` | 能力、输入契约与限制 |
| `doctor --json` | 连通性与接口版本自检，不发出生资料 |
| `example --json` | 打印示例出生资料 |
| `validate --input birth.json --json` | 本地校验输入，不联网 |
| `locations --query "上海" --locale zh-CN --json` | 查询城市级地点 ID |
| `chart --input birth.json --json` | 排盘，返回事实与判断 |
| `skills` | 输出配套 Skill 全文 |
| `website --locale zh-CN` | 输出官网链接，不打开浏览器 |

失败时退出码为 1；`--json` 下始终输出单行 JSON，错误带 `code` 与 `message`。

---

## 文档

| 文档 | 内容 |
|---|---|
| [docs/agent-install.md](docs/agent-install.md) | 交给 AI 助手执行的安装步骤 |
| [docs/install.md](docs/install.md) | 安装、接入、升级与故障排查 |
| [docs/api.md](docs/api.md) | 接口契约、字段与错误码 |
| [docs/demos.md](docs/demos.md) | 三个演示脚本 |
| [docs/release.md](docs/release.md) | 独立发布与同步说明 |
| [skills/mingshu-bazi/SKILL.md](skills/mingshu-bazi/SKILL.md) | Agent Skill 全文 |

---

## 状态与计划

- [x] 命令行客户端与配套 Skill
- [x] 五种语言、判断依据、隐私边界与调用限流
- [x] 服务端上线：`https://mingshu.help/api/v1/chart`，接口版本 v1，引擎 `bazi-v3-true-solar`
- [x] 五语言接入页上线：https://mingshu.help/tools/ai
- [x] 支持 `npx` 与 `npm install -g github:...`，不需要先发布到 npm
- [x] 引导安装 Skill，支持 Codex、Claude Code 和自定义目录
- [ ] 打开公开仓库的 CI（需要带 workflow 权限的凭据，步骤见 docs/release.md）
- [ ] 补充其它 Agent 宿主的实测安装说明

---

## 许可

[MIT](LICENSE)。客户端可以自由使用、修改和再分发。官网服务、排盘引擎与付费报告不在本仓库范围内，遵循官网条款。

---

## English summary

`mingshu-bazi` is a dependency-free CLI and Agent Skill for BaZi (Four Pillars) charts. A single call returns the chart facts together with the engine's own determinations - pattern, Day Master strength with its evidence, Useful/Favorable/Unfavorable Elements, seasonal balance, circulation, wealth stars and vault, benefactors, career palace, Shensha, branch relations and risk profile - localized into Simplified Chinese, Taiwan Traditional, Hong Kong Traditional, English or Japanese.

This public repository contains the client only; the deterministic engine and the hosted service live on [mingshu.help](https://mingshu.help). The service is live: the client calls `https://mingshu.help` by default (API v1, engine `bazi-v3-true-solar`) and runs straight from git with `npx --yes github:PanYX/mingshu-bazi capabilities --json`. After installing globally, run `mingshu setup` to select Codex or Claude Code and install the bundled Skill. Use `--dir` for another host. Setup checks connectivity without sending birth data; existing modified Skills are preserved unless `--force` is supplied, which makes a backup first. Installation is directly from GitHub; no npm account is required. For assisted installation, ask your Agent to follow `docs/agent-install.md`. Licensed under [MIT](LICENSE).

---

<div align="center">

[官网排盘](https://mingshu.help/workspace?start=form&utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) · [接入指南](https://mingshu.help/tools/ai?utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) · [Issues](https://github.com/PanYX/mingshu-bazi/issues)

Made by [PanYX](https://github.com/PanYX)

</div>