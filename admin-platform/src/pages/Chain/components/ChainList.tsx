import React from 'react'
import { Table, Tag, Space, Button, Tooltip, Popconfirm, Badge } from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SyncOutlined,
} from '@ant-design/icons'
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
  onPaginationChange,
}) => {
  const { hasPermission } = useAuthStore()

  const getNetworkTypeClass = (networkType?: string): string => {
    switch ((networkType || '').toLowerCase()) {
      case 'bitcoin':
        return 'chain-network-bitcoin'
      case 'tron':
        return 'chain-network-tron'
      case 'evm':
        return 'chain-network-evm'
      default:
        return 'chain-network-default'
    }
  }

  const columns: ColumnsType<Chain> = [
    {
      title: '链信息',
      dataIndex: 'chainName',
      key: 'chainName',
      render: (_, record: Chain) => (
        <div className="chain-table-title-block">
          <div className="chain-table-title">{record.chainName}</div>
          <div className="chain-table-subtitle">{record.chainCode}</div>
        </div>
      ),
    },
    {
      title: '网络信息',
      key: 'networkInfo',
      render: (_, record: Chain) => (
        <Space size={[4, 4]} wrap>
          <Tag
            className={`chain-network-tag ${getNetworkTypeClass(record.chainNetwork)}`}
          >
            {record.chainNetwork || '未设置'}
          </Tag>
          <Tag className="chain-chip-tag">{`Chain ID ${record.chainId}`}</Tag>
        </Space>
      ),
    },
    {
      title: '原生币',
      dataIndex: 'nativeSymbol',
      key: 'nativeSymbol',
      render: (_, record: Chain) => (
        <span className="chain-native-symbol">{record.nativeSymbol}</span>
      ),
    },
    {
      title: '扫描配置',
      key: 'scanConfig',
      render: (_, record: Chain) => (
        <div className="chain-scan-config">
          <div className="chain-table-title">{`高度 ${Number(record.scanHeight || 0).toLocaleString()}`}</div>
          <div className="chain-table-subtitle">
            {`间隔 ${record.scanInterval || 0}s / 确认 ${record.confirmationBlocks || 0} 块`}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (_, record: Chain) => (
        <Badge
          status={record.status === 1 ? 'success' : 'default'}
          text={record.status === 1 ? '启用' : '禁用'}
        />
      ),
    },
    {
      title: '最新扫描高度',
      dataIndex: 'lastScanHeight',
      key: 'lastScanHeight',
      render: (value: number) => (
        <span>{Number(value || 0).toLocaleString()}</span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: string) => (
        <span>{value ? new Date(value).toLocaleString() : '-'}</span>
      ),
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
              className="chain-action-btn"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>

          {hasPermission('chain:update') && (
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                className="chain-action-btn"
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
                className="chain-action-btn"
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
                  className="chain-action-btn chain-action-btn-danger"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Table
      className="chain-table"
      columns={columns}
      dataSource={Array.isArray(data) ? data : []}
      loading={loading}
      rowKey="id"
      size="middle"
      pagination={{
        ...pagination,
        onChange: onPaginationChange,
        onShowSizeChange: onPaginationChange,
      }}
      rowClassName={() => 'chain-table-row'}
      scroll={{ x: 1200 }}
    />
  )
}

export default ChainList
