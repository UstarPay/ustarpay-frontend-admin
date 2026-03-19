import React, { useMemo, useState } from 'react'
import { Card, Input, Select, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardTransaction } from '@shared/types'

const typeMap: Record<string, string> = {
  AUTHORIZATION: '交易授权',
  SETTLEMENT: '资金结算',
  SYNC: '交易同步',
  CARD_TRANSACTION: '交易通知',
}

const statusColorMap: Record<string, string> = {
  AUTH_APPROVED: 'success',
  AUTH_REJECTED: 'error',
  SETTLEMENT_PENDING: 'processing',
  SETTLED: 'default',
  EXCEPTION: 'volcano',
  PENDING: 'processing',
  APPROVED: 'success',
}

const reconcileColorMap: Record<string, string> = {
  MATCHED: 'success',
  AMOUNT_MISMATCH: 'gold',
  AUTH_MISSING: 'volcano',
  PENDING: 'processing',
}

const CardTransactionListPage: React.FC = () => {
  const [params, setParams] = useState({
    page: 1,
    pageSize: 20,
    search: '',
    status: '',
    type: '',
    reconcileStatus: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['card-transactions', params],
    queryFn: () => cardService.getCardTransactions(params),
  })

  const items: CardTransaction[] = (data as any)?.data?.items || []
  const total = (data as any)?.data?.total || 0

  const summary = useMemo(() => {
    const settled = items.filter((item) => item.status === 'SETTLED')
    const exception = items.filter((item) => item.status === 'EXCEPTION').length
    const matched = items.filter((item) => item.reconcile_status === 'MATCHED').length
    const settledAmount = settled.reduce((sum, item) => sum + Number(item.settlement_amount || item.amount || 0), 0)
    return { exception, matched, settledAmount }
  }, [items])

  return (
    <div className="space-y-6">
      <Card bordered={false} className="rounded-[30px] border border-sky-100 bg-[linear-gradient(135deg,#082f49_0%,#0f766e_100%)] text-white shadow-[0_24px_56px_rgba(8,47,73,0.24)]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-sky-100/70">Card Transaction Ledger</div>
            <div className="mt-2 text-3xl font-semibold">卡交易台账</div>
            <div className="mt-2 text-sm text-sky-50/80">统一查看授权、结算、同步以及对账状态。</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="text-xs text-sky-100/70">当前页流水</div>
            <div className="mt-2 text-3xl font-semibold">{items.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="text-xs text-sky-100/70">已结算金额</div>
            <div className="mt-2 text-3xl font-semibold">{summary.settledAmount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="text-xs text-sky-100/70">异常/已匹配</div>
            <div className="mt-2 text-3xl font-semibold">{summary.exception} / {summary.matched}</div>
          </div>
        </div>
      </Card>

      <Card bordered={false} className="rounded-[28px] border border-sky-100 bg-white shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <Input.Search
            allowClear
            placeholder="搜索交易号、卡号或商户"
            className="w-full lg:w-[320px]"
            onSearch={(search) => setParams((prev) => ({ ...prev, page: 1, search }))}
          />
          <Select
            allowClear
            placeholder="交易类型"
            className="w-full lg:w-[180px]"
            options={[
              { value: 'AUTHORIZATION', label: '交易授权' },
              { value: 'SETTLEMENT', label: '资金结算' },
              { value: 'SYNC', label: '交易同步' },
            ]}
            onChange={(type) => setParams((prev) => ({ ...prev, page: 1, type: type || '' }))}
          />
          <Select
            allowClear
            placeholder="交易状态"
            className="w-full lg:w-[180px]"
            options={[
              { value: 'AUTH_APPROVED', label: '授权通过' },
              { value: 'AUTH_REJECTED', label: '授权拒绝' },
              { value: 'SETTLED', label: '已结算' },
              { value: 'EXCEPTION', label: '异常' },
            ]}
            onChange={(status) => setParams((prev) => ({ ...prev, page: 1, status: status || '' }))}
          />
          <Select
            allowClear
            placeholder="对账状态"
            className="w-full lg:w-[180px]"
            options={[
              { value: 'MATCHED', label: '已匹配' },
              { value: 'AMOUNT_MISMATCH', label: '金额不一致' },
              { value: 'AUTH_MISSING', label: '授权缺失' },
              { value: 'PENDING', label: '待核对' },
            ]}
            onChange={(reconcileStatus) => setParams((prev) => ({ ...prev, page: 1, reconcileStatus: reconcileStatus || '' }))}
          />
        </div>

        <Table<CardTransaction>
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          scroll={{ x: 1700 }}
          columns={[
            { title: '外部交易ID', dataIndex: 'external_transaction_id', width: 180, render: (v) => v || '-' },
            { title: '卡ID', dataIndex: 'external_card_id', width: 120 },
            { title: '类型', dataIndex: 'type', width: 110, render: (v) => typeMap[v] || v },
            { title: '授权金额', dataIndex: 'authorization_amount', width: 120, render: (v, row) => `${row.currency || 'USD'} ${v || row.amount || '0.00'}` },
            { title: '结算金额', dataIndex: 'settlement_amount', width: 120, render: (v, row) => `${row.currency || 'USD'} ${v || '0.00'}` },
            { title: '差额', dataIndex: 'diff_amount', width: 100, render: (v) => v || '0.00' },
            { title: '交易状态', dataIndex: 'status', width: 120, render: (v) => <Tag color={statusColorMap[v] || 'default'}>{v || '-'}</Tag> },
            { title: '对账状态', dataIndex: 'reconcile_status', width: 130, render: (v) => <Tag color={reconcileColorMap[v] || 'default'}>{v || '-'}</Tag> },
            { title: '结算批次', dataIndex: 'provider_batch_id', width: 160, render: (v) => v || '-' },
            { title: '商户名称', dataIndex: 'merchant_name', width: 160, render: (v) => v || '-' },
            { title: '卡商名称', dataIndex: 'merchant_name_from_card', width: 140, render: (v) => v || '-' },
            { title: '授权时间', dataIndex: 'authorized_at', width: 180, render: (v) => (v ? new Date(v).toLocaleString('zh-CN') : '-') },
            { title: '结算时间', dataIndex: 'settled_at', width: 180, render: (v) => (v ? new Date(v).toLocaleString('zh-CN') : '-') },
            { title: '创建时间', dataIndex: 'created_at', width: 180, render: (v) => (v ? new Date(v).toLocaleString('zh-CN') : '-') },
          ]}
          pagination={{
            current: params.page,
            pageSize: params.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (page, pageSize) => setParams((prev) => ({ ...prev, page, pageSize: pageSize || 20 })),
          }}
        />
      </Card>
    </div>
  )
}

export default CardTransactionListPage
