# 钱包余额组件

## 概述
提供了两个钱包余额相关的组件：
- `WalletBalanceContent`：纯内容展示组件
- `WalletBalanceModal`：Modal包装器组件

## WalletBalanceContent

### 特性
- 只负责展示内容，不包含Modal包装
- 可以在任何地方使用（Modal、页面、卡片等）
- 支持自定义className
- 处理空数据状态

### 使用方法

#### 在Modal中使用
```tsx
import { Modal } from 'antd'
import { WalletBalanceContent } from '@shared/components'

const MyModal = ({ visible, onClose, wallet }) => (
  <Modal
    title="钱包资产详情"
    open={visible}
    onCancel={onClose}
    width={1000}
  >
    <WalletBalanceContent wallet={wallet} />
  </Modal>
)
```

#### 在页面中直接使用
```tsx
import { Card } from 'antd'
import { WalletBalanceContent } from '@shared/components'

const WalletDetailPage = ({ wallet }) => (
  <div>
    <Card title="钱包信息">
      <WalletBalanceContent wallet={wallet} />
    </Card>
  </div>
)
```

#### 在卡片中使用
```tsx
import { Card } from 'antd'
import { WalletBalanceContent } from '@shared/components'

const WalletCard = ({ wallet }) => (
  <Card 
    title={wallet.wallet.name}
    className="mb-4"
  >
    <WalletBalanceContent 
      wallet={wallet} 
      className="p-4" 
    />
  </Card>
)
```

### Props
| 属性 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| wallet | WalletWithBalance \| null | 是 | - | 钱包数据 |
| className | string | 否 | '' | 自定义CSS类名 |

## WalletBalanceModal

### 特性
- 包装了WalletBalanceContent
- 提供完整的Modal功能
- 支持自定义标题和宽度
- 简化的API

### 使用方法

#### 基本用法
```tsx
import { WalletBalanceModal } from '@shared/components'

const MyComponent = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)

  return (
    <div>
      <Button onClick={() => setModalVisible(true)}>
        查看余额
      </Button>
      
      <WalletBalanceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        wallet={selectedWallet}
      />
    </div>
  )
}
```

#### 自定义标题和宽度
```tsx
<WalletBalanceModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  wallet={selectedWallet}
  title="自定义标题"
  width={1200}
/>
```

### Props
| 属性 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| visible | boolean | 是 | - | Modal是否可见 |
| onClose | () => void | 是 | - | 关闭回调 |
| wallet | WalletWithBalance \| null | 是 | - | 钱包数据 |
| title | string \| ReactNode | 否 | 自动生成 | Modal标题 |
| width | number | 否 | 1000 | Modal宽度 |

## 使用场景

### 1. 钱包列表页面
```tsx
// 使用Modal方式
<WalletBalanceModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  wallet={selectedWallet}
/>
```

### 2. 钱包详情页面
```tsx
// 直接嵌入页面
<Card title="资产详情">
  <WalletBalanceContent wallet={wallet} />
</Card>
```

### 3. 冷钱包管理页面
```tsx
// 在卡片中展示
<Card title={`${wallet.name} - 资产分布`}>
  <WalletBalanceContent wallet={wallet} />
</Card>
```

### 4. 热钱包管理页面
```tsx
// 在抽屉中展示
<Drawer title="钱包资产" open={drawerVisible} onClose={onClose}>
  <WalletBalanceContent wallet={wallet} />
</Drawer>
```

## 优势

1. **灵活性**：内容组件可以在任何地方使用
2. **复用性**：Modal组件提供开箱即用的Modal功能
3. **一致性**：所有地方使用相同的展示逻辑
4. **可维护性**：修改一处影响所有使用的地方
5. **可扩展性**：容易添加新功能

## 注意事项

1. `WalletBalanceContent` 处理了空数据状态
2. 组件内部使用了Tailwind CSS类名
3. 表格支持水平滚动
4. 余额格式化支持大数字显示
5. 区块高度会进行千分位格式化
