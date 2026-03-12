# PageHeaderCard 组件

## 概述
`PageHeaderCard` 是一个美化的页面头部卡片组件，包含顶部彩条、标题、副标题、操作按钮和左下角装饰性logo。

## 功能特性
- 顶部彩色渐变条
- 可自定义的标题和副标题
- 支持操作按钮区域
- 左下角装饰性logo
- 响应式设计
- 可自定义渐变颜色

## 使用方法

### 基本用法
```tsx
import { PageHeaderCard } from '@shared/components'

const MyPage = () => {
  return (
    <PageHeaderCard
      title="页面标题"
      subtitle="页面副标题描述"
    />
  )
}
```

### 带操作按钮
```tsx
<PageHeaderCard
  title="钱包管理"
  subtitle="管理您的数字钱包和查看资产余额"
  actions={
    <Space>
      <Button icon={<ReloadOutlined />}>刷新</Button>
      <Button type="primary" icon={<PlusOutlined />}>创建</Button>
    </Space>
  }
/>
```

### 自定义logo和颜色
```tsx
<PageHeaderCard
  title="用户管理"
  subtitle="管理系统用户和权限"
  logoText="Admin Panel"
  gradientColors={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
  actions={<Button>操作</Button>}
/>
```

### 隐藏logo
```tsx
<PageHeaderCard
  title="简单页面"
  subtitle="不需要logo的页面"
  showLogo={false}
/>
```

## Props

| 属性 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| title | string | 是 | - | 页面标题 |
| subtitle | string | 否 | - | 页面副标题 |
| actions | ReactNode | 否 | - | 操作按钮区域 |
| className | string | 否 | '' | 自定义CSS类名 |
| showLogo | boolean | 否 | true | 是否显示logo |
| logoText | string | 否 | 'NH Wallet' | logo文字 |
| gradientColors | string[] | 否 | ['#667eea', '#764ba2', '#f093fb', '#f5576c'] | 渐变颜色数组 |

## 设计说明

### 顶部彩条
- 高度：4px
- 样式：135度渐变
- 位置：卡片顶部
- 圆角：顶部圆角与卡片一致

### 标题区域
- 主标题：大号字体，深灰色
- 副标题：中等字体，浅灰色
- 布局：左对齐，垂直排列

### Logo设计
- **右上角小logo**：彩色胶囊形状，包含图标和文字
- **左下角装饰logo**：大号半透明装饰，渐变文字效果
- **图标**：使用WalletOutlined图标

### 操作按钮
- 位置：右上角
- 布局：使用Space组件排列
- 样式：保持原有按钮样式

## 渐变颜色方案

### 默认方案（蓝紫色系）
```typescript
['#667eea', '#764ba2', '#f093fb', '#f5576c']
```

### 其他推荐方案

#### 绿色系
```typescript
['#56ab2f', '#a8e6cf', '#88d8a3', '#4ecdc4']
```

#### 橙色系
```typescript
['#ff9a9e', '#fecfef', '#fecfef', '#ffecd2']
```

#### 蓝色系
```typescript
['#667eea', '#764ba2', '#f093fb', '#f5576c']
```

#### 紫色系
```typescript
['#a8edea', '#fed6e3', '#d299c2', '#fad0c4']
```

## 使用场景

### 1. 钱包管理页面
```tsx
<PageHeaderCard
  title="钱包管理"
  subtitle="管理您的数字钱包和查看资产余额"
  logoText="NH Wallet"
  gradientColors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
  actions={
    <Space>
      <Button icon={<ReloadOutlined />}>刷新</Button>
      <Button type="primary" icon={<PlusOutlined />}>创建钱包</Button>
    </Space>
  }
/>
```

### 2. 用户管理页面
```tsx
<PageHeaderCard
  title="用户管理"
  subtitle="管理系统用户和权限设置"
  logoText="Admin Panel"
  gradientColors={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
  actions={<Button type="primary">添加用户</Button>}
/>
```

### 3. 仪表板页面
```tsx
<PageHeaderCard
  title="数据仪表板"
  subtitle="实时监控系统运行状态"
  logoText="Dashboard"
  gradientColors={['#667eea', '#764ba2']}
/>
```

### 4. 设置页面
```tsx
<PageHeaderCard
  title="系统设置"
  subtitle="配置系统参数和选项"
  showLogo={false}
  actions={<Button>保存设置</Button>}
/>
```

## 样式定制

### 自定义卡片样式
```tsx
<PageHeaderCard
  title="自定义页面"
  className="shadow-lg border-2"
/>
```

### 自定义渐变效果
```tsx
<PageHeaderCard
  title="自定义渐变"
  gradientColors={['#your-color-1', '#your-color-2', '#your-color-3']}
/>
```

### 通过CSS覆盖样式
```css
.custom-header .ant-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.custom-header .gradient-bar {
  height: 6px;
}
```

## 注意事项

1. 渐变颜色数组至少需要2个颜色值
2. 左下角logo是装饰性的，不会影响布局
3. 组件使用了Tailwind CSS类名
4. 响应式设计在不同屏幕尺寸下都能良好显示
5. 操作按钮区域是可选的，不传则不显示

## 扩展建议

如果需要添加更多功能，可以考虑：
- 添加面包屑导航
- 支持自定义图标
- 添加搜索框
- 支持多行操作按钮
- 添加状态指示器
