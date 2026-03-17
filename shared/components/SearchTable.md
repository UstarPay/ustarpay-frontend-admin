# SearchTable 通用搜索表格组件

## 概述
`SearchTable` 是一个功能强大的通用搜索表格组件，支持多字段搜索、下拉选择、分页、排序等功能。组件采用现代化设计，高度可定制，适用于各种数据展示场景。

## 特性
- 🔍 **多字段搜索**：支持文本、下拉、日期、数字等多种搜索类型
- 📊 **动态表格**：支持排序、分页、行选择等功能
- 🎨 **现代化UI**：采用Ant Design设计语言，界面美观
- ⚡ **高性能**：内置搜索过滤逻辑，支持大数据量
- 🔧 **高度可定制**：支持自定义列渲染、搜索字段等
- 📱 **响应式**：适配不同屏幕尺寸
- 🎯 **类型安全**：完整的TypeScript类型定义

## 基本用法

### 导入组件
```tsx
import { SearchTable } from '@shared/components'
// 或者
import SearchTable from '@shared/components/SearchTable'
```

### 简单使用
```tsx
const data = [
  { id: 1, name: '张三', age: 25, status: 'active' },
  { id: 2, name: '李四', age: 30, status: 'inactive' }
]

const columns = [
  { key: 'name', title: '姓名', dataIndex: 'name' },
  { key: 'age', title: '年龄', dataIndex: 'age' },
  { key: 'status', title: '状态', dataIndex: 'status' }
]

const searchFields = [
  { key: 'name', label: '姓名', type: 'text' },
  { key: 'status', label: '状态', type: 'select', options: [
    { label: '活跃', value: 'active' },
    { label: '非活跃', value: 'inactive' }
  ]}
]

<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  title="用户列表"
/>
```

## API 参考

### Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `dataSource` | `any[]` | `[]` | **必需** 数据源 |
| `columns` | `TableColumn[]` | `[]` | **必需** 表格列配置 |
| `searchFields` | `SearchField[]` | `[]` | **必需** 搜索字段配置 |
| `title` | `string` | - | 表格标题 |
| `showSearch` | `boolean` | `true` | 是否显示搜索区域 |
| `showRefresh` | `boolean` | `true` | 是否显示刷新按钮 |
| `showReset` | `boolean` | `true` | 是否显示重置按钮 |
| `pageSize` | `number` | `10` | 每页显示条数 |
| `showPagination` | `boolean` | `true` | 是否显示分页 |
| `scroll` | `object` | - | 表格滚动配置 |
| `rowSelection` | `object` | - | 行选择配置 |
| `loading` | `boolean` | `false` | 加载状态 |
| `className` | `string` | `''` | 自定义类名 |
| `onSearch` | `function` | - | 搜索回调 |
| `onRefresh` | `function` | - | 刷新回调 |
| `onReset` | `function` | - | 重置回调 |
| `onTableChange` | `function` | - | 表格变化回调 |

### SearchField 类型

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `key` | `string` | - | **必需** 字段键名 |
| `label` | `string` | - | **必需** 字段标签 |
| `type` | `'text' \| 'select' \| 'date' \| 'number'` | - | **必需** 字段类型 |
| `placeholder` | `string` | - | 占位符文本 |
| `options` | `Array<{label: string, value: any, color?: string}>` | - | 下拉选项 |
| `multiple` | `boolean` | `false` | 是否支持多选 |
| `span` | `number` | `6` | 字段宽度（栅格） |
| `visible` | `boolean` | `true` | 是否显示 |

### TableColumn 类型

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `key` | `string` | - | **必需** 列键名 |
| `title` | `string` | - | **必需** 列标题 |
| `dataIndex` | `string` | - | 数据字段名 |
| `width` | `number \| string` | - | 列宽度 |
| `fixed` | `'left' \| 'right'` | - | 是否固定 |
| `sorter` | `boolean \| function` | - | 是否可排序 |
| `render` | `function` | - | 渲染函数 |
| `visible` | `boolean` | `true` | 是否显示 |

## 使用示例

### 1. 基础搜索表格
```tsx
const data = [
  { id: 1, name: '张三', age: 25, department: '技术部', status: 'active' },
  { id: 2, name: '李四', age: 30, department: '产品部', status: 'inactive' },
  { id: 3, name: '王五', age: 28, department: '技术部', status: 'active' }
]

const columns = [
  { key: 'name', title: '姓名', dataIndex: 'name' },
  { key: 'age', title: '年龄', dataIndex: 'age', sorter: true },
  { key: 'department', title: '部门', dataIndex: 'department' },
  { 
    key: 'status', 
    title: '状态', 
    dataIndex: 'status',
    render: (value: string) => (
      <Tag color={value === 'active' ? 'green' : 'red'}>
        {value === 'active' ? '活跃' : '非活跃'}
      </Tag>
    )
  }
]

const searchFields = [
  { key: 'name', label: '姓名', type: 'text', placeholder: '请输入姓名' },
  { key: 'department', label: '部门', type: 'select', options: [
    { label: '技术部', value: '技术部' },
    { label: '产品部', value: '产品部' }
  ]},
  { key: 'status', label: '状态', type: 'select', options: [
    { label: '活跃', value: 'active', color: 'green' },
    { label: '非活跃', value: 'inactive', color: 'red' }
  ]}
]

<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  title="员工列表"
/>
```

### 2. 多选下拉搜索
```tsx
const searchFields = [
  { 
    key: 'status', 
    label: '状态', 
    type: 'select', 
    multiple: true,
    options: [
      { label: '活跃', value: 'active', color: 'green' },
      { label: '非活跃', value: 'inactive', color: 'red' },
      { label: '待审核', value: 'pending', color: 'orange' }
    ]
  }
]
```

### 3. 日期和数字搜索
```tsx
const searchFields = [
  { key: 'createTime', label: '创建时间', type: 'date' },
  { key: 'age', label: '年龄', type: 'number', placeholder: '请输入年龄' }
]
```

### 4. 自定义列渲染
```tsx
const columns = [
  { key: 'name', title: '姓名', dataIndex: 'name' },
  { 
    key: 'avatar', 
    title: '头像', 
    dataIndex: 'avatar',
    render: (value: string, record: any) => (
      <Avatar src={value} size="small">
        {record.name?.charAt(0)}
      </Avatar>
    )
  },
  { 
    key: 'actions', 
    title: '操作', 
    width: 120,
    render: (value: any, record: any) => (
      <Space>
        <Button type="link" size="small">编辑</Button>
        <Button type="link" size="small" danger>删除</Button>
      </Space>
    )
  }
]
```

### 5. 带行选择的表格
```tsx
const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

const rowSelection = {
  selectedRowKeys,
  onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  selections: [
    Table.SELECTION_ALL,
    Table.SELECTION_INVERT,
    Table.SELECTION_NONE
  ]
}

<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  rowSelection={rowSelection}
/>
```

### 6. 固定列和滚动
```tsx
<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  scroll={{ x: 1000, y: 400 }}
/>
```

### 7. 自定义搜索回调
```tsx
const handleSearch = (values: SearchFormValues) => {
  console.log('搜索条件:', values)
  // 可以在这里调用API进行服务端搜索
}

const handleRefresh = () => {
  console.log('刷新数据')
  // 重新获取数据
}

<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  onSearch={handleSearch}
  onRefresh={handleRefresh}
/>
```

### 8. 隐藏搜索区域
```tsx
<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  showSearch={false}
  title="只读数据表格"
/>
```

### 9. 自定义分页
```tsx
<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  pageSize={20}
  showPagination={true}
/>
```

### 10. 加载状态
```tsx
const [loading, setLoading] = useState(false)

<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  loading={loading}
/>
```

## 高级用法

### 1. 服务端搜索
```tsx
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)

const handleSearch = async (values: SearchFormValues) => {
  setLoading(true)
  try {
    const result = await api.searchUsers(values)
    setData(result.data)
  } finally {
    setLoading(false)
  }
}

<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  loading={loading}
  onSearch={handleSearch}
  showPagination={false} // 服务端分页时隐藏客户端分页
/>
```

### 2. 动态列显示
```tsx
const [visibleColumns, setVisibleColumns] = useState(['name', 'age', 'status'])

const columns = [
  { key: 'name', title: '姓名', dataIndex: 'name', visible: visibleColumns.includes('name') },
  { key: 'age', title: '年龄', dataIndex: 'age', visible: visibleColumns.includes('age') },
  { key: 'status', title: '状态', dataIndex: 'status', visible: visibleColumns.includes('status') }
]
```

### 3. 自定义搜索组件
```tsx
const searchFields = [
  { 
    key: 'custom', 
    label: '自定义搜索', 
    type: 'text',
    render: (field: SearchField) => (
      <CustomSearchComponent 
        value={searchForm[field.key]}
        onChange={(value) => setSearchForm({...searchForm, [field.key]: value})}
      />
    )
  }
]
```

## 样式定制

### 1. 自定义类名
```tsx
<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  className="my-custom-table"
/>
```

### 2. 自定义搜索区域样式
```tsx
// 在CSS中
.my-custom-table .ant-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## 性能优化

### 1. 大数据量处理
```tsx
// 使用虚拟滚动
<SearchTable
  dataSource={data}
  columns={columns}
  searchFields={searchFields}
  scroll={{ y: 400 }}
  pagination={{ pageSize: 50 }}
/>
```

### 2. 防抖搜索
```tsx
const [searchForm, setSearchForm] = useState({})

const debouncedSearch = useMemo(
  () => debounce((values) => {
    // 执行搜索逻辑
  }, 300),
  []
)
```

## 注意事项

1. **数据格式**：确保 `dataSource` 中的每项数据都有唯一的 `id` 或 `key`
2. **搜索性能**：对于大数据量，建议使用服务端搜索
3. **列配置**：`columns` 和 `searchFields` 的 `key` 应该对应数据字段名
4. **类型安全**：建议为数据定义 TypeScript 接口
5. **响应式**：搜索字段的 `span` 属性控制栅格布局

## 最佳实践

1. **合理使用搜索字段**：不要添加过多搜索字段，影响用户体验
2. **优化列渲染**：对于复杂渲染，使用 `useMemo` 优化性能
3. **服务端搜索**：大数据量时使用服务端搜索和分页
4. **错误处理**：添加适当的错误处理和加载状态
5. **可访问性**：确保搜索字段有合适的标签和占位符

## 扩展建议

1. **添加更多搜索类型**：如时间范围、多选文本等
2. **支持导出功能**：添加数据导出功能
3. **支持列拖拽**：允许用户自定义列顺序
4. **支持主题定制**：添加暗色模式等主题支持
5. **添加搜索历史**：保存用户的搜索历史
