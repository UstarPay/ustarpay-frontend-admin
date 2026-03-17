# 租户门户 (Tenant Portal)

NH资产钱包托管系统的租户前端应用

## 项目概述

租户门户是一个基于React 18构建的现代化Web应用，为NH资产钱包托管系统的租户提供完整的钱包管理功能。

## 技术栈

### 核心技术
- **React 18** - 现代化React框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速构建工具
- **React Router 6** - 客户端路由

### UI & 样式
- **Ant Design 5.x** - 企业级UI组件库
- **Tailwind CSS** - 实用工具优先的CSS框架
- **@ant-design/icons** - 图标库

### 状态管理
- **Zustand** - 轻量级状态管理
- **React Query (TanStack Query)** - 服务端状态管理

### 开发工具
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **PostCSS** - CSS后处理器

## 功能特性

### 🔐 认证与授权
- 用户登录/注册
- JWT token管理
- 权限控制
- 会话管理

### 💼 钱包管理
- 钱包创建与管理
- 多币种支持
- 地址生成与管理
- 余额查询

### 💸 交易管理
- 交易记录查询
- 提现申请
- 交易状态追踪
- 历史记录

### 🔒 安全中心
- 两步验证
- 登录会话管理
- 操作日志
- 安全设置

### ⚙️ 系统设置
- 个人资料管理
- 通知设置
- 界面偏好设置

## 项目结构

```
src/
├── components/         # 公共组件
│   ├── Layout/        # 布局组件
│   └── ProtectedRoute.tsx  # 路由保护
├── pages/             # 页面组件
│   ├── auth/          # 认证页面
│   ├── dashboard/     # 仪表盘
│   └── error/         # 错误页面
├── services/          # API服务
│   ├── api.ts         # HTTP客户端
│   ├── authService.ts # 认证服务
│   └── walletService.ts # 钱包服务
├── stores/            # 状态管理
│   ├── authStore.ts   # 认证状态
│   └── appStore.ts    # 应用状态
├── routes/            # 路由配置
└── App.tsx           # 应用根组件
```

## 开发指南

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install --legacy-peer-deps
```

### 开发模式
```bash
npm run dev
```
应用将在 http://localhost:3001 启动

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

### 代码检查
```bash
npm run lint
```

## 环境配置

### 环境变量
创建 `.env.local` 文件：

```env
# API配置
VITE_API_BASE_URL=http://localhost:8080/api

# 应用配置
VITE_APP_TITLE=租户门户
VITE_APP_VERSION=1.0.0

# 开发配置
VITE_ENABLE_DEVTOOLS=true
```

### 代理配置
开发环境下，API请求会自动代理到后端服务：
- `/api/*` → `http://localhost:8080/api/*`

## 共享模块

项目使用 `@shared` 模块提供公共功能：

### 组件
- AmountDisplay - 金额显示
- StatusBadge - 状态标签
- LoadingSpinner - 加载动画

### Hooks
- useLocalStorage - 本地存储
- useDebounce - 防抖
- useAsync - 异步状态管理
- usePermissions - 权限检查

### 工具函数
- formatCurrency - 货币格式化
- formatDate - 日期格式化
- 验证函数等

## 部署说明

### 生产环境部署
1. 构建项目：`npm run build`
2. 部署 `dist` 目录到静态服务器
3. 配置Nginx代理API请求

### Docker部署
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 测试

### 单元测试
```bash
npm run test
```

### E2E测试
```bash
npm run test:e2e
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建Pull Request

## 许可证

版权所有 © 2024 NH资产钱包托管系统

## 联系方式

- 项目维护者：开发团队
- 技术支持：support@example.com
