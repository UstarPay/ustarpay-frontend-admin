# WalletSummaryStats 组件

## 概述
`WalletSummaryStats` 是一个钱包汇总统计组件，用于显示钱包相关的统计信息。

## 功能特性
- 显示总链数、总币种数、活跃钱包数、总余额记录数
- 响应式布局，支持不同屏幕尺寸
- 可自定义样式
- 统一的视觉设计

## 使用方法

### 基本用法
```tsx
import { WalletSummaryStats } from '@shared/components'

const MyComponent = () => {
  return (
    <WalletSummaryStats
      totalChains={5}
      totalCurrencies={12}
      activeWallets={8}
      totalBalanceRecords={45}
    />
  )
}
```

### 在钱包列表页面中使用
```tsx
<WalletSummaryStats
  totalChains={walletStats.length > 0 ? new Set(walletStats.flatMap(w => w.supportedChains)).size : 0}
  totalCurrencies={walletStats.length > 0 ? new Set(walletStats.flatMap(w => w.supportedSymbols)).size : 0}
  activeWallets={wallets.filter(w => w.wallet.status === 1).length}
  totalBalanceRecords={walletStats.reduce((sum, w) => sum + w.totalBalanceRecords, 0)}
/>
```

### 自定义样式
```tsx
<WalletSummaryStats
  totalChains={5}
  totalCurrencies={12}
  activeWallets={8}
  totalBalanceRecords={45}
  className="mb-6"
/>
```

## Props

| 属性 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| totalChains | number | 是 | - | 总链数 |
| totalCurrencies | number | 是 | - | 总币种数 |
| activeWallets | number | 是 | - | 活跃钱包数 |
| totalBalanceRecords | number | 是 | - | 总余额记录数 |
| className | string | 否 | '' | 自定义CSS类名 |

## 统计项说明

### 1. 总链数
- **描述**: 所有钱包支持的区块链总数
- **颜色**: 蓝色 (#1890ff)
- **图标**: DollarOutlined

### 2. 总币种数
- **描述**: 所有钱包支持的代币总数
- **颜色**: 绿色 (#52c41a)
- **图标**: DollarOutlined

### 3. 活跃钱包
- **描述**: 状态为正常的钱包数量
- **颜色**: 橙色 (#fa8c16)
- **图标**: WalletOutlined

### 4. 总余额记录
- **描述**: 所有钱包的余额记录总数
- **颜色**: 青色 (#13c2c2)
- **图标**: DollarOutlined

## 布局说明

### 响应式布局
- **xs (手机)**: 每行1列
- **sm (平板)**: 每行2列
- **lg (桌面)**: 每行4列

### 间距
- 卡片间距: 16px
- 使用 `gutter={[16, 16]}` 设置水平和垂直间距

## 使用场景

### 1. 钱包管理页面
```tsx
const WalletListPage = () => {
  const { data: wallets } = useQuery(['wallets'], getWallets)
  
  return (
    <div>
      <WalletSummaryStats
        totalChains={calculateTotalChains(wallets)}
        totalCurrencies={calculateTotalCurrencies(wallets)}
        activeWallets={calculateActiveWallets(wallets)}
        totalBalanceRecords={calculateTotalBalanceRecords(wallets)}
      />
      {/* 其他内容 */}
    </div>
  )
}
```

### 2. 仪表板页面
```tsx
const DashboardPage = () => {
  return (
    <div>
      <h2>钱包概览</h2>
      <WalletSummaryStats {...statsData} />
      {/* 其他仪表板内容 */}
    </div>
  )
}
```

### 3. 报告页面
```tsx
const ReportPage = () => {
  return (
    <div>
      <Card title="统计摘要">
        <WalletSummaryStats {...reportStats} />
      </Card>
    </div>
  )
}
```

## 样式定制

### 自定义颜色
组件使用了固定的颜色方案，如需自定义，可以通过CSS覆盖：

```css
.custom-stats .ant-statistic-content-value {
  color: #your-color !important;
}
```

### 自定义布局
```tsx
<WalletSummaryStats
  {...props}
  className="custom-layout"
/>
```

```css
.custom-layout .ant-col {
  margin-bottom: 24px;
}
```

## 注意事项

1. 所有数值都会直接显示，不会进行格式化
2. 组件内部使用了Ant Design的Statistic组件
3. 图标和颜色是固定的，如需修改需要修改组件源码
4. 响应式布局基于Ant Design的栅格系统

## 扩展建议

如果需要添加更多统计项，可以考虑：
- 添加更多统计指标
- 支持自定义统计项配置
- 添加趋势图表
- 支持数据刷新功能
