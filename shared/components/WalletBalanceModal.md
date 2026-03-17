# WalletBalanceModal 组件

## 概述
`WalletBalanceModal` 是一个可复用的钱包余额详情Modal组件，可以在钱包详情、冷钱包、热钱包等页面中使用。

## 功能特性
- 显示钱包基本信息（地址、状态、描述、创建时间）
- 展示钱包的资产详情表格（按链-币种分组）
- 支持余额格式化显示
- 支持区块高度、USD价值、24h变化等字段
- 响应式设计，支持水平滚动

## 使用方法

### 基本用法
```tsx
import { WalletBalanceModal } from '@shared/components'
import { WalletWithBalance } from '@shared/types'

const MyComponent = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletWithBalance | null>(null)

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

### 在钱包列表中使用
```tsx
// 在表格的操作列中
{
  title: '操作',
  key: 'actions',
  render: (_, record: WalletWithBalance) => (
    <Button
      type="link"
      onClick={() => {
        setSelectedWallet(record)
        setModalVisible(true)
      }}
    >
      查看余额
    </Button>
  )
}
```

### 在钱包详情页面中使用
```tsx
const WalletDetailPage = () => {
  const { data: wallet } = useQuery({
    queryKey: ['wallet', walletId],
    queryFn: () => walletService.getWallet(walletId)
  })

  return (
    <div>
      <Button onClick={() => setModalVisible(true)}>
        查看资产详情
      </Button>
      
      <WalletBalanceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        wallet={wallet}
      />
    </div>
  )
}
```

## Props

| 属性 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| visible | boolean | 是 | - | Modal是否可见 |
| onClose | () => void | 是 | - | 关闭Modal的回调函数 |
| wallet | WalletWithBalance \| null | 是 | - | 钱包数据，包含wallet和balanceByChain信息 |

## 数据结构要求

组件期望的 `WalletWithBalance` 数据结构：
```typescript
interface WalletWithBalance {
  wallet: {
    id: string
    name: string
    address: string
    description?: string
    status: number
    createdAt: string
    // ... 其他钱包字段
  }
  balanceByChain: {
    [chainCode: string]: {
      [symbol: string]: {
        balance: string
        lastBlockHeight: string
      }
    }
  }
}
```

## 样式定制

组件使用了 Tailwind CSS 类名，可以通过以下方式定制样式：

- 钱包信息区域：`bg-gray-50 rounded-lg`
- 余额显示：`font-semibold text-green-600`
- 标签颜色：`color="purple"` (区块链), `color="blue"` (币种)
- 表格滚动：`scroll={{ x: 600 }}`

## 注意事项

1. 组件内部处理了空数据的情况，当 `wallet` 为 `null` 或 `balanceByChain` 为空时会显示空状态
2. 余额格式化支持大数字显示（K、M单位）
3. 区块高度会进行千分位格式化
4. 组件是响应式的，在小屏幕上会自动滚动

## 扩展建议

如果需要添加更多功能，可以考虑：
- 添加导出功能
- 添加刷新余额功能
- 添加更多统计信息
- 支持自定义列配置
