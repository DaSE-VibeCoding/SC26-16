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

| 角色 | 主要目录 |
| --- | --- |
| UI 与发现页 | `app/page.tsx`、`components/`、`app/globals.css` |
| 活动流程 | `app/create/`、`app/activity/` |
| 用户与组队 | `app/login/`、`app/register/`、`app/profile/`、`app/my-team/` |
| 数据与质量 | `lib/`、`components/app-provider.tsx`、`tests/`、`docs/` |

所有代码修改通过 Codex 完成；所有改动从 Issue 开始，在独立分支中完成，并通过 Pull Request 合并到 `main`。

详细协作规则见 [CONTRIBUTING.md](./CONTRIBUTING.md)。
