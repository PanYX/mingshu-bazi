# 给 AI 助手的安装说明

用户将 README 的安装请求发给你时，请完成安装和验证，最后用简短中文告诉用户如何开始。用户无需理解 CLI、JSON 或 Skill 目录，也无需注册 npm 账号。

## 1. 检查环境

- 确认当前宿主能执行本地命令、读取和安装 Skill。Codex 和 Claude Code 有下面的标准目标；其他宿主须先确认其官方支持的 Skill 路径，不要猜目录。
- 检查 Node.js（20+）、npm 与 Git 是否可用。已有可用版本就复用；缺失时协助用户按当前系统安装，只有需要用户操作时才说明具体动作。官方入口：<https://nodejs.org/>、<https://git-scm.com/downloads>。
- 如果宿主不具备这些能力，说明无法在此聊天工具中安装，提供 <https://mingshu.help/workspace?start=form>。不要声称所有聊天窗口都能安装。

## 2. 安装 CLI

```bash
npm install -g github:PanYX/mingshu-bazi
```

这是从 GitHub 安装，不要使用 `npm login`，也不要改成尚未发布的 `npm install -g mingshu-cli`。等待退出码为 0，再验证：

```bash
mingshu version --json
```

应能看到 0.2.0 或更高版本。若仍是旧版本，检查当前命令是否指向另一个安装位置。

如果安装权限不足，优先使用用户可写的 npm prefix，按当前系统配置命令路径。若安装完成却找不到命令，检查 `npm prefix -g`：Windows 的命令通常直接在该目录，macOS/Linux 通常在其 `bin` 子目录。不要为了安装全局改变系统目录权限。

## 3. 接入当前助手

只安装到用户当前使用的宿主。自动化执行使用下面的非交互命令，不要运行需要用户选择菜单的裸 `mingshu setup`：

**Codex**

```bash
mingshu setup --agent codex --json
```

默认目标为用户主目录的 `.agents/skills/mingshu-bazi/SKILL.md`。

**Claude Code**

```bash
mingshu setup --agent claude --json
```

默认目标为用户主目录的 `.claude/skills/mingshu-bazi/SKILL.md`。

**其他宿主或自定义配置目录**

先确认宿主支持的 skills 根目录，再运行：

```bash
mingshu setup --dir "已确认的 skills 根目录" --json
```

setup 自动创建 `mingshu-bazi` 子目录；`--agent` 和 `--dir` 不要同时传。Codex 和 Claude Code 的路径分别依据[Codex 文档](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills)和[Claude Code 文档](https://code.claude.com/docs/en/skills#where-skills-live)。用户明确使用不同目录时，以当前宿主的实际配置为准。

## 4. 核验结果并交接

- 检查 setup 的退出码和 JSON。`installation.path` 是写入位置；`connection.status` 为 `reachable` 才代表能力接口连接正常，不代表已经验证实际排盘、地点查询或助手加载状态。
- `SKILL_CONFLICT` 表示已存在不同内容。先检查是否是用户定制，不擅自覆盖；用户同意更新时加 `--force`，它会先备份，完成后告知备份位置。
- 连接失败时 Skill 可能已经安装。保留它，检查网络和 `MINGSHU_API_ORIGIN` 后再运行 `mingshu doctor --json`。不要把自定义服务地址写入用户环境，也不要为了安装测试发送真实出生资料。
- 安装后可以直接读取 `installation.path` 中的 Skill，按其规则继续。若宿主尚未发现新 Skill，提示用户新开对话或重启助手；不要承诺已经自动加载。
- 成功时简短告诉用户：“个人命书已安装，服务连接正常。现在对我说‘使用个人命书，帮我排八字’就可以。”如果尚有失败步骤，只说明已完成的部分和下一步，不报全部成功。

之后按已安装 Skill 收集出生信息、查询地点、构建输入并排盘。让用户用自然语言回答问题，由你负责命令和数据格式。
