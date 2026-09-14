<div align="center">

[简体中文](README.md) · [繁體中文](README.zh-TW.md)

<img src="assets/header.svg" alt="mingshu-bazi：給 AI Agent 用的八字排盤 CLI" width="880" />

**給 AI Agent 用的八字排盤 CLI**

一次呼叫就能拿到命盤事實與確定判斷：四柱、藏干十神之外，還有格局、旺衰依據、用神喜忌、調候、財庫、貴人、神煞與事業宮。

任何能執行本機命令的 AI Agent，都能依照 JSON discovery 契約穩定呼叫。

[![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=node.js&logoColor=white)](#怎麼用)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Agent Ready](https://img.shields.io/badge/Agent-Ready-00b0aa)](#怎麼用)

[怎麼用](#怎麼用) · [真實輸出](#真實輸出) · [回傳內容](#回傳內容) · [官網排盤](https://mingshu.help/zh-TW/workspace?start=form&utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) · [介接指南](https://mingshu.help/zh-TW/tools/ai?utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) · [文件](#文件)

</div>

> [!IMPORTANT]
> **線上可用。** 本專案是 [個人命書](https://mingshu.help/zh-TW?utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) 的用戶端與 Agent Skill。伺服器端已經上線：預設位址 `https://mingshu.help`，API 版本 `v1`，引擎 `bazi-v3-true-solar`；五種語言的介接頁面在 https://mingshu.help/zh-TW/tools/ai 。

---

## 這個專案解決什麼問題

多數「八字 Skill」只能回傳四柱與十神。使用者接著問「我的用神是什麼」，Agent 就只能自己編。

這裡把確定性判斷交給引擎，把解釋留給使用者自己的 AI：

| 情境 | mingshu-bazi 提供 |
|---|---|
| 排盤 | `chart` 一次回傳四柱、藏干十神、日主與五行權重 |
| 判斷 | 格局、旺衰（含得令／得地／得勢逐條依據）、用神喜忌、調候評級、流通 |
| 結構 | 財星與財庫、擔財能力、事業宮、貴人、神煞、干支關係、風險偏好 |
| 時間基準 | 真太陽時或鐘錶時間必須明確選擇；日光節約時間有歧義時直接拒絕，不會默默降級 |
| Agent 呼叫 | `capabilities`、`doctor`、`example`、`validate` 等 discovery 指令 |
| 多語言 | 簡中、繁中（台灣）、繁中（香港）、英文、日文；事實與摘要不變，只換文字 |
| 隱私 | 不寫入資料庫、連結不含出生資料、不會扣款、不產生 AI 長文 |

---

## 怎麼用

打開 Codex、Claude Code 或其他支援安裝工具的 AI 助手，把下面這段話傳給它：

```text
請幫我安裝個人命書：https://github.com/PanYX/mingshu-bazi
請閱讀專案中的 docs/agent-install.md，完成安裝與連線檢查。
```

安裝完成後，對它說：

> 使用個人命書，幫我排八字。

依照助手的提問提供出生日期、時間、曆法與出生地，它就會排盤並解釋結果。

---

## 真實輸出

`mingshu chart --input birth.json`，範例資料（非真實使用者）：

```text
辛 · 從強格 · 從強
用神: 金    喜神: 土    忌神: 火
調候: 丙 · 壬 · 戊 (極佳)
五行: 木 4%   火 10%   土 43%   金 38%   水 5%
十神: 比劫 38%   印綬 43%   食傷 5%   財星 4%   官殺 10%
年柱  辛未  比肩
月柱  辛丑  比肩
日柱  辛巳  日主
時柱  己亥  偏印
大運: 甲辰 2021-2030 · 乙巳 2031-2040 · 丙午 2041-2050 · 丁未 2051-2060
```

加上 `--json` 之後，旺衰會附上完整依據：

```json
{
  "pattern": "從強格",
  "strength": {
    "label": "從強",
    "deLing": { "ok": true, "text": "月令丑土生身" },
    "deDi": { "ok": true, "texts": ["年支未土生身", "日支巳火剋身", "時支亥水洩身"] },
    "deShi": { "ok": true, "texts": ["年干辛金幫身", "月干辛金幫身", "時干己土生身"] }
  },
  "useful": ["金"],
  "favorable": ["土"],
  "unfavorable": ["火"]
}
```

---

## 回傳內容

| 欄位 | 內容 |
|---|---|
| `calculation` | 引擎版本、曆法轉換、實際採用的時間基準 |
| `facts` | 四柱、日主、五行、藏干十神（固定中文列舉值） |
| `derived` | 五行與十神分組權重、目前起算 30 年窗口內的大運 |
| `judgments` | 引擎判斷：格局、旺衰與依據、用神喜忌、調候、流通、財星財庫、擔財能力、事業宮、貴人、神煞、干支關係、風險偏好 |
| `display` | 目前語言的標籤、四柱，以及可直接列印的 `brief` 摘要行 |
| `chartDigest` | 引擎原始資料的摘要，切換語言也不會改變 |

`judgments` 會依照請求語言在地化。事實、列舉值、數值與摘要不隨語言改變——同一張盤用五種語言請求，`chartDigest` 完全一致。

---

## 判斷基準與界線

- 格局、旺衰、用神、喜神、忌神、調候都來自固定表格，是**本引擎的判斷**，可能與其他流派結論不同。回傳內容也附上這句話，供 Agent 轉述。
- 五行與十神百分比是引擎權重，不是機率，也不是現實測量值。
- 大運只涵蓋回傳內容標示的時間窗口，可能為空。
- 需要明確的出生日期、已知的當地出生時間與曆法；第一版不推估未知時辰，支援 1900–2099 年。
- 真太陽時需要城市級地點。地點無法解析，或出生時間落在日光節約時間的歧義區間時，會直接報錯，不會改換基準。
- 不回傳付費報告正文、中文模板句與舊版流年評分。

---

## 支援的語言

簡體中文、繁體中文（台灣）、繁體中文（香港）、英文、日文。請求時用 `locale` 指定，預設 `zh-CN`。

---

## 隱私與費用

- 排盤只把出生資料送到你指定的服務位址；不寫入資料庫、不建立檔案。
- 官網連結只帶來源統計參數，不含出生資料，也不會自動匯入或儲存命盤。
- 用戶端不會扣款、不呼叫模型。用你自己的 AI 解釋時，消耗的是那個 AI 的額度。
- 本機檔案、終端機歷史與 Agent 的對話紀錄由你自己管理。

---

## 常用指令

| 指令 | 用途 |
|---|---|
| `setup` | 引導安裝 Skill 並檢查服務連線 |
| `version --json` | 查看 CLI 版本與 Node.js 版本 |
| `capabilities --json` | 能力、輸入契約與限制 |
| `doctor --json` | 連線與 API 版本自我檢查，不送出出生資料 |
| `example --json` | 列印範例出生資料 |
| `validate --input birth.json --json` | 在本機驗證輸入，不連網 |
| `locations --query "台北" --locale zh-TW --json` | 查詢城市級地點 ID |
| `chart --input birth.json --json` | 排盤，回傳事實與判斷 |
| `skills` | 輸出配套 Skill 全文 |
| `website --locale zh-TW` | 輸出官網連結，不開啟瀏覽器 |

失敗時結束碼為 1；加上 `--json` 一律輸出單行 JSON，錯誤帶 `code` 與 `message`。

---

## 文件

| 文件 | 內容 |
|---|---|
| [docs/agent-install.md](docs/agent-install.md) | 交給 AI 助手執行的安裝步驟 |
| [docs/install.md](docs/install.md) | 安裝、介接、升級與疑難排解 |
| [docs/api.md](docs/api.md) | API 契約、欄位與錯誤碼 |
| [docs/demos.md](docs/demos.md) | 三個示範腳本 |
| [docs/release.md](docs/release.md) | 獨立發布與同步說明 |
| [skills/mingshu-bazi/SKILL.md](skills/mingshu-bazi/SKILL.md) | Agent Skill 全文 |

---

## 關於個人命書

[個人命書](https://mingshu.help/zh-TW/workspace?start=form&utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) 是這套排盤服務對應的線上網站，給不使用命令列的使用者。在瀏覽器裡填寫出生資料，就能得到基礎命盤與解讀。

網站上執行的是與本專案相同的確定性引擎。除了基礎命盤，個人命書還提供主題報告、完整命書與人生卡片，支援簡體中文、繁體中文（台灣）、繁體中文（香港）、英文與日文。本專案開源的是用戶端與 Agent Skill，官網服務、排盤引擎與付費內容不在專案範圍內。

如果不想在電腦上安裝任何東西，直接打開 [mingshu.help](https://mingshu.help/zh-TW/workspace?start=form&utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) 就能使用同樣的排盤。

---

## 授權

[MIT](LICENSE)。用戶端可以自由使用、修改與再散布。官網服務、排盤引擎與付費報告不在本專案範圍內，依官網條款辦理。

---

## English summary

`mingshu-bazi` is a dependency-free CLI and Agent Skill for BaZi (Four Pillars) charts. A single call returns the chart facts together with the engine's own determinations - pattern, Day Master strength with its evidence, Useful/Favorable/Unfavorable Elements, seasonal balance, circulation, wealth stars and vault, benefactors, career palace, Shensha, branch relations and risk profile - localized into Simplified Chinese, Taiwan Traditional, Hong Kong Traditional, English or Japanese.

Mingshu (個人命書) is the website built on this engine: [mingshu.help](https://mingshu.help/workspace?start=form&utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) lets you enter birth details in a browser and get the same chart, plus topic reports, the full destiny book and life cards. The service is live: the client calls `https://mingshu.help` by default (API v1, engine `bazi-v3-true-solar`) and runs straight from git with `npx --yes github:PanYX/mingshu-bazi capabilities --json`. After installing globally, run `mingshu setup` to select Codex or Claude Code and install the bundled Skill. Use `--dir` for another host. Setup checks connectivity without sending birth data; existing modified Skills are preserved unless `--force` is supplied, which makes a backup first. Installation is directly from GitHub; no npm account is required. For assisted installation, ask your Agent to follow `docs/agent-install.md`. Licensed under [MIT](LICENSE).

---

<div align="center">

[官網排盤](https://mingshu.help/zh-TW/workspace?start=form&utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) · [介接指南](https://mingshu.help/zh-TW/tools/ai?utm_source=github&utm_medium=readme&utm_campaign=bazi_chart_engine) · [Issues](https://github.com/PanYX/mingshu-bazi/issues)

Made by [PanYX](https://github.com/PanYX)

</div>
