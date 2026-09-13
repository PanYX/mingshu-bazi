# API v1

Base origin: `https://mingshu.help`（主站部署后可用）。无需 Cookie 或 API Key；本接口仅公开确定性排盘，不改变任何现有付费/账号接口的权限。

- GET `/api/v1/capabilities`：能力、参数与限制。
- GET `/api/locations?q=Shanghai`，请求头 `X-Locale: en`：现有出生地搜索；用户确认城市级结果后使用 placeId。
- POST `/api/v1/chart`：Content-Type application/json，最多 4096 bytes，输入见 `../examples/birth.json`。

不要在 URL query 中发送出生日期和时间。V1 不支持未知时辰，拒绝多余字段。农历日期由服务端校验，真太阳时地点由服务端重新查询，不能提交坐标替代。

timeMode=true_solar 必须带 placeId。无地点、国家/省级地点或夏令时歧义不自动降级。timeMode=clock 必须省略 placeId；此模式沿用引擎旧钟表时间口径，不代表已确认出生地的实际瞬间。

响应：`ok`, `apiVersion`, `locale`, `calculation`, `facts`, `derived`, `judgments`, `chartDigest`, `display`, `interpretation`, `warnings`, `links`, `privacy`。

- `facts`：四柱、日主、五行与藏干十神（固定中文枚举）。
- `derived`：五行与十神分组权重、大运（`decadeWindow` 范围内）。
- `judgments`：引擎判断，已按 `locale` 本地化——`pattern`、`strength`（含 deLing/deDi/deShi 依据）、`useful`/`favorable`/`unfavorable`、`seasonalBalance`、`circulation`、`tenGodGroups`、`groupElements`、`wealth`（含 stars/purity/vault/carryingCapacity）、`benefactors`、`careerPalace`、`shensha`、`relations`、`risk`。
- `display`：本地化标签、四柱、以及可直接打印的 `brief` 摘要行。

`judgments` 是引擎依据固定表格得出的结论，可能与其他流派不同；输出中不含中文文案模板、付费报告正文与旧版流年评分。

chartDigest 对 calculation/facts/derived 的原始（未本地化）判断投影做 SHA-256；语言切换不会改变它，但年份变化会改变大运窗口及摘要。它不是网站付费报告的校验值，也不是身份或访问凭证。所有响应 no-store。

错误结构：`{"ok":false,"error":{"code":"INVALID_INPUT","message":"...","details":{"field":"birthDate"}}}`。

| HTTP | code | 下一步 |
|---|---|---|
| 400 | INVALID_INPUT / INVALID_BIRTH_DATE | 修正字段，不能猜测 |
| 400 | PLACE_UNAVAILABLE / TIME_UNRESOLVED | 核对城市、历法与当地时间 |
| 413 / 415 | REQUEST_TOO_LARGE / INVALID_CONTENT_TYPE | 缩减输入 / 使用 JSON |
| 429 | RATE_LIMITED | 遵守 Retry-After，不自动循环 |
| 503 | SERVICE_UNAVAILABLE | 稍后再试 |

网络超时或重定向由 CLI 报 CONNECTION_FAILED。错误消息是协议用英文；用户端可按 code 本地化。跨站浏览器 CORS 未开放，CLI 和服务器可以直接请求；同源官网可以调用。服务没有扣费、档案读写或 AI 生成副作用。
