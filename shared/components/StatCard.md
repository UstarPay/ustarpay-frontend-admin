# StatCard 通用统计卡片组件

## 概述
`StatCard` 是一个通用的统计卡片组件，用于显示各种统计信息。组件采用现代化设计，具有顶部彩色条带、主图标、装饰图标和趋势指示器。

## 特性
- 🎨 **现代化设计**：顶部彩色条带、圆角卡片、悬停动画
- 🎯 **高度可定制**：支持自定义图标、颜色、数值格式
- 📱 **响应式**：适配不同屏幕尺寸
- ⚡ **性能优化**：轻量级实现，无额外依赖
- 🔧 **类型安全**：完整的TypeScript类型定义
- 📊 **趋势指示**：支持上升、下降趋势显示
- 🎭 **装饰元素**：右下角装饰图标增强视觉效果

## 基本用法

### 导入组件
```tsx
import { StatCard } from '@shared/components'
// 或者
import StatCard from '@shared/components/StatCard'
```

### 简单使用
```tsx
<StatCard
  title="总用户数"
  value={1234}
  icon={<UserOutlined />}
/>
```

### 完整配置
```tsx
<StatCard
  title="总交易额"
  value={1234567}
  icon={<DollarOutlined />}
  decorationIcon={<ShoppingOutlined />}
  topStripColor="bg-green-500"
  iconColor="text-green-600"
  valueColor="text-gray-800"
  suffix=" USD"
  trend="up"
  showThousandsSeparator={true}
/>
```

## API 参考

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `title` | `string` | - | **必需** 统计项标题 |
| `value` | `number \| string` | - | **必需** 统计项数值 |
| `icon` | `React.ReactNode` | - | **必需** 主图标组件（数值旁边） |
| `decorationIcon` | `React.ReactNode` | - | 装饰图标组件（右下角） |
| `topStripColor` | `string` | `'bg-blue-500'` | 顶部条带颜色类名 |
| `iconColor` | `string` | `'text-blue-600'` | 主图标颜色类名 |
| `valueColor` | `string` | `'text-gray-800'` | 数值颜色类名 |
| `bgColor` | `string` | `'bg-white'` | 卡片背景色类名 |
| `className` | `string` | `''` | 自定义类名 |
| `showThousandsSeparator` | `boolean` | `true` | 是否显示千分位分隔符 |
| `suffix` | `string` | `''` | 数值后缀 |
| `prefix` | `string` | `''` | 数值前缀 |
| `trend` | `'up' \| 'down' \| 'neutral'` | - | 趋势指示器 |

## 使用示例

### 1. 基础统计卡片
```tsx
<StatCard
  title="活跃用户"
  value={1234}
  icon={<UserOutlined />}
/>
```

### 2. 带后缀的数值
```tsx
<StatCard
  title="总交易额"
  value={1234567}
  icon={<DollarOutlined />}
  suffix=" USD"
  iconBg="bg-green-100"
  iconColor="text-green-600"
  valueColor="text-green-600"
  gradient="from-green-500 to-emerald-500"
/>
```

### 3. 百分比显示
```tsx
<StatCard
  title="增长率"
  value={12.5}
  icon={<RiseOutlined />}
  suffix="%"
  iconBg="bg-red-100"
  iconColor="text-red-600"
  valueColor="text-red-600"
  gradient="from-red-500 to-pink-500"
/>
```

### 4. 自定义样式
```tsx
<StatCard
  title="自定义统计"
  value={999}
  icon={<StarOutlined />}
  iconBg="bg-purple-100"
  iconColor="text-purple-600"
  valueColor="text-purple-600"
  gradient="from-purple-500 to-indigo-500"
  bgColor="bg-gray-50"
  className="border-2 border-purple-200"
/>
```

### 5. 不显示千分位分隔符
```tsx
<StatCard
  title="版本号"
  value="1.2.3"
  icon={<CodeOutlined />}
  showThousandsSeparator={false}
/>
```

## 预设颜色主题

### 蓝色主题
```tsx
<StatCard
  title="总链数"
  value={5}
  icon={<LinkOutlined />}
  iconBg="bg-blue-100"
  iconColor="text-blue-600"
  valueColor="text-blue-600"
  gradient="from-blue-500 to-cyan-500"
/>
```

### 绿色主题
```tsx
<StatCard
  title="总币种数"
  value={12}
  icon={<DollarOutlined />}
  iconBg="bg-green-100"
  iconColor="text-green-600"
  valueColor="text-green-600"
  gradient="from-green-500 to-emerald-500"
/>
```

### 橙色主题
```tsx
<StatCard
  title="活跃钱包"
  value={8}
  icon={<WalletOutlined />}
  iconBg="bg-orange-100"
  iconColor="text-orange-600"
  valueColor="text-orange-600"
  gradient="from-orange-500 to-red-500"
/>
```

### 紫色主题
```tsx
<StatCard
  title="总余额记录"
  value={45}
  icon={<DatabaseOutlined />}
  iconBg="bg-purple-100"
  iconColor="text-purple-600"
  valueColor="text-purple-600"
  gradient="from-purple-500 to-pink-500"
/>
```

## 布局示例

### 网格布局
```tsx
import { Row, Col } from 'antd'

<Row gutter={[20, 20]}>
  <Col xs={24} sm={12} lg={6}>
    <StatCard title="用户数" value={1234} icon={<UserOutlined />} />
  </Col>
  <Col xs={24} sm={12} lg={6}>
    <StatCard title="订单数" value={5678} icon={<ShoppingOutlined />} />
  </Col>
  <Col xs={24} sm={12} lg={6}>
    <StatCard title="收入" value={9999} icon={<DollarOutlined />} />
  </Col>
  <Col xs={24} sm={12} lg={6}>
    <StatCard title="增长率" value={12.5} icon={<RiseOutlined />} />
  </Col>
</Row>
```

### 单行布局
```tsx
<div className="flex gap-4">
  <StatCard title="今日访问" value={1234} icon={<EyeOutlined />} />
  <StatCard title="今日注册" value={56} icon={<UserAddOutlined />} />
  <StatCard title="今日收入" value={7890} icon={<DollarOutlined />} />
</div>
```

## 样式定制

### 自定义颜色
```tsx
// 使用自定义颜色类名
<StatCard
  title="自定义统计"
  value={123}
  icon={<StarOutlined />}
  iconBg="bg-yellow-100"
  iconColor="text-yellow-600"
  valueColor="text-yellow-600"
  gradient="from-yellow-500 to-orange-500"
/>
```

### 自定义背景
```tsx
<StatCard
  title="特殊统计"
  value={456}
  icon={<CrownOutlined />}
  bgColor="bg-gradient-to-br from-purple-50 to-pink-50"
  className="border border-purple-200"
/>
```

### 自定义尺寸
```tsx
<StatCard
  title="大号统计"
  value={789}
  icon={<TrophyOutlined />}
  className="h-32"
/>
```

## 交互效果

### 悬停效果
- **Y轴位移**：向上移动4px
- **阴影变化**：从 `shadow-sm` 到 `shadow-lg`
- **过渡时间**：300ms

### CSS类名
```css
/* 悬停效果 */
.hover:shadow-lg        /* 阴影加深 */
.hover:-translate-y-1   /* 向上移动 */
.transition-all.duration-300  /* 300ms过渡 */
```

## 最佳实践

### 1. 图标选择
- 使用语义化的图标
- 保持图标风格一致
- 避免过于复杂的图标

### 2. 颜色搭配
- 使用品牌色彩
- 保持视觉层次
- 考虑可访问性

### 3. 数值格式
- 大数值使用千分位分隔符
- 百分比添加 `%` 后缀
- 货币添加相应符号

### 4. 响应式设计
- 使用Ant Design的栅格系统
- 考虑移动端显示
- 保持合理的间距

## 注意事项

1. **Tailwind CSS**：组件使用Tailwind CSS类名，确保项目中已配置
2. **数值类型**：`value` 支持 `number` 和 `string` 类型
3. **千分位分隔符**：仅对 `number` 类型生效
4. **图标大小**：图标大小由 `text-lg` 类控制
5. **渐变效果**：需要支持CSS渐变的浏览器

## 性能考虑

- 组件轻量级，无额外依赖
- 使用CSS transition，性能优秀
- 支持React.memo优化（如需要）
- 避免频繁重新渲染

## 扩展建议

### 添加新功能
- 支持加载状态
- 支持点击事件
- 支持更多数值格式
- 支持自定义动画

### 主题系统
- 创建预设主题配置
- 支持暗色模式
- 支持品牌色彩定制
