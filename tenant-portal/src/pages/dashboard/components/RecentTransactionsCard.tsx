import React from 'react'
import { Card, Table, Button, Tag, Typography } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

interface RecentTransaction {
  id: string
  type: string
  amount: string
  currency: string
  status: string
  createdAt: string
  user?: string
  address?: string
}

interface RecentTransactionsCardProps {
  recentTransactions: RecentTransaction[]
  loading: boolean
  onNavigate: (url: string) => void
}

const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({ 
  recentTransactions, 
  loading, 
  onNavigate 
}) => {
  // 与 /transactions/list 保持一致
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'green'
      case 'withdrawal':
      case 'withdraw': return 'red'
      case 'transfer': return 'blue'
      case 'collection':
      case 'collect': return 'orange'
      case 'internal': return 'purple'
      default: return 'default'
    }
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'deposit': return '充值'
      case 'withdrawal':
      case 'withdraw': return '提现'
      case 'transfer': return '转账'
      case 'collection':
      case 'collect': return '归集'
      case 'internal': return '内部转账'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'processing'
      case 'failed': return 'error'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'pending': return '处理中'
      case 'failed': return '失败'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const transactionColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTransactionTypeColor(type)}>
          {getTransactionTypeText(type)}
        </Tag>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string, record: RecentTransaction) => {
        const numAmount = parseFloat(amount || '0')
        const formattedAmount = isNaN(numAmount) ? '0.00000000' : numAmount.toFixed(8)
        return (
          <Text strong>
            {formattedAmount} {(record.currency || '').toUpperCase()}
          </Text>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    }
  ]

  return (
    <Card
      title="最近交易"
      extra={
        <Button type="primary" onClick={() => onNavigate('/transactions/list')}>
          查看全部
        </Button>
      }
    >
      <Table
        columns={transactionColumns}
        dataSource={recentTransactions}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        locale={{
          emptyText: '暂无交易数据'
        }}
      />
    </Card>
  )
}

export default RecentTransactionsCard 