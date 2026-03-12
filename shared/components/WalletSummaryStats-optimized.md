# WalletSummaryStats 优化版组件

## 概述
优化后的 `WalletSummaryStats` 组件采用现代化设计，包含渐变背景、悬停效果、更好的图标和布局。

## 优化特性

### 1. 视觉设计优化
- **渐变背景**：每个卡片都有独特的渐变背景色
- **圆角设计**：12px圆角，更加现代化
- **阴影效果**：基础阴影 + 悬停阴影
- **无边框**：去除默认边框，更加简洁

### 2. 交互效果
- **悬停动画**：鼠标悬停时卡片上移和阴影加深
- **平滑过渡**：300ms过渡动画
- **视觉反馈**：清晰的交互状态变化

### 3. 图标和布局优化
- **图标容器**：圆角背景容器包装图标
- **图标选择**：更语义化的图标选择
- **布局改进**：更好的间距和对齐

### 4. 颜色方案
每个统计项都有独特的颜色主题：

| 统计项 | 图标 | 主色调 | 渐变背景 | 图标背景 |
|--------|------|--------|----------|----------|
| 总链数 | LinkOutlined | 蓝色 | blue-50 → cyan-50 | blue-100 |
| 总币种数 | DollarOutlined | 绿色 | green-50 → emerald-50 | green-100 |
| 活跃钱包 | WalletOutlined | 橙色 | orange-50 → red-50 | orange-100 |
| 总余额记录 | DatabaseOutlined | 紫色 | purple-50 → pink-50 | purple-100 |

## 使用方法

### 基本用法
```tsx
import { WalletSummaryStats } from '@shared/components'

<WalletSummaryStats
  totalChains={5}
  totalCurrencies={12}
  activeWallets={8}
  totalBalanceRecords={45}
/>
```

### 自定义样式
```tsx
<WalletSummaryStats
  totalChains={5}
  totalCurrencies={12}
  activeWallets={8}
  totalBalanceRecords={45}
  className="mb-8"
/>
```

## 设计细节

### 卡片结构
```
┌─────────────────────────────┐
│  [图标] 标题                 │
│  数值                       │
│  ████████ (渐变条)          │
└─────────────────────────────┘
```

### 悬停效果
- **Y轴位移**：向上移动4px (`hover:-translate-y-1`)
- **阴影变化**：从 `shadow-sm` 到 `shadow-lg`
- **过渡时间**：300ms (`duration-300`)

### 响应式布局
- **xs (手机)**: 每行1列
- **sm (平板)**: 每行2列  
- **lg (桌面)**: 每行4列
- **间距**: 20px (`gutter={[20, 20]}`)

## 技术实现

### 数据结构
```typescript
const statsData = [
  {
    title: '总链数',
    value: totalChains,
    icon: <LinkOutlined />,
    gradient: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    valueColor: 'text-blue-600'
  },
  // ... 其他统计项
]
```

### 样式类名
- **渐变背景**: `bg-gradient-to-br from-{color}-50 to-{color}-50`
- **图标背景**: `bg-{color}-100`
- **文字颜色**: `text-{color}-600`
- **渐变条**: `bg-gradient-to-r from-{color}-500 to-{color}-500`

## 对比优化前后

### 优化前
- 简单的Ant Design Statistic组件
- 统一的图标和颜色
- 基础的卡片样式
- 无交互效果

### 优化后
- 自定义的现代化设计
- 每个统计项独特的视觉主题
- 渐变背景和圆角设计
- 悬停动画和交互效果
- 更好的信息层次和可读性

## 使用场景

### 1. 钱包管理页面
```tsx
<WalletSummaryStats
  totalChains={walletStats.length > 0 ? new Set(walletStats.flatMap(w => w.supportedChains)).size : 0}
  totalCurrencies={walletStats.length > 0 ? new Set(walletStats.flatMap(w => w.supportedSymbols)).size : 0}
  activeWallets={wallets.filter(w => w.wallet.status === 1).length}
  totalBalanceRecords={walletStats.reduce((sum, w) => sum + w.totalBalanceRecords, 0)}
/>
```

### 2. 仪表板页面
```tsx
<WalletSummaryStats
  totalChains={dashboardData.chains}
  totalCurrencies={dashboardData.currencies}
  activeWallets={dashboardData.activeWallets}
  totalBalanceRecords={dashboardData.balanceRecords}
  className="mb-6"
/>
```

## 自定义扩展

### 添加新的统计项
```typescript
// 在statsData数组中添加新项
{
  title: '新统计项',
  value: newValue,
  icon: <NewIcon />,
  gradient: 'from-indigo-500 to-purple-500',
  bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
  iconBg: 'bg-indigo-100',
  iconColor: 'text-indigo-600',
  valueColor: 'text-indigo-600'
}
```

### 自定义颜色主题
```typescript
// 修改现有统计项的颜色
{
  title: '总链数',
  value: totalChains,
  icon: <LinkOutlined />,
  gradient: 'from-red-500 to-pink-500', // 自定义渐变
  bgColor: 'bg-gradient-to-br from-red-50 to-pink-50', // 自定义背景
  iconBg: 'bg-red-100', // 自定义图标背景
  iconColor: 'text-red-600', // 自定义图标颜色
  valueColor: 'text-red-600' // 自定义数值颜色
}
```

## 注意事项

1. 组件使用了Tailwind CSS类名，确保项目中已配置Tailwind
2. 数值会自动添加千分位分隔符 (`toLocaleString()`)
3. 悬停效果在移动设备上可能不明显
4. 渐变效果需要支持CSS渐变的浏览器

## 性能考虑

- 使用`map`渲染统计项，性能良好
- 悬停效果使用CSS transition，性能优秀
- 组件轻量，无额外依赖
- 支持React.memo优化（如需要）
