# 搭个伴 CampusMate

校园搭子匹配平台的展示型 MVP。项目用于演示“需求提出 → Codex 开发 → 团队 Review → 集成验收”的 AI 开发流程，不作为正式线上服务使用。

## 当前能力

- 活动发现、关键词搜索、分类/日期/地点筛选
- 活动详情、发布活动和表单校验
- 申请加入、发起人审批、退出或取消活动
- 模拟登录/注册、个人中心和我的组队
- `localStorage` 本地持久化，支持重置演示数据
- 电脑端与移动端响应式布局

## 技术栈

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- 浏览器 `localStorage`

## 本地运行

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

提交前运行：

```bash
npm run lint
npm run build
```

## 项目边界

这是课堂展示项目。第一阶段不接入真实学校账号、云数据库、地图、支付或实时聊天；所有演示数据保存在当前浏览器中。

## 四人开发边界

本次迭代 DDL：**北京时间 2026 年 7 月 19 日 12:00**。

| 成员 | 角色 | 负责功能 | 建议分支 |
| --- | --- | --- | --- |
| 刘昊阳 | A：发现页与视觉体验 | 首页、活动卡片、搜索、分类/日期/地点筛选、推荐区、响应式布局、统一 UI | `feature/discover-ui` |
| 贺雯忆 | B：活动业务流程 | 活动详情、创建/编辑/取消活动、报名/退出、满员与候补、表单校验 | `feature/activity-flow` |
| 纪传昊 | C：组队与社交互动 | 我的组队、成员匹配、邀请、通知、评论、收藏、举报、演示版消息 | `feature/team-social` |
| 韩威如 | D：用户、数据与质量 | 登录注册、个人中心、兴趣标签、统计、Mock 数据、本地存储、测试与最终演示 | `feature/profile-quality` |

详细任务、阶段计划和验收标准见 [TEAM_TASK_BREAKDOWN.md](./TEAM_TASK_BREAKDOWN.md)。

### 开发截止要求

- 每位成员在 DDL 前完成本模块必做功能。
- DDL 前提交 Pull Request，不直接提交 `main`。
- PR 必须说明完成内容、测试结果和已知问题。
- 至少由另一位成员完成 Review 后再合并。
- 合并前必须通过 `npm run lint` 和 `npm run build`。

所有代码修改通过 Codex 完成；所有改动从 Issue 开始，在独立分支中完成，并通过 Pull Request 合并到 `main`。

详细协作规则见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 系统使用方式

### 1. 安装与启动

Windows PowerShell 如果提示 `npm.ps1` 被禁止执行，请使用 `npm.cmd`：

```powershell
cd "D:\LHY Private Doc\研究生\论文\26-6-23\SC26-CampusMate"
npm.cmd install
npm.cmd run dev
```

然后访问 <http://localhost:3000>。

### 2. 推荐演示流程

1. 打开首页，在“发现活动”中浏览活动卡片。
2. 使用关键词、分类、日期和地点筛选活动。
3. 点击活动卡片进入详情，查看时间、地点、人数、发起人和成员。
4. 进入登录页，使用演示账号登录，或注册一个本地账号。
5. 报名参加活动，在“我的组队”查看报名状态。
6. 进入“发布活动”，创建自习、运动、拼饭或比赛活动。
7. 返回首页确认新活动，并打开详情查看报名人数变化。
8. 在个人中心编辑兴趣标签，查看参加次数、发起次数和信用分。
9. 在通知、评论、收藏等页面体验社交互动功能。

### 3. 数据说明

- 项目使用浏览器 `localStorage` 保存演示数据。
- 数据只保存在当前浏览器，不会上传到服务器。
- 清空浏览器站点数据后，演示数据会恢复为初始 Mock 数据。
- 不使用真实学校账号、支付、地图定位或实时聊天服务。

### 4. 提交前检查

```bash
npm run lint
npm run build
```

如果 PowerShell 拦截 `npm`，对应使用：

```powershell
npm.cmd run lint
npm.cmd run build
```
