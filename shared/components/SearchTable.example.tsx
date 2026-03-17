import React, { useState } from 'react'
import { Tag, Avatar, Button, Space, message } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import SearchTable, { SearchField, TableColumn } from './SearchTable'

// 示例数据类型
interface User {
  id: number
  name: string
  email: string
  age: number
  department: string
  status: 'active' | 'inactive' | 'pending'
  role: 'admin' | 'user' | 'guest'
  createTime: string
  lastLogin: string
}

// 示例数据
const mockData: User[] = [
  {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    age: 25,
    department: '技术部',
    status: 'active',
    role: 'admin',
    createTime: '2024-01-15',
    lastLogin: '2024-01-20'
  },
  {
    id: 2,
    name: '李四',
    email: 'lisi@example.com',
    age: 30,
    department: '产品部',
    status: 'inactive',
    role: 'user',
    createTime: '2024-01-10',
    lastLogin: '2024-01-18'
  },
  {
    id: 3,
    name: '王五',
    email: 'wangwu@example.com',
    age: 28,
    department: '技术部',
    status: 'pending',
    role: 'user',
    createTime: '2024-01-12',
    lastLogin: '2024-01-19'
  },
  {
    id: 4,
    name: '赵六',
    email: 'zhaoliu@example.com',
    age: 35,
    department: '运营部',
    status: 'active',
    role: 'guest',
    createTime: '2024-01-08',
    lastLogin: '2024-01-21'
  },
  {
    id: 5,
    name: '钱七',
    email: 'qianqi@example.com',
    age: 22,
    department: '设计部',
    status: 'active',
    role: 'user',
    createTime: '2024-01-14',
    lastLogin: '2024-01-20'
  }
]

/**
 * SearchTable 使用示例组件
 */
const SearchTableExample: React.FC = () => {
  const [data, setData] = useState<User[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 表格列配置
  const columns: TableColumn[] = [
    {
      key: 'name',
      title: '姓名',
      dataIndex: 'name',
      width: 120,
      render: (value: string, record: User) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            {value.charAt(0)}
          </Avatar>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'email',
      title: '邮箱',
      dataIndex: 'email',
      width: 200
    },
    {
      key: 'age',
      title: '年龄',
      dataIndex: 'age',
      width: 80,
      sorter: true
    },
    {
      key: 'department',
      title: '部门',
      dataIndex: 'department',
      width: 100
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: string) => {
        const statusConfig = {
          active: { color: 'green', text: '活跃' },
          inactive: { color: 'red', text: '非活跃' },
          pending: { color: 'orange', text: '待审核' }
        }
        const config = statusConfig[value as keyof typeof statusConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      key: 'role',
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (value: string) => {
        const roleConfig = {
          admin: { color: 'purple', text: '管理员' },
          user: { color: 'blue', text: '用户' },
          guest: { color: 'default', text: '访客' }
        }
        const config = roleConfig[value as keyof typeof roleConfig]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      key: 'createTime',
      title: '创建时间',
      dataIndex: 'createTime',
      width: 120
    },
    {
      key: 'lastLogin',
      title: '最后登录',
      dataIndex: 'lastLogin',
      width: 120
    },
    {
      key: 'actions',
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (value: any, record: User) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 搜索字段配置
  const searchFields: SearchField[] = [
    {
      key: 'name',
      label: '姓名',
      type: 'text',
      placeholder: '请输入姓名',
      span: 6
    },
    {
      key: 'email',
      label: '邮箱',
      type: 'text',
      placeholder: '请输入邮箱',
      span: 6
    },
    {
      key: 'department',
      label: '部门',
      type: 'select',
      span: 4,
      options: [
        { label: '技术部', value: '技术部' },
        { label: '产品部', value: '产品部' },
        { label: '运营部', value: '运营部' },
        { label: '设计部', value: '设计部' }
      ]
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      span: 4,
      options: [
        { label: '活跃', value: 'active', color: 'green' },
        { label: '非活跃', value: 'inactive', color: 'red' },
        { label: '待审核', value: 'pending', color: 'orange' }
      ]
    },
    {
      key: 'role',
      label: '角色',
      type: 'select',
      span: 4,
      multiple: true,
      options: [
        { label: '管理员', value: 'admin', color: 'purple' },
        { label: '用户', value: 'user', color: 'blue' },
        { label: '访客', value: 'guest', color: 'default' }
      ]
    }
  ]

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    selections: [
      {
        key: 'all',
        text: '全选',
        onSelect: () => setSelectedRowKeys(data.map(item => item.id))
      },
      {
        key: 'active',
        text: '选择活跃用户',
        onSelect: () => setSelectedRowKeys(
          data.filter(item => item.status === 'active').map(item => item.id)
        )
      }
    ]
  }

  // 事件处理函数
  const handleView = (record: User) => {
    message.info(`查看用户: ${record.name}`)
  }

  const handleEdit = (record: User) => {
    message.info(`编辑用户: ${record.name}`)
  }

  const handleDelete = (record: User) => {
    message.warning(`删除用户: ${record.name}`)
    setData(prev => prev.filter(item => item.id !== record.id))
  }

  const handleSearch = (values: any) => {
    console.log('搜索条件:', values)
    message.success('搜索完成')
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success('数据已刷新')
    }, 1000)
  }

  const handleReset = () => {
    message.info('搜索条件已重置')
  }

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    console.log('表格变化:', { pagination, filters, sorter })
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">SearchTable 使用示例</h2>
      
      <SearchTable
        dataSource={data}
        columns={columns}
        searchFields={searchFields}
        title="用户管理"
        loading={loading}
        rowSelection={rowSelection}
        scroll={{ x: 1200 }}
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        onReset={handleReset}
        onTableChange={handleTableChange}
        className="mb-6"
      />

      {/* 选中行信息 */}
      {selectedRowKeys.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-600">
            已选择 {selectedRowKeys.length} 个用户
          </p>
          <p className="text-sm text-gray-600 mt-1">
            选中ID: {selectedRowKeys.join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

export default SearchTableExample
