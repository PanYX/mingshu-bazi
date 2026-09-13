# 独立发布与同步

公开仓库：https://github.com/PanYX/bazi-chart-engine ，许可证 MIT。

## 同步方式

私有仓库 `PanYX/private-destiny` 是唯一编辑入口，`packages/mingshu-cli` 是这份客户端的源头。改完之后从仓库根目录推送子树：

```
git subtree push --prefix packages/mingshu-cli https://github.com/PanYX/bazi-chart-engine.git main
```

如果两份历史已经分叉（例如有人直接在公开仓库改了文件），改用：

```
git subtree split --prefix packages/mingshu-cli -b cli-split
git push https://github.com/PanYX/bazi-chart-engine.git cli-split:main
git branch -D cli-split
```

不要在公开仓库直接改代码，否则两边会分叉。

## 发布前检查

1. 只有本目录内容会公开：CLI、接口契约、Skill、示例与文档。不要复制主站源码、环境变量或数据库配置。
2. 运行 `npm test` 与 `npm pack --dry-run`，确认包内文件清单。
3. 主站部署 API v1 与接入页之后，实际运行 `doctor`、`locations`、`chart`，再更新 README 里的开发版状态。
4. 确认 npm 包名归属后再发布 npm，并补上安装命令。现阶段不提供未注册包的 npx 命令。

## 关于 CI

公开仓库的 `.github/workflows/test.yml` 需要带 `workflow` 权限的凭据才能创建或更新。普通的 OAuth 应用令牌会被 GitHub 拒绝：

```
refusing to allow an OAuth App to create or update workflow .github/workflows/test.yml without workflow scope
```

所以这份工作流不放在子树里，内容保存在 `docs/ci-workflow.yml.example`。启用方式二选一：

1. 让推送凭据获得权限（`gh auth refresh -h github.com -s workflow`），再把示例文件复制为公开仓库的 `.github/workflows/test.yml` 并推送；
2. 直接在 GitHub 网页新建 `.github/workflows/test.yml`，粘贴示例内容。

启用之前 README 不放 CI 徽章，避免出现打不开的徽章。

## 共用契约

主站服务端导入本目录的 `src/contract.mjs`，两边必须保持一致：要么让主站依赖已发布的包，要么在两边校验 `apiVersion`。只把目录复制到公开仓库而不同步主站，会让主站构建失败。

Cloudflare 限流绑定属于主站部署范围，不在客户端能力内。
