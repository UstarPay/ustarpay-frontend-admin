import React from 'react'
import { Button, Card, Table, Tag, Typography } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
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
  const completedCount = recentTransactions.filter(item => item.status === 'completed').length
  const pendingCount = recentTransactions.filter(item => item.status === 'pending').length

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'green'
      case 'withdrawal':
      case 'withdraw':
        return 'red'
      case 'transfer':
        return 'blue'
      case 'collection':
      case 'collect':
        return 'orange'
      case 'internal':
        return 'purple'
      default:
        return 'default'
    }
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'deposit':
        return '充值'
      case 'withdrawal':
      case 'withdraw':
        return '提现'
      case 'transfer':
        return '转账'
      case 'collection':
      case 'collect':
        return '归集'
      case 'internal':
        return '内部转账'
      default:
        return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'pending':
        return 'processing'
      case 'failed':
        return 'error'
      case 'cancelled':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'pending':
        return '处理中'
      case 'failed':
        return '失败'
      case 'cancelled':
        return '已取消'
      default:
        return status
    }
  }

  const transactionColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color={getTransactionTypeColor(type)}>{getTransactionTypeText(type)}</Tag>
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string, record: RecentTransaction) => {
        const numAmount = parseFloat(amount || '0')
        const formattedAmount = isNaN(numAmount) ? '0.00000000' : numAmount.toFixed(8)
        return <Text strong>{formattedAmount} {(record.currency || '').toUpperCase()}</Text>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
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
      bordered={false}
      className="rounded-[28px] border border-[#d9e6f3] bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
      bodyStyle={{ padding: 24 }}
      title={
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Flow Monitor</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">最近交易</div>
        </div>
      }
      extra={
        <Button
          type="default"
          icon={<ArrowRightOutlined />}
          onClick={() => onNavigate('/transactions/list')}
          className="rounded-full"
        >
          查看全部
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="rounded-[18px] bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_100%)] px-4 py-3 text-sm text-slate-600">
          实时观察最近链上与内部资金流转，异常状态会优先暴露在这里。
        </div>
        <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          已完成 {completedCount}
        </div>
        <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          处理中 {pendingCount}
        </div>
      </div>

      <Table
        columns={transactionColumns}
        dataSource={recentTransactions}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        locale={{
          emptyText: (
            <div className="py-10 text-center">
              <div className="text-base font-medium text-slate-700">最近交易为空</div>
              <div className="mt-2 text-sm text-slate-500">当前没有可展示的最近交易记录，刷新后会自动更新。</div>
            </div>
          )
        }}
      />
    </Card>
  )
}

export default RecentTransactionsCard
