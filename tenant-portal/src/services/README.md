# 热钱包服务 (HotWalletService)

## 概述

`HotWalletService` 是专门为热钱包管理设计的服务类，与租户钱包服务分开，提供完整的热钱包 CRUD 操作和余额管理功能。

## 服务特点

### 1. **独立服务**
- 与 `walletService` 完全分离
- 专门处理热钱包相关的业务逻辑
- 支持热钱包特有的功能（如余额管理、状态更新等）

### 2. **完整的功能覆盖**
- 热钱包的创建、查询、更新、删除
- 热钱包余额管理
- 热钱包统计信息
- 状态管理和配置

### 3. **类型安全**
- 使用 TypeScript 强类型
- 完整的类型定义和接口
- 与 Go 后端 API 完全对应

## API 接口

### 基础操作

#### 获取热钱包列表（包含余额）
```typescript
getHotWallets(params?: HotWalletQueryParams): Promise<PaginatedResponse<HotWalletWithBalance>>
```
- **路径**: `GET /hot-wallets/balance`
- **功能**: 获取分页的热钱包列表，默认包含余额信息
- **参数**: 支持分页、搜索、筛选等

#### 获取热钱包详情
```typescript
getHotWallet(id: string): Promise<HotWallet>
```
- **路径**: `GET /hot-wallets/:id`
- **功能**: 获取单个热钱包的详细信息

#### 创建热钱包
```typescript
createHotWallet(data: CreateHotWalletRequest): Promise<HotWallet>
```
- **路径**: `POST /hot-wallets`
- **功能**: 创建新的热钱包

#### 更新热钱包状态
```typescript
updateHotWalletStatus(id: string, data: UpdateHotWalletStatusRequest): Promise<HotWallet>
```
- **路径**: `PATCH /hot-wallets/:id/status`
- **功能**: 更新热钱包的状态（活跃、冻结、暂停等）

#### 删除热钱包
```typescript
deleteHotWallet(id: string): Promise<void>
```
- **路径**: `DELETE /hot-wallets/:id`
- **功能**: 删除指定的热钱包

### 余额管理

#### 获取热钱包余额列表
```typescript
getHotWalletBalances(params?: HotWalletBalanceQueryParams): Promise<PaginatedResponse<HotWalletWithBalance>>
```
- **路径**: `GET /hot-wallets/balance`
- **功能**: 获取所有热钱包的余额信息，支持分页和筛选

#### 根据地址获取余额
```typescript
getHotWalletBalanceByAddress(address: string): Promise<HotWalletWithBalance>
```
- **路径**: `GET /hot-wallets/balance/address/:address`
- **功能**: 根据地址获取特定热钱包的余额信息

#### 根据代币获取余额
```typescript
getHotWalletBalancesByToken(chainCode: string, symbol: string): Promise<HotWalletWithBalance[]>
```
- **路径**: `GET /hot-wallets/balance/token/:chainCode/:symbol`
- **功能**: 获取指定链和代币的所有热钱包余额

### 统计信息

#### 获取热钱包统计
```typescript
getHotWalletStats(): Promise<HotWalletStats>
```
- **路径**: `GET /hot-wallets/stats`
- **功能**: 获取热钱包的整体统计信息

## 数据类型

### 核心类型

#### HotWallet
```typescript
interface HotWallet extends Wallet {
  tenantId: string
  name: string
  description?: string
  currency: string
  chainCode: string
  status: HotWalletStatus
  settings: HotWalletSettings
  addressCount?: number
  transactionCount?: number
}
```

#### HotWalletWithBalance
```typescript
interface HotWalletWithBalance extends Omit<HotWallet, 'balance'> {
  balance: HotWalletBalance
}
```

#### HotWalletBalance
```typescript
interface HotWalletBalance extends BaseEntity {
  walletId: string
  walletName: string
  address: string
  currency: string
  chainCode: string
  balance: string
  lockedBalance: string
  availableBalance: string
  frozenBalance?: string
  totalBalance: string
  usdtValue?: string
  change24h?: string
  lastUpdatedAt: string
}
```

#### HotWalletStats
```typescript
interface HotWalletStats {
  totalWallets: number
  activeWallets: number
  totalBalance: string
  totalUsdtValue: string
  totalAddresses: number
  todayTransactions: number
  monthlyTransactions: number
  currencies: string[]
  chainCodes: string[]
}
```

### 请求类型

#### CreateHotWalletRequest
```typescript
interface CreateHotWalletRequest {
  name: string
  description?: string
  currency: string
  chainCode: string
  settings?: Partial<WalletSettings>
}
```

#### UpdateHotWalletStatusRequest
```typescript
interface UpdateHotWalletStatusRequest {
  status: WalletStatus
  reason?: string
}
```

### 查询参数

#### HotWalletQueryParams
```typescript
interface HotWalletQueryParams {
  page?: number
  pageSize?: number
  search?: string
  currency?: string
  chainCode?: string
  status?: string
  includeBalance?: boolean
}
```

#### HotWalletBalanceQueryParams
```typescript
interface HotWalletBalanceQueryParams {
  page?: number
  pageSize?: number
  search?: string
  currency?: string
  chainCode?: string
  status?: string
  minBalance?: string
  maxBalance?: string
}
```

## 使用示例

### 1. 获取热钱包列表
```typescript
import { hotWalletService } from '@/services'

// 获取所有热钱包（包含余额）
const hotWallets = await hotWalletService.getHotWallets({
  page: 1,
  pageSize: 20,
  includeBalance: true
})

// 筛选特定币种的热钱包
const btcWallets = await hotWalletService.getHotWallets({
  currency: 'btc',
  includeBalance: true
})
```

### 2. 创建热钱包
```typescript
const newWallet = await hotWalletService.createHotWallet({
  name: 'BTC热钱包',
  description: '用于快速交易的BTC热钱包',
  currency: 'btc',
  chainCode: 'bitcoin',
  settings: {
    autoCollection: true,
    collectionThreshold: 0.001,
    withdrawalLimit: 1.0,
    dailyWithdrawalLimit: 10.0,
    requiresApproval: false
  }
})
```

### 3. 更新热钱包状态
```typescript
await hotWalletService.updateHotWalletStatus('wallet-id', {
  status: WalletStatus.FROZEN,
  reason: '安全风险，暂时冻结'
})
```

### 4. 获取余额信息
```typescript
// 获取所有热钱包余额
const balances = await hotWalletService.getHotWalletBalances({
  minBalance: '0.001',
  currency: 'btc'
})

// 根据地址获取余额
const walletBalance = await hotWalletService.getHotWalletBalanceByAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
```

### 5. 获取统计信息
```typescript
const stats = await hotWalletService.getHotWalletStats()
console.log(`总热钱包数: ${stats.totalWallets}`)
console.log(`活跃钱包: ${stats.activeWallets}`)
console.log(`总余额: ${stats.totalBalance}`)
```

## 与现有服务的区别

### 1. **walletService vs hotWalletService**

| 特性 | walletService | hotWalletService |
|------|---------------|------------------|
| 用途 | 通用钱包管理 | 专门的热钱包管理 |
| 余额 | 基础余额信息 | 详细的余额管理 |
| 状态 | 基础状态 | 热钱包特有状态 |
| 配置 | 通用设置 | 热钱包专用设置 |

### 2. **数据获取方式**
- **walletService**: 通过 `/wallets` 获取所有钱包
- **hotWalletService**: 通过 `/hot-wallets/balance` 获取热钱包（默认包含余额）

### 3. **功能特性**
- **walletService**: 支持冷钱包和热钱包
- **hotWalletService**: 专门针对热钱包的快速交易和余额管理

## 错误处理

服务使用统一的错误处理机制：

```typescript
try {
  const wallets = await hotWalletService.getHotWallets()
} catch (error) {
  if (error.response?.status === 404) {
    console.error('热钱包不存在')
  } else if (error.response?.status === 403) {
    console.error('权限不足')
  } else {
    console.error('获取热钱包失败:', error.message)
  }
}
```

## 最佳实践

### 1. **性能优化**
- 使用 React Query 进行数据缓存
- 合理设置分页大小
- 避免频繁的余额查询

### 2. **错误处理**
- 始终使用 try-catch 包装 API 调用
- 提供用户友好的错误提示
- 记录详细的错误日志

### 3. **类型安全**
- 使用 TypeScript 类型检查
- 避免使用 `any` 类型
- 保持类型定义与后端 API 同步

## 扩展性

### 1. **新增功能**
- 在 `hotWalletService` 中添加新的方法
- 更新相应的类型定义
- 保持向后兼容性

### 2. **自定义配置**
- 支持自定义的查询参数
- 可扩展的筛选条件
- 灵活的排序选项

这种设计使得热钱包服务既独立又完整，为热钱包管理提供了专业、高效的解决方案。
