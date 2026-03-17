# WalletBalanceContent 数据格式测试

## 测试数据格式

### 正确的数据格式
```typescript
const testWallet: WalletWithBalance = {
  wallet: {
    id: "wallet-123",
    name: "测试钱包",
    address: "0x1234567890abcdef",
    description: "这是一个测试钱包",
    status: 1,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    tenantId: "tenant-123",
    createdBy: "user-123",
    updatedBy: "user-123",
    deletedBy: null
  },
  balanceByChain: {
    "ETH": {
      "ETH": {
        balance: "1.5",
        lastBlockHeight: "122222"
      },
      "USDT": {
        balance: "1000.0",
        lastBlockHeight: "122222"
      }
    },
    "BSC": {
      "USDT": {
        balance: "500.0",
        lastBlockHeight: "122222"
      }
    }
  }
}
```

### 组件解析结果
组件会将上述数据解析为以下表格数据：

| 区块链 | 币种 | 余额 | 区块高度 | USD价值 | 24h变化 |
|--------|------|------|----------|---------|---------|
| ETH | ETH | 1.5 ETH | 122,222 | $0.00 | 0.00% |
| ETH | USDT | 1000.0 USDT | 122,222 | $0.00 | 0.00% |
| BSC | USDT | 500.0 USDT | 122,222 | $0.00 | 0.00% |

### 钱包信息显示
- **钱包地址**: 0x1234567890abcdef
- **状态**: 正常 (绿色标签)
- **描述**: 这是一个测试钱包
- **创建时间**: 2024/1/1 上午8:00:00

## 数据验证点

### 1. balanceByChain 结构验证
```typescript
// 正确的结构
balanceByChain: {
  [chainCode: string]: {
    [symbol: string]: {
      balance: string,
      lastBlockHeight: string
    }
  }
}
```

### 2. wallet 结构验证
```typescript
// 正确的结构
wallet: {
  id: string
  name: string
  address: string
  description?: string
  status: number
  createdAt: string
  updatedAt: string
  tenantId: string
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
}
```

### 3. 空数据处理
- 当 `wallet` 为 `null` 时，显示 "请选择钱包查看资产详情"
- 当 `balanceByChain` 为空时，表格显示空状态
- 当 `balance` 为 "0" 时，显示 "0"
- 当 `lastBlockHeight` 为 "0" 时，显示 "-"

### 4. 数据转换逻辑
```typescript
// 组件内部的数据转换
Object.entries(wallet.balanceByChain).flatMap(([chainCode, chainData]) => {
  if (chainData && typeof chainData === 'object') {
    return Object.entries(chainData).map(([symbol, balanceData]) => ({
      chainCode,
      currency: symbol === 'unknown' ? 'UNKNOWN' : symbol,
      balance: balanceData?.balance || '0',
      lastBlockHeight: balanceData?.lastBlockHeight || '0',
      usdtValue: '0', // 预留字段
      change24h: '0'  // 预留字段
    }))
  }
  return []
})
```

## 常见问题

### 1. 数据格式不匹配
**问题**: 传递的数据不是 `WalletWithBalance` 格式
**解决**: 确保数据包含 `wallet` 和 `balanceByChain` 两个属性

### 2. 嵌套属性访问错误
**问题**: 直接访问 `wallet.address` 而不是 `wallet.wallet.address`
**解决**: 使用正确的嵌套属性访问

### 3. 空值处理
**问题**: 没有处理 `balanceByChain` 为空的情况
**解决**: 组件已经内置了空值处理逻辑

## 使用示例

### 在WalletListPage中的使用
```typescript
// 数据转换
const walletWithBalance: WalletWithBalance = {
  wallet: {
    id: record.id,
    name: record.name,
    address: record.address,
    description: record.description,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    tenantId: record.tenantId,
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    deletedBy: record.deletedBy
  },
  balanceByChain: record.balanceByChain
}

// 传递给组件
<WalletBalanceContent wallet={walletWithBalance} />
```

### 在其他页面中的使用
```typescript
// 直接使用API返回的数据
const { data: wallet } = useQuery({
  queryKey: ['wallet', walletId],
  queryFn: () => walletService.getWallet(walletId)
})

// 传递给组件
<WalletBalanceContent wallet={wallet} />
```
