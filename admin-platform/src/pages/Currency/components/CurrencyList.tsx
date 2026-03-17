import React from 'react'
import { Table, Space, Button, Tag, Tooltip, Badge, Avatar, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined, StarFilled } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Currency } from '@shared/types/currency'

interface CurrencyListProps {
  currencies: Currency[]
  loading: boolean
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number, size: number) => void
  onEdit: (currency: Currency) => void
  onDelete: (id: number) => void
  onDetail: (currency: Currency) => void
  hasEditPermission: boolean
  hasDeletePermission: boolean
}

const CurrencyList: React.FC<CurrencyListProps> = ({
  currencies,
  loading,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  onDetail,
  hasEditPermission,
  hasDeletePermission
}) => {
  // 获取链信息显示
  const getChainDisplay = (currency: Currency) => {
    if (currency.chain) {
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}> 
          <span>{currency.chain.chainName}</span>
        </div>
      )
    }
    return (
      <Tag color="default">{currency.chainCode}</Tag>
    )
  }

  const columns: ColumnsType<Currency> = [
    {
      title: '代币信息',
      key: 'info',
      render: (_, record: Currency) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {record.iconUrl && (
            <Avatar 
              src={record.iconUrl} 
              size={32} 
              style={{ marginRight: 12 }}
            />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, marginRight: 4 }}>{record.symbol}</span>
              {record.isNative && (
                <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
              )}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.name}</div>
          </div>
        </div>
      )
    },
    {
      title: '所属链',
      key: 'chain',
      render: (_, record: Currency) => getChainDisplay(record)
    },
    {
      title: '类型',
      dataIndex: 'isNative',
      key: 'type',
      render: (isNative: boolean) => (
        <Tag color={isNative ? 'gold' : 'blue'}>
          {isNative ? '原生币' : '合约代币'}
        </Tag>
      )
    },
    {
      title: '精度',
      dataIndex: 'decimals',
      key: 'decimals'
    },
    {
      title: '合约地址',
      dataIndex: 'contractAddress',
      key: 'contractAddress',
      render: (address: string) => (
        address ? (
          <Tooltip title={address}>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </Tooltip>
        ) : '-'
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Badge
          status={status === 1 ? 'success' : 'error'}
          text={status === 1 ? '启用' : '禁用'}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Currency) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onDetail(record)}
          >
            详情
          </Button>
          {hasEditPermission && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              编辑
            </Button>
          )}
          {hasDeletePermission && (
            <Popconfirm
              title="确认删除"
              description="确定要删除这个代币吗？"
              onConfirm={() => onDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <Table
      columns={columns}
              dataSource={Array.isArray(currencies) ? currencies : []}
      loading={loading}
      rowKey="id"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        onChange: onPageChange,
        onShowSizeChange: onPageChange
      }}
    />
  )
}

export default CurrencyList
