# 前端开发指南

## 项目概述

NH资产钱包托管系统的平台管理前端，基于现代化的 React 技术栈构建，提供企业级的用户体验和功能。

## 技术架构

### 核心技术栈
- **React 18** + **TypeScript** - 现代化 React 应用开发
- **Vite** - 快速构建工具和开发服务器
- **Ant Design 5.x** - 企业级 UI 组件库
- **Tailwind CSS** - 实用优先的 CSS 框架

### 状态管理
- **Zustand** - 轻量级全局状态管理
- **React Query** - 服务端状态管理和缓存
- **React Hook Form** + **Zod** - 表单处理和验证

### 路由和导航
- **React Router 6** - 现代化客户端路由
- 权限路由守卫
- 嵌套路由支持

## 项目结构

```
src/
├── components/             # 可复用组件
│   ├── Layout/            # 布局组件
│   │   ├── MainLayout.tsx # 主布局
│   │   └── AuthLayout.tsx # 认证布局
│   ├── Route/             # 路由组件
│   │   ├── ProtectedRoute.tsx # 受保护路由
│   │   └── PublicRoute.tsx    # 公开路由
│   └── Common/            # 通用组件
├── pages/                 # 页面组件
│   ├── Auth/              # 认证页面
│   │   └── LoginPage.tsx
│   ├── Dashboard/         # 仪表盘
│   │   └── DashboardPage.tsx
│   ├── Tenant/            # 租户管理
│   │   ├── TenantListPage.tsx
│   │   └── TenantDetailPage.tsx
│   ├── User/              # 用户管理
│   ├── Role/              # 角色管理
│   ├── System/            # 系统设置
│   ├── Security/          # 安全设置
│   └── Error/             # 错误页面
├── services/              # API 服务
│   ├── apiClient.ts       # HTTP 客户端
│   └── queryClient.ts     # React Query 配置
├── stores/                # 状态管理
│   ├── authStore.ts       # 认证状态
│   └── appStore.ts        # 应用状态
├── App.tsx                # 应用根组件
├── main.tsx               # 应用入口
└── index.css              # 全局样式
```

### 共享模块
```
../shared/
├── types/                 # 共享类型定义
│   └── index.ts
├── components/            # 共享组件
│   ├── AddressDisplay.tsx # 地址显示组件
│   ├── AmountDisplay.tsx  # 金额显示组件
│   ├── StatusBadge.tsx    # 状态徽章组件
│   └── index.ts
└── utils/                 # 工具函数
    └── index.ts
```

## 核心功能

### 1. 认证和权限系统
- **JWT 认证**：基于 Token 的用户认证
- **角色权限**：细粒度的权限控制
- **路由守卫**：自动权限检查和重定向
- **会话管理**：自动处理 Token 刷新

### 2. 全局状态管理
- **authStore**：用户认证、权限、个人信息
- **appStore**：UI 状态、主题、通知、加载状态

### 3. API 客户端
- **统一封装**：axios 基础配置和拦截器
- **自动认证**：请求自动携带 Token
- **错误处理**：统一错误处理和用户提示
- **Loading 状态**：全局和局部加载状态管理

### 4. UI 组件系统
- **布局组件**：主布局、认证布局
- **业务组件**：地址显示、金额显示、状态徽章
- **通用组件**：表格、表单、弹窗等
- **响应式设计**：支持桌面和移动设备

## 开发规范

### 代码组织
```typescript
// 组件文件结构
import React from 'react'
import { 组件依赖 } from 'antd'
import { 自定义hooks } from '@/hooks'
import { 类型定义 } from '@shared/types'

// 组件Props类型定义
interface ComponentProps {
  // ...
}

// 组件实现
const Component: React.FC<ComponentProps> = (props) => {
  // hooks 和状态
  // 事件处理函数
  // 渲染函数
  
  return (
    // JSX
  )
}

export default Component
```

### 状态管理模式
```typescript
// Zustand Store
interface StoreState {
  // 状态字段
}

interface StoreActions {
  // 动作方法
}

export const useStore = create<StoreState & StoreActions>()(
  persist(
    (set, get) => ({
      // 状态初始值
      // 动作实现
    }),
    {
      name: 'store-name',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

### API 调用模式
```typescript
// React Query 使用
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => apiClient.get(`/api/resource/${id}`),
  enabled: !!id,
})

// Mutation 使用
const mutation = useMutation({
  mutationFn: (data) => apiClient.post('/api/resource', data),
  onSuccess: () => {
    // 成功处理
    queryClient.invalidateQueries({ queryKey: ['resource'] })
  },
})
```

### 权限检查
```typescript
// 组件中使用
const { hasPermission } = useAuthStore()

// 条件渲染
{hasPermission('tenant:create') && (
  <Button>创建租户</Button>
)}

// 路由守卫
<ProtectedRoute permission="tenant:read">
  <TenantListPage />
</ProtectedRoute>
```

## 数据流

### 1. 认证流程
```
登录页面 → API 调用 → 获取 Token → 更新 authStore → 跳转主页
主页加载 → 检查权限 → 显示对应功能 → API 调用携带 Token
```

### 2. 数据获取流程
```
页面组件 → useQuery Hook → API 客户端 → 后端服务
响应数据 → React Query 缓存 → 组件状态更新 → UI 渲染
```

### 3. 表单提交流程
```
表单组件 → 表单验证 → useMutation Hook → API 客户端
提交成功 → 缓存失效 → 数据重新获取 → UI 更新
```

## 样式系统

### Tailwind CSS 配置
```css
/* 全局样式 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自定义组件样式 */
@layer components {
  .btn-primary {
    @apply bg-blue-500 text-white px-4 py-2 rounded;
  }
}
```

### Ant Design 主题定制
```typescript
// 主题配置
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Button: {
      colorPrimary: '#1890ff',
    },
  },
}
```

## 性能优化

### 1. 代码分割
```typescript
// 路由懒加载
const TenantListPage = lazy(() => import('@/pages/Tenant/TenantListPage'))

// 组件懒加载
<Suspense fallback={<Loading />}>
  <TenantListPage />
</Suspense>
```

### 2. 缓存策略
```typescript
// React Query 缓存配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
    },
  },
})
```

### 3. 组件优化
```typescript
// useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data)
}, [data])

// useCallback 缓存回调函数
const handleClick = useCallback(() => {
  // 处理逻辑
}, [dependency])
```

## 测试策略

### 单元测试
```typescript
// 组件测试
describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})

// Hook 测试
describe('useCustomHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useCustomHook())
    expect(result.current.value).toBe('expected')
  })
})
```

### 集成测试
```typescript
// API 集成测试
describe('API Integration', () => {
  it('should fetch data correctly', async () => {
    const data = await apiClient.get('/api/data')
    expect(data).toMatchObject(expectedSchema)
  })
})
```

## 部署和构建

### 开发环境
```bash
npm run dev          # 启动开发服务器
npm run lint         # 代码检查
npm run type-check   # 类型检查
```

### 生产构建
```bash
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
```

### 环境变量
```env
# .env.development
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_TITLE=NH资产钱包托管系统

# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_APP_TITLE=NH资产钱包托管系统
```

## 最佳实践

### 1. 组件设计
- 保持组件单一职责
- 使用 TypeScript 严格类型检查
- 编写可复用的通用组件
- 遵循 React Hooks 规则

### 2. 状态管理
- 全局状态最小化
- 优先使用服务端状态
- 避免过度嵌套的状态结构
- 使用 immer 处理复杂状态更新

### 3. API 集成
- 统一错误处理机制
- 实现请求去重和缓存
- 添加加载和错误状态
- 使用 TypeScript 类型定义 API 响应

### 4. 用户体验
- 响应式设计适配移动端
- 添加加载状态和骨架屏
- 实现错误边界和降级处理
- 提供清晰的用户反馈

## 故障排除

### 常见问题

1. **编译错误**
   - 检查 TypeScript 类型定义
   - 确认依赖版本兼容性
   - 清理 node_modules 重新安装

2. **路由问题**
   - 检查路由路径配置
   - 确认权限检查逻辑
   - 验证路由组件导入

3. **API 调用失败**
   - 检查网络连接和 CORS
   - 确认 API 端点和参数
   - 验证认证 Token 有效性

4. **样式问题**
   - 检查 Tailwind 配置
   - 确认 Ant Design 主题设置
   - 验证 CSS 类名冲突

### 调试工具
- React Developer Tools
- Redux DevTools (for Zustand)
- React Query DevTools
- 浏览器开发者工具

---

## 下一步计划

1. **完善页面功能**
   - 用户管理页面
   - 角色权限管理
   - 系统设置页面
   - 安全设置页面

2. **增强用户体验**
   - 添加动画和过渡效果
   - 实现主题切换功能
   - 添加国际化支持
   - 优化移动端体验

3. **性能优化**
   - 实现虚拟滚动
   - 添加预加载机制
   - 优化包大小
   - 实现 PWA 功能

4. **测试完善**
   - 编写单元测试
   - 添加集成测试
   - 实现 E2E 测试
   - 设置 CI/CD 流程
