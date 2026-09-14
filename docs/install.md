# 安装与首次使用

普通用户可以直接把 [README「怎么用」](../README.md#怎么用)里的话发给 AI 助手。下面是手动安装与排错步骤；Agent 应先阅读[专用安装说明](agent-install.md)。

## 手动安装

先安装 Node.js 20+ 与 Git，然后运行：

```bash
npm install -g github:PanYX/mingshu-bazi
mingshu setup
```

选择 Codex 或 Claude Code 后，回到助手新开对话，说“使用个人命书，帮我排八字”。助手须能执行本地命令。安装 Skill 并不会安装 AI 助手本身，也不会验证助手已经加载它。

本项目直接从 GitHub 分发，不需要注册或登录 npm。命令中的 npm 是安装工具；请保留完整的 `github:PanYX/mingshu-bazi` 地址，不要改成 `npm install -g mingshu-cli`。

## 自动化和自定义目录

```bash
mingshu setup --agent codex --json
mingshu setup --agent claude --json
mingshu setup --dir "D:/My Agent/skills" --json
```

`--dir` 接收宿主的 skills 根目录，自动创建 `mingshu-bazi` 子目录。使用绝对路径最明确。它与 `--agent` 互斥，不自动选择或修改其他宿主。自定义目录模式也适用于自定义 Claude 配置目录、旧版宿主或项目级 Skill 目录。

JSON 模式只向 stdout 输出一行 JSON，不弹菜单。没有终端时必须提供 `--agent` 或 `--dir`，不会等待输入。

默认不配置服务地址，继续使用 `https://mingshu.help`。若当前环境设置了 `MINGSHU_API_ORIGIN`，setup 会检查该地址，但不会持久保存它。请确保 AI 助手的运行环境也使用你期望的地址。

## 离线安装

```bash
mingshu setup --agent codex --skip-check
```

只安装 Skill，跳过联网检查。之后运行 `mingshu doctor --json` 检查服务连接。检查成功仅表示 API discovery 可用，排盘和地点服务仍在实际请求时校验。

## 升级

重新运行全局安装命令，再运行 `mingshu setup`。内容相同时不改文件；内容不同时提示 `SKILL_CONFLICT`，原文件保持不变。确认替换时：

```bash
mingshu setup --agent codex --force
```

原 Skill 会备份为同目录中的 `SKILL.md.backup-<唯一编号>`，成功输出中包含完整路径。恢复时先退出助手，再将需要的备份内容还原至 `SKILL.md`。

## 常见问题

| 现象 | 处理 |
|---|---|
| 找不到 npm | 安装 Node.js 20+，重新打开终端 |
| GitHub 安装提示找不到 git | 安装 Git，重新打开终端 |
| 找不到 mingshu | 重开终端；检查 npm 全局命令目录是否加入 PATH。Windows 通常是 `npm prefix -g` 输出目录；macOS/Linux 通常是该目录的 `bin` 子目录 |
| SETUP_TARGET_REQUIRED | 自动化环境请明确指定 `--agent codex`、`--agent claude` 或 `--dir` |
| SKILL_CONFLICT | 保留现有文件；要更新则使用 `--force`，程序会先备份 |
| INSTALL_FAILED | 查看错误中的路径和系统错误码，检查目录权限，或选择可写的宿主 Skill 目录 |
| UNSAFE_TARGET | 安装目标是链接、目录类型不符或 SKILL.md 不是普通文件；检查目标，选择普通目录 |
| 服务检查失败 | 已安装的 Skill 会保留；检查网络和服务地址，再运行 `mingshu doctor --json` |
| 助手没有识别 Skill | 重启助手、新开对话，确认安装目录受宿主支持，并确认助手能够执行 `mingshu --help` |

`setup --json` 返回 `installation`、`connection` 和 `next`。服务检查失败时 `ok:false`、退出码 1，但 `installation` 仍说明已经完成的本地安装；离线安装时 `connection.status` 为 `skipped`。

## 卸载

```bash
npm uninstall -g mingshu-cli
```

Skill 由 setup 单独安装，卸载 npm 包不会删除它。需要完整卸载时，在宿主中移除 `mingshu-bazi` Skill，或手动删除 setup 输出的该 Skill 目录；保留需要的备份。

## 命令行与开发者使用

这些命令由 Agent 按需执行，普通用户不需要逐条操作：

```bash
mingshu version --json
mingshu doctor --json
mingshu capabilities --json
mingshu example --json
mingshu locations --query "上海" --locale zh-CN --json
mingshu chart --input birth.json --json
```

`example` 只打印虚构示例。按其结构准备输入，保存为 UTF-8 的 `birth.json`，或通过标准输入传给 `mingshu chart --input - --json`。`mingshu skills` 可查看完整 Skill 说明。

只查看能力、不全局安装：

```bash
npx --yes github:PanYX/mingshu-bazi capabilities --json
```

`chart` 会把出生资料发往默认服务 `https://mingshu.help`。本地联调可以通过 `--origin http://127.0.0.1:3000` 指定地址，或用 `MINGSHU_API_ORIGIN` 环境变量统一设置。自定义地址意味着出生资料会发往那台服务器；不要擅自修改用户的服务地址。
