import React from 'react'
import { Table, Tag, Space, Button, Tooltip, Popconfirm, Switch } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined, SyncOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import type { Chain } from '@shared/types/chain'
import type { ColumnsType } from 'antd/es/table'

interface ChainListProps {
  data?: Chain[]
  loading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
    showSizeChanger: boolean
    showQuickJumper: boolean
    showTotal: (total: number, range: [number, number]) => string
  }
  onEdit: (chain: Chain) => void
  onView: (chain: Chain) => void
  onDelete: (id: number) => void
  onUpdateScanHeight: (chain: Chain) => void
  onPaginationChange: (page: number, pageSize?: number) => void
}

const ChainList: React.FC<ChainListProps> = ({
  data,
  loading,
  pagination,
  onEdit,
  onView,
  onDelete,
  onUpdateScanHeight,
  onPaginationChange
}) => {
  const { hasPermission } = useAuthStore()

  // 获取网络类型标签颜色
  const getNetworkTypeColor = (): string => {
    return 'blue'
  }

  const columns: ColumnsType<Chain> = [
    {
      title: '链信息',
      dataIndex: 'chainName',
      key: 'chainName',
      render: (_, record: Chain) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '14px' }}>
            {record.chainName}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {record.chainCode}
          </div>
        </div>
      )
    },
    {
      title: '网络类型',
      dataIndex: 'networkType',
      key: 'networkType',
      render: () => (
        <Tag color={getNetworkTypeColor()}>
          EVM
        </Tag>
      )
    },
    {
      title: '原生币',
      dataIndex: 'nativeSymbol',
      key: 'nativeSymbol',
      render: (_, record: Chain) => (
        <span>{record.nativeSymbol}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (_, record: Chain) => (
        <Switch
          checked={record.status === 1}
          onChange={() => {}}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Chain) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          
          {hasPermission('chain:update') && (
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          
          {hasPermission('chain:update') && (
            <Tooltip title="更新扫描高度">
              <Button
                type="text"
                size="small"
                icon={<SyncOutlined />}
                onClick={() => onUpdateScanHeight(record)}
              />
            </Tooltip>
          )}
          
          {hasPermission('chain:delete') && (
            <Popconfirm
              title="确认删除"
              description="确定要删除这个区块链网络吗？此操作不可恢复。"
              onConfirm={() => onDelete(record.id)}
              okText="确定"
              cancelText="取消"
              okType="danger"
            >
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <Table
      columns={columns}
              dataSource={Array.isArray(data) ? data : []}
      loading={loading}
      rowKey="id"
      pagination={{
        ...pagination,
        onChange: onPaginationChange,
        onShowSizeChange: onPaginationChange
      }}
      scroll={{ x: 800 }}
    />
  )
}

export default ChainList
