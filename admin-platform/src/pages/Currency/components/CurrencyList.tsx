import React from 'react'
import {
  Table,
  Space,
  Button,
  Tag,
  Tooltip,
  Badge,
  Avatar,
  Popconfirm,
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarFilled,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Currency } from '@shared/types/currency'

interface CurrencyListProps {
  currencies: Currency[]
  loading: boolean
  coinGeckoPriceMap: Record<string, { usd?: number }>
  coinGeckoPricesLoading: boolean
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
  coinGeckoPriceMap,
  coinGeckoPricesLoading,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  onDetail,
  hasEditPermission,
  hasDeletePermission,
}) => {
  const formatCoinGeckoPrice = (currency: Currency) => {
    const coinGeckoId = currency.coingeckoId?.trim()
    if (!coinGeckoId) {
      return '-'
    }

    if (coinGeckoPricesLoading && !coinGeckoPriceMap[coinGeckoId]) {
      return '加载中'
    }

    const usd = coinGeckoPriceMap[coinGeckoId]?.usd
    if (typeof usd !== 'number') {
      return '-'
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: usd >= 1 ? 2 : 4,
      maximumFractionDigits: usd >= 1 ? 2 : 6,
    }).format(usd)
  }

  // 获取链信息显示
  const getChainDisplay = (currency: Currency) => {
    if (currency.chain) {
      return (
        <div className="currency-chain-chip">
          <span>{currency.chain.chainName}</span>
        </div>
      )
    }
    return <Tag className="currency-code-tag">{currency.chainCode}</Tag>
  }

  const columns: ColumnsType<Currency> = [
    {
      title: '代币信息',
      key: 'info',
      render: (_, record: Currency) => (
        <div className="currency-table-title-block">
          <Avatar className="currency-avatar" src={record.iconUrl} size={36}>
            {record.symbol?.slice(0, 1)}
          </Avatar>
          <div>
            <div className="currency-table-title">
              <span>{record.symbol}</span>
              {record.isNative && (
                <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
              )}
            </div>
            <div className="currency-table-subtitle">{record.name}</div>
          </div>
        </div>
      ),
    },
    {
      title: '所属链',
      key: 'chain',
      render: (_, record: Currency) => getChainDisplay(record),
    },
    {
      title: '类型',
      dataIndex: 'isNative',
      key: 'type',
      render: (isNative: boolean) => (
        <Tag
          className={`currency-type-tag ${isNative ? 'currency-type-native' : 'currency-type-token'}`}
        >
          {isNative ? '原生币' : '合约代币'}
        </Tag>
      ),
    },
    {
      title: '网络类型',
      dataIndex: 'chainNetwork',
      key: 'chainNetwork',
      width: 120,
      render: (value?: string) =>
        value ? <Tag className="currency-code-tag">{value}</Tag> : '-',
    },
    {
      title: '精度',
      dataIndex: 'decimals',
      key: 'decimals',
      width: 88,
    },
    {
      title: '合约地址',
      dataIndex: 'contractAddress',
      key: 'contractAddress',
      width: 140,
      render: (address: string) =>
        address ? (
          <Tooltip title={address}>
            <span className="currency-address-chip">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: 'CoinGecko ID',
      dataIndex: 'coingeckoId',
      key: 'coingeckoId',
      width: 160,
      render: (value?: string) =>
        value ? <span className="currency-address-chip">{value}</span> : '-',
    },
    {
      title: 'coingecko',
      key: 'coingecko',
      width: 120,
      render: (_, record: Currency) => formatCoinGeckoPrice(record),
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
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Currency) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            className="currency-action-btn"
            icon={<EyeOutlined />}
            onClick={() => onDetail(record)}
          >
            详情
          </Button>
          {hasEditPermission && (
            <Button
              type="text"
              size="small"
              className="currency-action-btn"
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
                className="currency-action-btn currency-action-btn-danger"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Table
      className="currency-table"
      columns={columns}
      dataSource={Array.isArray(currencies) ? currencies : []}
      loading={loading}
      rowKey="id"
      size="middle"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        onChange: onPageChange,
        onShowSizeChange: onPageChange,
      }}
      scroll={{ x: 1440 }}
    />
  )
}

export default CurrencyList
