# 热钱包创建功能

## 概述

热钱包创建功能已经更新，现在支持动态选择支持的链（chains）和代币（symbols），并实现了与 `currencyService` 和 `chainService` 的联动。

## 主要更新

### 1. **数据结构更新**

#### 热钱包类型
```typescript
export interface HotWallet extends Wallet {
  chainCodes: string[]  // 支持多个链
  symbols: string[]     // 支持多个代币
  isWithdrawalWallet: boolean
  isGasWallet: boolean
}
```

#### 创建请求类型
```typescript
export interface CreateHotWalletRequest {
  name: string
  description?: string
  chainCodes: string[]  // 支持多个链，为空表示全部
  symbols: string[]     // 支持多个代币，为空表示全部
  settings?: Partial<WalletSettings>
}
```

### 2. **表单字段更新**

#### 支持的链（chainCodes）
- **类型**: 多选下拉框
- **数据源**: `chainService.getChains()`
- **功能**: 支持搜索、清空、多选
- **说明**: 为空表示支持所有链

#### 支持的代币（symbols）
- **类型**: 多选下拉框
- **数据源**: `currencyService.getCurrencies()`
- **功能**: 支持搜索、清空、多选
- **说明**: 为空表示支持所有代币

### 3. **联动机制**

#### 数据获取
```typescript
// 获取链列表
const { data: chainsData } = useQuery({
  queryKey: ['chains'],
  queryFn: () => chainService.getChains()
})

// 获取代币列表
const { data: currenciesData } = useQuery({
  queryKey: ['currencies'],
  queryFn: () => currencyService.getCurrencies()
})
```

#### 动态渲染
```typescript
// 链选择器
<Select
  mode="multiple"
  placeholder="请选择支持的链（为空表示全部）"
  allowClear
  showSearch
  filterOption={(input, option) =>
    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
  }
>
  {chainsData?.items?.map((chain) => (
    <Option key={chain.code} value={chain.code} label={chain.name}>
      {chain.name} ({chain.code})
    </Option>
  ))}
</Select>

// 代币选择器
<Select
  mode="multiple"
  placeholder="请选择支持的代币（为空表示全部）"
  allowClear
  showSearch
  filterOption={(input, option) =>
    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
  }
>
  {currenciesData?.items?.map((currency) => (
    <Option key={currency.symbol} value={currency.symbol} label={currency.name}>
      {currency.name} ({currency.symbol})
    </Option>
  ))}
</Select>
```

## 使用流程

### 1. **创建热钱包**

#### 基本信息
- **钱包名称**: 必填，用于标识热钱包
- **描述**: 可选，详细说明热钱包用途

#### 链和代币配置
- **支持的链**: 选择该热钱包支持的区块链网络
  - 可以选择多个链（如：Bitcoin、Ethereum、BSC）
  - 不选择表示支持所有链
- **支持的代币**: 选择该热钱包支持的代币
  - 可以选择多个代币（如：BTC、ETH、USDT、USDC）
  - 不选择表示支持所有代币

#### 设置配置
- **自动归集**: 是否启用自动归集功能
- **归集阈值**: 触发自动归集的余额阈值
- **提现限额**: 单笔和日提现限额
- **审批设置**: 是否需要审批

### 2. **数据提交**

```typescript
const handleSubmit = async (values: HotWalletFormData) => {
  try {
    await createWalletMutation.mutateAsync({
      name: values.name,
      description: values.description,
      chainCodes: values.chainCodes || [],  // 空数组表示支持所有链
      symbols: values.symbols || []         // 空数组表示支持所有代币
    })
  } catch (error) {
    console.error('提交失败:', error)
  }
}
```

## 界面展示

### 1. **列表视图**

#### 支持的链列
- 显示所有选择的链代码
- 如果没有选择，显示"全部"标签
- 使用蓝色标签区分

#### 支持的代币列
- 显示所有选择的代币符号
- 如果没有选择，显示"全部"标签
- 使用绿色标签区分

### 2. **详情视图**

#### 基本信息
- 钱包名称和描述
- 支持的链和代币（使用标签展示）
- 钱包状态和类型

#### 余额信息
- 按链和代币分别显示余额
- 支持多链多代币的余额管理

### 3. **搜索筛选**

#### 链筛选
- 支持按链代码筛选热钱包
- 预设常用链：Bitcoin、Ethereum、BSC、Polygon

#### 代币筛选
- 支持按代币符号筛选热钱包
- 预设常用代币：BTC、ETH、USDT、USDC

## 技术实现

### 1. **状态管理**

```typescript
const [searchParams, setSearchParams] = useState({
  page: 1,
  pageSize: 10,
  search: '',
  chainCode: '',    // 链筛选
  symbol: '',       // 代币筛选
  status: ''
})
```

### 2. **数据查询**

```typescript
// 获取热钱包列表（包含余额）
const { data: walletData, isLoading, refetch } = useQuery({
  queryKey: ['hot-wallets', searchParams],
  queryFn: () => hotWalletService.getHotWallets({
    ...searchParams,
    includeBalance: true
  })
})
```

### 3. **表单验证**

```typescript
<Form.Item
  name="chainCodes"
  label="支持的链"
  rules={[{ required: true, message: '请选择支持的链' }]}
>
  {/* 链选择器 */}
</Form.Item>

<Form.Item
  name="symbols"
  label="支持的代币"
  rules={[{ required: true, message: '请选择支持的代币' }]}
>
  {/* 代币选择器 */}
</Form.Item>
```

## 优势特性

### 1. **灵活性**
- 支持多链多代币配置
- 空选择表示支持全部
- 动态获取链和代币数据

### 2. **用户体验**
- 搜索功能支持快速查找
- 多选模式支持批量选择
- 清空功能支持重置选择

### 3. **数据一致性**
- 与后端 API 完全对应
- 类型安全的表单处理
- 实时数据联动

### 4. **扩展性**
- 支持新增链和代币
- 可配置的筛选条件
- 灵活的显示方式

## 注意事项

### 1. **数据加载**
- 链和代币数据通过 React Query 缓存
- 首次加载可能需要等待数据获取
- 建议添加加载状态提示

### 2. **表单验证**
- 链和代币都是必填字段
- 支持空数组（表示全部）
- 验证规则可以根据业务需求调整

### 3. **性能优化**
- 使用 React Query 进行数据缓存
- 避免频繁的 API 调用
- 合理设置分页大小

### 4. **错误处理**
- 网络错误时显示友好提示
- 表单验证失败时高亮错误字段
- 提交失败时保留用户输入

## 未来扩展

### 1. **智能推荐**
- 根据用户历史选择推荐链和代币
- 基于市场热度推荐热门配置
- 支持配置模板保存和复用

### 2. **高级筛选**
- 支持按链类型筛选（如：Layer1、Layer2）
- 支持按代币类型筛选（如：稳定币、治理代币）
- 支持自定义筛选条件

### 3. **批量操作**
- 支持批量创建热钱包
- 支持批量更新配置
- 支持批量状态管理

这种设计使得热钱包创建更加灵活和强大，支持多链多代币的复杂配置，同时保持了良好的用户体验和代码质量。
