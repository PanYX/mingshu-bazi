# 三个真实调用演示

只使用 examples/birth.json 的虚构资料。录屏前运行 doctor，确认线上可用；不要用静态输出冒充真实调用。

1. **一句话排盘**：AI 读取 Skill → 展示示例输入并确认 → 调用 chart → 解释返回四柱。结尾展示引擎版本和官网入口。
2. **同盘多语言**：保持出生输入不变，只将 locale 从 zh-CN 改为 en 或 ja-JP → 重复调用 → 对比 chartDigest 相同、display 不同。让 AI 按返回 instruction 解释，不声称接口生成了报告。
3. **从工具到官网**：调用 chart → 打开返回 links.workspace → 使用官网现有排盘流程。明确当前链接不会自动导入命盘，官网保存和报告遵循原有账号规则。

录屏可用命令：`mingshu chart --input examples/birth.json --json`。发布标题与封面避免保证预测结果或宣称所有 AI 客户端都支持安装。
