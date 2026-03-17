import React, { useMemo, useState } from 'react'
import { Button, Card, Input, Table, Tag } from 'antd'
import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  ShopOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardTransaction } from '@shared/types'

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

  const transactions: CardTransaction[] = (txData as any)?.data?.items || []
  const total = (txData as any)?.data?.total ?? 0
  const approvedCount = useMemo(
    () => transactions.filter((item: CardTransaction) => item.status === 'APPROVED' || item.status === 'SETTLED').length,
    [transactions]
  )
  const pendingCount = useMemo(
    () => transactions.filter((item: CardTransaction) => item.status === 'PENDING').length,
    [transactions]
  )
  const settledAmount = useMemo(
    () => transactions
      .filter((item: CardTransaction) => item.status === 'SETTLED')
      .reduce((sum: number, item: CardTransaction) => sum + Number(item.amount || 0), 0),
    [transactions]
  )
  const topMerchant = useMemo(() => {
    const merchantMap = transactions.reduce<Record<string, number>>((acc, item: CardTransaction) => {
      const key = item.merchant_name || '未识别商户'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return Object.entries(merchantMap).sort((a, b) => b[1] - a[1])[0]
  }, [transactions])

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
      <Card
        bordered={false}
        className="overflow-hidden rounded-[32px] border-0 bg-[linear-gradient(135deg,#1f2937_0%,#0f172a_58%,#111827_100%)] text-white shadow-[0_28px_64px_rgba(15,23,42,0.28)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.15),transparent_30%)]" />
          <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.32em] text-sky-200/70">Card Transaction Ledger</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-white">卡交易记录</div>
              <div className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                这页偏审计视角，核心是盯住状态、批次量级和高频商户，而不是资产余额。
              </div>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">批次观察</div>
                  <div className="mt-2 flex items-end gap-3">
                    <div className="text-4xl font-semibold text-white">{transactions.length}</div>
                    <div className="pb-1 text-sm text-slate-400">当前批次流水</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading} className="h-10 rounded-full border-white/15 bg-white/10 px-5 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white">
                    刷新流水
                  </Button>
                  <div className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-medium text-sky-100">
                    适合排查授权、结算与同步异常
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: '已通过/已结算',
                  value: approvedCount,
                  helper: '当前页成功流水',
                  icon: <CheckCircleOutlined className="text-emerald-600" />,
                  tone: 'bg-emerald-50'
                },
                {
                  label: '待处理',
                  value: pendingCount,
                  helper: '仍在处理中',
                  icon: <ClockCircleOutlined className="text-amber-500" />,
                  tone: 'bg-amber-50'
                },
                {
                  label: '已结算金额',
                  value: settledAmount.toLocaleString('zh-CN', { maximumFractionDigits: 2 }),
                  helper: '仅统计 SETTLED',
                  icon: <AuditOutlined className="text-sky-600" />,
                  tone: 'bg-sky-50'
                },
                {
                  label: '高频商户',
                  value: topMerchant ? `${topMerchant[0]}` : '暂无',
                  helper: topMerchant ? `${topMerchant[1]} 笔交易` : '无分布数据',
                  icon: <ShopOutlined className="text-violet-600" />,
                  tone: 'bg-violet-50'
                }
              ].map(item => (
                <div key={item.label} className={`rounded-[22px] border border-white/10 ${item.tone} px-4 py-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-sm">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-3 break-all text-xl font-semibold text-slate-900">{item.value}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.helper}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card
        bordered={false}
        className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">审计检索</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">按交易、卡片或商户快速定位流水</div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input.Search
              placeholder="搜索交易ID、卡ID或商户名称"
              allowClear
              onSearch={(val) => setSearchParams((p) => ({ ...p, page: 1, search: val || '' }))}
              className="w-full sm:w-[320px]"
            />
            <div className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100">
              <SyncOutlined className="mr-1" />
              流水状态实时读取
            </div>
          </div>
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
      </Card>
    </div>
  )
}

export default CardTransactionListPage
