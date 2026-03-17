# 热钱包组件结构

## 组件拆分说明

我们将原来的 `HotWalletListPage` 按功能模块进行了拆分，创建了更清晰、可维护的组件结构。

## 组件架构

```
HotWalletListPage (主页面)
├── HotWalletList (列表组件)
├── HotWalletForm (表单组件)
├── HotWalletDetail (详情组件)
└── HotWalletSettings (设置组件)
```

## 组件职责

### 1. HotWalletListPage (主页面)
**职责**: 页面状态管理和视图切换
- 管理当前视图状态 (`list` | `detail` | `settings`)
- 处理组件间的通信和回调
- 管理全局状态（选中的钱包ID、编辑状态等）

**主要功能**:
- 视图切换逻辑
- 全局状态管理
- 组件协调

### 2. HotWalletList (列表组件)
**职责**: 热钱包列表展示和搜索
- 显示统计卡片
- 搜索和筛选功能
- 钱包列表表格
- 操作按钮（查看、编辑、设置、删除）

**主要功能**:
- 统计概览（总钱包数、活跃钱包、总余额、今日交易）
- 搜索筛选（名称、币种、状态）
- 分页列表
- 操作按钮

### 3. HotWalletForm (表单组件)
**职责**: 创建和编辑热钱包
- 创建新热钱包
- 编辑现有热钱包
- 表单验证和提交

**主要功能**:
- 基本信息（名称、币种、描述）
- 归集设置（自动归集、归集阈值）
- 限额设置（单笔提现限额、日提现限额）
- 审批设置（是否需要审批）

### 4. HotWalletDetail (详情组件)
**职责**: 显示热钱包详细信息
- 基本信息展示
- 余额信息统计
- 配置信息预览
- 操作历史

**主要功能**:
- 基本信息（名称、币种、状态、描述、创建时间）
- 余额统计（总余额、锁定余额、可用余额、地址数量）
- 配置预览（归集设置、限额设置、审批设置）
- 操作按钮（编辑、设置、返回）

### 5. HotWalletSettings (设置组件)
**职责**: 配置热钱包参数
- 归集设置配置
- 限额设置配置
- 审批设置配置
- 高级设置配置

**主要功能**:
- 归集设置（自动归集开关、归集阈值）
- 限额设置（单笔提现限额、日提现限额）
- 审批设置（审批开关）
- 高级设置（最大地址数量、Gas限制、Gas价格）

## 数据流

```
用户操作 → 组件事件 → 主页面处理 → 状态更新 → 视图切换
```

1. **列表视图**: 显示所有热钱包，支持搜索、筛选、分页
2. **详情视图**: 点击"查看详情"进入，显示单个钱包的完整信息
3. **设置视图**: 从详情页面点击"设置"进入，配置钱包参数
4. **表单视图**: 点击"创建"或"编辑"弹出，处理数据提交

## 状态管理

### 主页面状态
```tsx
const [currentView, setCurrentView] = useState<ViewType>('list')
const [selectedWalletId, setSelectedWalletId] = useState<string>('')
const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
const [formVisible, setFormVisible] = useState(false)
```

### 组件通信
- **事件向上**: 子组件通过 props 回调函数向父组件发送事件
- **状态向下**: 父组件通过 props 向子组件传递状态和数据
- **数据共享**: 通过 React Query 进行数据获取和缓存

## 优势

### 1. **职责分离**
- 每个组件只负责特定的功能
- 代码更清晰，易于理解和维护

### 2. **可复用性**
- 组件可以在其他页面中复用
- 降低代码重复

### 3. **可测试性**
- 每个组件可以独立测试
- 测试覆盖更全面

### 4. **可维护性**
- 修改某个功能只需要修改对应的组件
- 不会影响其他功能

### 5. **性能优化**
- 组件可以独立优化
- 支持懒加载和代码分割

## 扩展性

### 新增功能
- 在对应组件中添加新功能
- 通过 props 传递新的回调函数

### 新增视图
- 在 `ViewType` 中添加新的视图类型
- 在 `renderCurrentView` 中添加新的渲染逻辑

### 新增组件
- 创建新的功能组件
- 在 `components/index.ts` 中导出
- 在主页面中集成

## 使用示例

```tsx
// 在主页面中使用
<HotWalletList
  onCreate={handleCreate}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onViewDetail={handleViewDetail}
  onSettings={handleSettings}
/>

// 在详情页面中
<HotWalletDetail
  walletId={selectedWalletId}
  onEdit={handleEdit}
  onSettings={handleSettings}
  onBack={handleBackToList}
/>
```

这种组件拆分方式使得代码更加模块化，每个组件都有明确的职责，便于开发和维护。
