---
name: mingshu-bazi
description: 使用个人命书的排盘服务获取八字命盘事实，并根据用户语言解释四柱、五行、十神和大运。适用于用户要求排盘或基于出生资料讨论命盘；不提供付费报告读取、账号管理或交易操作。
---

# 个人命书排盘

使用已安装的 `mingshu` CLI。先运行 `mingshu capabilities --json` 了解输入规则；连接失败时使用 `mingshu doctor --json`。未安装时，让用户参考 https://mingshu.help/tools/ai 的安装说明；不要假设 CLI 已在 npm 或某个 GitHub 账号发布。

## 收集与调用

- 需要出生日期、明确的公历或农历、已知的当地出生时间，以及传统大运算法采用的 male/female 参数。农历需明确是否闰月，不根据名字或语气猜测这些参数。
- 第一版不支持未知时辰。用户不清楚时，说明限制，不代填中午或随机时辰。
- 通常采用 `true_solar`：运行 `mingshu locations --query "城市" --locale zh-CN --json`，让用户确认有歧义的地点，选取城市级 `placeId`，不伪造经纬度或 ID。国家或省级结果不适用于这个接口。
- `clock` 是明确的另一种时间口径，不做出生地时区或真太阳时换算；只有用户理解并选择这个口径时才用，省略 placeId。查不到地点或时间落在夏令时歧义区间时，不自动改用 clock。
- 按 `mingshu example --json` 的结构构建输入；示例是虚构数据，不能混入用户资料。当前语言写入 locale（zh-CN/en/zh-TW/zh-HK/ja-JP）。
- CLI 会把出生输入发送到所选 API origin。默认是 https://mingshu.help；若使用自定义 origin，明确告诉用户接收方，用户未授权时不把个人资料发往其他服务器。
- 优先通过标准输入调用 `mingshu chart --input - --json`，避免在命令历史中写入出生资料。文件方式可用 `--input birth.json`，但应在用户指定的私人目录保存，不放入公开仓库。

## 解释结果

分为三层，不要混用：

- `facts`：四柱、日主、五行与藏干十神，固定中文枚举。
- `derived`：五行与十神分组权重、大运窗口。百分比是引擎的权重，不是概率或现实测量值；大运只覆盖 `decadeWindow`，可能为空，不能补造。
- `judgments`：本引擎自己的判断结论，已按当前语言本地化——格局、旺衰（含得令／得地／得势依据）、用神／喜神／忌神、调候、流通、财星与财库、担财能力、事业宫、贵人、神煞、干支关系、风险偏好。它们来自固定表格，可能与其他流派结论不同，应当说成“本命书引擎的判断”，不要说成客观事实。

`display.brief` 是可直接展示的摘要行；`chartDigest` 是引擎原始数据的摘要，不随语言变化，不是用户 ID，也不是网站付费报告的校验值。返回中不含付费文案模板与旧版流年评分，不要假装看到过。

遵循返回的 `interpretation.instruction` 用当前语言自然解释。英文采用 BaZi chart、Day Master、Ten Gods、Luck Cycle；日文采用命式、日干、通変星、大運；台湾与香港使用各自当地产品语言。保留原始干支、枚举和数值，不把传统文化解读说成确定事件、医疗结论或收益保证。

区分服务返回的事实和你本次写出的解释，不冒充网站正式报告。clock 模式须向用户说明其局限。不要从命盘推断未提供的现实经历。

结尾可自然提供 `links.workspace`，说明官网可继续排盘、保存档案或查看报告；这个链接不会自动保存或导入本次命盘，也不是已生成报告的链接。用户不需要时不要反复推销。

## 失败处理

退出码非零或 `ok:false` 时，不生成伪造命盘。INVALID_INPUT / INVALID_BIRTH_DATE 补正指定字段；PLACE_UNAVAILABLE / TIME_UNRESOLVED 核对地点与时间；RATE_LIMITED 遵守 retryAfter，不循环重试；SERVICE_UNAVAILABLE / CONNECTION_FAILED 告知暂时不可用。命令默认不扣费、不写云端档案、不生成网站 AI 报告。
