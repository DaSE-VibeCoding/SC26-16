# CampusMate 协作规范

## 工作流

```text
Issue → 分支 → Codex 实现 → lint/build → Pull Request → Review → 合并 main
```

## 分支命名

```text
feat/<issue>-<short-name>
fix/<issue>-<short-name>
ui/<issue>-<short-name>
test/<issue>-<short-name>
docs/<issue>-<short-name>
```

例如：

```text
feat/7-demo-user-switch
ui/4-discovery-page
fix/9-capacity-check
```

## Commit 命名

```text
feat: add demo user switch
fix: prevent duplicate applications
ui: improve mobile navigation
test: add core flow checklist
docs: update project guide
```

## Pull Request 要求

- 标题说明完整改动，例如 `feat: complete activity application flow`；
- 关联对应 Issue，例如 `Closes #7`；
- 说明 Codex 完成了什么；
- 写明 `npm run lint` 和 `npm run build` 结果；
- UI 修改附上截图；
- 至少一名非作者成员 Review 后再合并；
- 不允许作者自己绕过 Review 合并自己的 PR。

## 文件冲突规则

以下文件是共享核心文件，修改前必须在 Issue 或 PR 中说明：

- `components/app-provider.tsx`
- `lib/types.ts`
- `lib/storage.ts`
- `app/globals.css`

如果两个任务同时需要修改同一个共享文件，应先合并接口变更，再让后续分支同步 `main`。

## 四人角色

- A：项目负责人和集成人；
- B：发现页、公共 UI 和响应式；
- C：活动发布、详情、申请和审批；
- D：用户/组队、数据、测试和演示交付。

每个人都负责通过 Codex 完成自己的代码任务；团队成员负责提出需求、验证结果和 Review。
