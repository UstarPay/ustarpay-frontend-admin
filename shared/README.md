# NH Shared Module

NH资产钱包托管系统的共享前端模块，提供可重用的组件、Hooks、类型定义、常量和工具函数。

## 📦 模块结构

```
shared/
├── constants/          # 常量定义
│   └── index.ts       # API端点、加密货币配置、主题等
├── hooks/             # React Hooks
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   ├── useInterval.ts
│   ├── useAsync.ts
│   ├── useClipboard.ts
│   ├── usePermissions.ts
│   ├── useWebSocket.ts
│   ├── usePagination.ts
│   ├── useModal.ts
│   ├── useTable.ts
│   └── index.ts
├── components/        # React 组件
│   ├── LoadingSpinner.tsx
│   ├── EmptyState.tsx
│   ├── ConfirmDialog.tsx
│   ├── ErrorBoundary.tsx
│   ├── CryptoIcon.tsx
│   ├── QRCodeDisplay.tsx
│   ├── AddressDisplay.tsx
│   ├── AmountDisplay.tsx
│   ├── StatusBadge.tsx
│   └── index.ts
├── utils/             # 工具函数
│   ├── formatters.ts  # 数据格式化
│   ├── validators.ts  # 表单验证
│   ├── api.ts        # API 客户端
│   └── index.ts      # 通用工具
├── types/             # TypeScript 类型定义
│   └── index.ts      # 所有业务类型
├── package.json       # 模块配置
├── index.ts          # 主入口文件
└── README.md         # 文档
```

## 🚀 快速开始

### 安装依赖

```bash
# 在项目根目录安装所有依赖
npm install

# 或者只安装shared模块的依赖
cd frontend/shared
npm install
```

### 导入使用

```typescript
// 导入所有内容
import { useLocalStorage, LoadingSpinner, formatCrypto, User } from '@nh/shared'

// 按模块导入
import { useLocalStorage, useDebounce } from '@nh/shared/hooks'
import { LoadingSpinner, EmptyState } from '@nh/shared/components'
import { formatCrypto, validators } from '@nh/shared/utils'
import { User, Transaction } from '@nh/shared/types'
import { API_ENDPOINTS, CRYPTOCURRENCIES } from '@nh/shared/constants'
```

## 📚 模块详述

### 🔧 Constants (常量)

包含系统中使用的所有常量定义：

- **API_ENDPOINTS**: API 端点配置
- **CRYPTOCURRENCIES**: 加密货币元数据
- **BLOCKCHAIN_NETWORKS**: 区块链网络配置
- **PAGINATION**: 分页配置
- **DATE_FORMATS**: 日期格式
- **STATUS_COLORS**: 状态颜色映射
- **PERMISSIONS**: 权限字符串
- **THEMES**: 主题配置

```typescript
import { API_ENDPOINTS, CRYPTOCURRENCIES } from '@nh/shared'

// 使用API端点
const response = await fetch(API_ENDPOINTS.TENANTS.LIST)

// 获取加密货币信息
const btcInfo = CRYPTOCURRENCIES.BTC
console.log(btcInfo.symbol) // 'BTC'
console.log(btcInfo.decimals) // 8
```

### 🎣 Hooks (React钩子)

提供常用的React Hooks：

#### useLocalStorage
同步的localStorage状态管理，支持跨标签页通信。

```typescript
import { useLocalStorage } from '@nh/shared'

function MyComponent() {
  const [user, setUser] = useLocalStorage('user', null)
  
  return (
    <div>
      {user ? `Hello ${user.name}` : 'Not logged in'}
    </div>
  )
}
```

#### useDebounce
防抖功能，支持值防抖和回调防抖。

```typescript
import { useDebounce } from '@nh/shared'

function SearchInput() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  
  useEffect(() => {
    if (debouncedQuery) {
      // 执行搜索
      search(debouncedQuery)
    }
  }, [debouncedQuery])
  
  return (
    <input 
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="搜索..."
    />
  )
}
```

#### useAsync
异步函数状态管理。

```typescript
import { useAsync } from '@nh/shared'

function UserProfile({ userId }) {
  const { data: user, loading, error, execute } = useAsync(
    () => fetchUser(userId),
    [userId]
  )
  
  if (loading) return <LoadingSpinner />
  if (error) return <div>Error: {error.message}</div>
  if (!user) return null
  
  return <div>Hello {user.name}</div>
}
```

#### usePermissions
权限检查Hooks。

```typescript
import { usePermissions } from '@nh/shared'

function AdminPanel() {
  const { hasPermission, hasRole, PermissionGuard } = usePermissions()
  
  return (
    <div>
      {hasPermission('user.create') && (
        <button>创建用户</button>
      )}
      
      <PermissionGuard permission="admin.panel">
        <AdminSettings />
      </PermissionGuard>
    </div>
  )
}
```

### 🧩 Components (组件)

提供常用的UI组件：

#### LoadingSpinner
加载指示器组件。

```typescript
import { LoadingSpinner } from '@nh/shared'

<LoadingSpinner 
  fullscreen 
  text="加载中..." 
  overlay 
/>
```

#### EmptyState
空状态组件。

```typescript
import { EmptyState } from '@nh/shared'

<EmptyState
  title="暂无数据"
  description="还没有创建任何钱包"
  action={{
    text: "创建钱包",
    onClick: () => navigate('/wallets/create')
  }}
/>
```

#### ConfirmDialog
确认对话框组件。

```typescript
import { ConfirmDialog, showConfirmDialog } from '@nh/shared'

// 使用组件
<ConfirmDialog
  open={showDialog}
  title="删除确认"
  content="确定要删除这个钱包吗？"
  type="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowDialog(false)}
/>

// 或使用帮助函数
const handleDelete = async () => {
  const confirmed = await showConfirmDialog({
    title: '删除确认',
    content: '确定要删除这个钱包吗？',
    type: 'danger'
  })
  
  if (confirmed) {
    // 执行删除
  }
}
```

#### AddressDisplay
区块链地址显示组件。

```typescript
import { AddressDisplay } from '@nh/shared'

<AddressDisplay
  address="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
  copyable
  explorer="https://blockstream.info/address/"
/>
```

### 🛠️ Utils (工具函数)

提供数据格式化、验证和API工具：

#### formatters (格式化工具)
各种数据格式化函数。

```typescript
import { formatCrypto, formatFiat, formatTime } from '@nh/shared'

// 格式化加密货币金额
formatCrypto('1.23456789', 'BTC') // '1.23456789 BTC'

// 格式化法币金额
formatFiat(1234.56, 'USD') // '$1,234.56'

// 格式化时间
formatTime.relative('2023-12-01') // '2 days ago'
formatTime.smart('2023-12-01') // 智能显示
```

#### validators (验证工具)
表单验证函数。

```typescript
import { validators, antdRules } from '@nh/shared'

// 单独验证
const emailResult = validators.email('test@example.com')
if (!emailResult.isValid) {
  console.log(emailResult.message)
}

// Ant Design表单集成
<Form.Item name="email" rules={[antdRules.email]}>
  <Input />
</Form.Item>
```

#### api (API客户端)
HTTP请求客户端。

```typescript
import { createApiClient } from '@nh/shared'

const apiClient = createApiClient({
  baseURL: 'https://api.example.com',
  onUnauthorized: () => {
    // 处理未授权
    router.push('/login')
  },
  onError: (error) => {
    // 全局错误处理
    notification.error({
      message: '请求错误',
      description: error.message
    })
  }
})

// 使用API客户端
const users = await apiClient.get('/users')
const newUser = await apiClient.post('/users', userData)
```

### 📝 Types (类型定义)

提供完整的TypeScript类型定义：

```typescript
import type { User, Wallet, Transaction, ApiResponse } from '@nh/shared'

interface ComponentProps {
  user: User
  wallets: Wallet[]
  onTransactionCreate: (transaction: Transaction) => void
}

const handleApiResponse = (response: ApiResponse<User[]>) => {
  if (response.success) {
    // 处理用户数据
    console.log(response.data)
  }
}
```

## 🎨 主题和样式

共享模块使用Ant Design和Tailwind CSS，支持明暗主题：

```typescript
import { THEMES } from '@nh/shared'

// 获取主题配置
const lightTheme = THEMES.light
const darkTheme = THEMES.dark
```

## 🔐 权限系统

内置的权限管理系统：

```typescript
import { PERMISSIONS, usePermissions } from '@nh/shared'

// 权限常量
console.log(PERMISSIONS.USER.CREATE) // 'user.create'

// 在组件中使用
const { hasPermission, hasAnyPermission, hasRole } = usePermissions()

if (hasPermission(PERMISSIONS.WALLET.DELETE)) {
  // 显示删除按钮
}
```

## 🌐 国际化支持

支持多语言（预留接口）：

```typescript
// 将来支持
import { t } from '@nh/shared'

const message = t('common.loading') // '加载中...'
```

## 📊 数据验证

完整的数据验证支持：

```typescript
import { validators, combineValidators } from '@nh/shared'

// 组合验证
const validateUserForm = (data) => {
  return combineValidators(data.email, [
    () => validators.required(data.email),
    () => validators.email(data.email),
  ])
}
```

## 🔄 实时通信

WebSocket支持：

```typescript
import { useWebSocket } from '@nh/shared'

function RealTimeComponent() {
  const { 
    connectionState, 
    sendMessage, 
    lastMessage 
  } = useWebSocket('ws://localhost:8080', {
    onMessage: (event, data) => {
      console.log('收到消息:', data)
    },
    reconnectAttempts: 5
  })
  
  return (
    <div>
      状态: {connectionState}
      <button onClick={() => sendMessage({ type: 'ping' })}>
        发送消息
      </button>
    </div>
  )
}
```

## 🧪 测试

```bash
# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint

# 修复代码风格问题
npm run lint:fix
```

## 📄 许可证

本项目使用 MIT 许可证。详见 [LICENSE](../LICENSE) 文件。

## 🤝 贡献

欢迎提交 Pull Request 或创建 Issue。

## 📞 支持

如有问题，请联系 NH 团队或创建 GitHub Issue。
