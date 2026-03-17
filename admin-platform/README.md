# NH资产钱包托管系统 - 平台管理前端

企业级NH资产钱包托管系统的平台管理后台，基于 React + TypeScript + Vite 构建。

## 技术栈

### 核心框架
- **React 18** - 现代化 React 应用
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具和开发服务器

### UI 组件库
- **Ant Design 5.x** - 企业级 UI 设计语言
- **Tailwind CSS** - 实用优先的 CSS 框架
- **@ant-design/icons** - 图标库

### 状态管理
- **Zustand** - 轻量级状态管理
- **React Query** - 服务端状态管理和缓存

### 路由和表单
- **React Router 6** - 客户端路由
- **React Hook Form** - 高性能表单库
- **Zod** - TypeScript 优先的模式验证

### 工具库
- **Axios** - HTTP 客户端
- **dayjs** - 现代化的日期时间库
- **react-helmet-async** - 文档头管理

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── Layout/         # 布局组件
│   ├── Route/          # 路由组件
│   └── Common/         # 通用组件
├── pages/              # 页面组件
│   ├── Auth/           # 认证页面
│   ├── Dashboard/      # 仪表盘
│   ├── Tenant/         # 租户管理
│   ├── User/           # 用户管理
│   ├── Role/           # 角色管理
│   ├── System/         # 系统设置
│   ├── Security/       # 安全设置
│   └── Error/          # 错误页面
├── services/           # API 服务
│   ├── apiClient.ts    # HTTP 客户端
│   └── queryClient.ts  # React Query 配置
├── stores/             # 状态管理
│   ├── authStore.ts    # 认证状态
│   └── appStore.ts     # 应用状态
├── App.tsx             # 应用根组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 开发指南

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 开发模式
```bash
npm run dev
# 或
yarn dev
```

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

### 代码检查
```bash
npm run lint
# 或
yarn lint
```

### 类型检查
```bash
npm run type-check
# 或
yarn type-check
```

## 核心功能

### 认证和权限
- 基于 JWT 的用户认证
- 细粒度的权限控制
- 角色和权限管理
- 受保护的路由组件

### 租户管理
- 多租户系统架构
- 租户信息管理
- 租户状态控制
- 订阅计划管理

### 用户管理
- 平台用户管理
- 用户角色分配
- 用户状态控制
- 操作日志记录

### 系统设置
- 系统参数配置
- 安全策略设置
- 通知配置
- 币种管理

## 开发规范

### 代码风格
- 使用 ESLint 和 Prettier 进行代码格式化
- 遵循 TypeScript 严格模式
- 使用 Conventional Commits 规范

### 组件开发
- 优先使用函数组件和 Hooks
- 使用 TypeScript 进行类型定义
- 保持组件的单一职责原则
- 编写可复用的通用组件

### 状态管理
- 使用 Zustand 管理全局状态
- 使用 React Query 管理服务端状态
- 避免过度使用全局状态

### API 调用
- 统一使用 apiClient 进行 HTTP 请求
- 使用 React Query 进行数据缓存和同步
- 实现统一的错误处理机制

## 部署

### 构建配置
- 支持多环境构建配置
- 自动化的构建和部署流程
- 静态资源 CDN 优化

### 环境配置
- 开发环境：`npm run dev`
- 测试环境：`npm run build:test`
- 生产环境：`npm run build:prod`

## 贡献指南

1. 创建功能分支
2. 实现功能并添加测试
3. 确保代码通过 lint 和类型检查
4. 提交 Pull Request

## 许可证

该项目仅供内部使用，未经授权不得复制或分发。
