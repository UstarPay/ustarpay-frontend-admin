import React, { useState } from 'react'
import { Button, Space, Tag, Input, Table } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardTransaction } from '@shared/types'
import { PageHeaderCard } from '@shared/components'

const typeMap: Record<string, string> = {
  AUTHORIZATION: '交易授权',
  SETTLEMENT: '资金结算',
  SYNC: '交易同步',
  TOPUP: '充值'
}

const statusMap: Record<string, { color: string }> = {
  PENDING: { color: 'processing' },
  APPROVED: { color: 'success' },
  REJECTED: { color: 'error' },
  SETTLED: { color: 'default' },
  FAILED: { color: 'error' }
}

const CardTransactionListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    pageSize: 20,
    search: ''
  })

  const { data: txData, isLoading, refetch } = useQuery({
    queryKey: ['card-transactions', searchParams],
    queryFn: () => cardService.getCardTransactions(searchParams)
  })

  const transactions = (txData as any)?.data?.items || []
  const total = (txData as any)?.data?.total ?? 0

  const columns = [
    {
      title: '外部交易ID',
      dataIndex: 'external_transaction_id',
      key: 'external_transaction_id',
      width: 160,
      ellipsis: true,
      render: (v: string) => v || '-'
    },
    {
      title: '外部卡ID',
      dataIndex: 'external_card_id',
      key: 'external_card_id',
      width: 120,
      ellipsis: true
    },
    {
      title: '参考号',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 120,
      ellipsis: true,
      render: (v: string) => v || '-'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string) => typeMap[v] || v
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      render: (v: string, r: CardTransaction) => `${r.currency || 'USD'} ${v || '0.00'}`
    },
    {
      title: '商户名称',
      dataIndex: 'merchant_name',
      key: 'merchant_name',
      width: 140,
      ellipsis: true,
      render: (v: string) => v || '-'
    },
    {
      title: '卡商名称',
      dataIndex: 'merchant_name_from_card',
      key: 'merchant_name_from_card',
      width: 120,
      ellipsis: true,
      render: (v: string) => v || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => (
        <Tag color={statusMap[v]?.color || 'default'}>{v || '-'}</Tag>
      )
    },
    {
      title: '授权码',
      dataIndex: 'authorization_code',
      key: 'authorization_code',
      width: 100,
      render: (v: string) => v || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => (v ? new Date(v).toLocaleString('zh-CN') : '-')
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeaderCard
        title="卡交易记录"
        logoText="📋"
        gradientColors={['#52c41a', '#73d13d', '#95de64', '#b7eb8f']}
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
            刷新
          </Button>
        }
      />

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">交易列表</h3>
          <Space>
            <Input.Search
              placeholder="搜索交易ID、卡ID或商户名称"
              allowClear
              onSearch={(val) => setSearchParams((p) => ({ ...p, page: 1, search: val || '' }))}
              style={{ width: 280 }}
            />
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) =>
              setSearchParams((p) => ({ ...p, page, pageSize: pageSize || 20 }))
          }}
        />
      </div>
    </div>
  )
}

export default CardTransactionListPage
