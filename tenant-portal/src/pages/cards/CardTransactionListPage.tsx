import React, { useMemo, useState } from 'react'
import { Button, Card, Input, Select, Table, Tag, Typography } from 'antd'
import {
  CheckCircleOutlined,
  ExceptionOutlined,
  ReloadOutlined,
  SyncOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardTransaction } from '@shared/types'
import {
  getProviderEventMeta,
  getProviderTransactionStateMeta,
  getProviderTransactionTypeMeta,
  getReconcileStatusMeta,
  getTransactionStatusMeta,
  getTransactionTypeMeta,
  renderMappedTag,
} from './cardDisplay'

type QueryParams = {
  page: number
  pageSize: number
  search: string
  status: string
  type: string
  reconcileStatus: string
}

type RawCardTransaction = CardTransaction & Record<string, unknown>

const defaultParams: QueryParams = {
  page: 1,
  pageSize: 20,
  search: '',
  status: '',
  type: '',
  reconcileStatus: '',
}

const typeOptions = [
  { value: 'AUTHORIZATION', label: '交易授权' },
  { value: 'SETTLEMENT', label: '资金结算' },
  { value: 'SYNC', label: '交易同步' },
]

const statusOptions = [
  { value: 'AUTH_APPROVED', label: '授权通过' },
  { value: 'AUTH_REJECTED', label: '授权拒绝' },
  { value: 'SETTLED', label: '已结算' },
  { value: 'EXCEPTION', label: '异常' },
]

const reconcileOptions = [
  { value: 'MATCHED', label: '已匹配' },
  { value: 'AMOUNT_MISMATCH', label: '金额不一致' },
  { value: 'AUTH_MISSING', label: '授权缺失' },
  { value: 'PENDING', label: '待核对' },
]

const settlementSummaryTypes = new Set([
  'CAPTURE',
  'REFUND',
  'DEPOSIT',
  'REVERSAL_TO_ACCOUNT',
])

const formatAmount = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-')

const firstNonEmpty = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

const normalizeCardTransaction = (raw: RawCardTransaction): CardTransaction => ({
  ...raw,
  external_transaction_id: firstNonEmpty(raw.external_transaction_id, raw.externalTransactionId),
  reference_no: firstNonEmpty(raw.reference_no, raw.referenceNo),
  authorization_amount: firstNonEmpty(raw.authorization_amount, raw.authorizationAmount, raw.amount),
  settlement_amount: firstNonEmpty(raw.settlement_amount, raw.settlementAmount),
  diff_amount: firstNonEmpty(raw.diff_amount, raw.diffAmount),
  reconcile_status: firstNonEmpty(raw.reconcile_status, raw.reconcileStatus),
  provider_event: firstNonEmpty(raw.provider_event, raw.providerEvent),
  provider_transaction_type: firstNonEmpty(raw.provider_transaction_type, raw.providerTransactionType),
  provider_transaction_state: firstNonEmpty(raw.provider_transaction_state, raw.providerTransactionState),
  merchant_name: firstNonEmpty(raw.merchant_name, raw.merchantName),
  merchant_category: firstNonEmpty(raw.merchant_category, raw.merchantCategory),
  merchant_country: firstNonEmpty(raw.merchant_country, raw.merchantCountry),
  authorization_code: firstNonEmpty(raw.authorization_code, raw.authorizationCode),
  merchant_id: firstNonEmpty(raw.merchant_id, raw.merchantId),
  merchant_name_from_card: firstNonEmpty(raw.merchant_name_from_card, raw.merchantNameFromCard),
  authorized_at: firstNonEmpty(raw.authorized_at, raw.authorizedAt),
  settled_at: firstNonEmpty(raw.settled_at, raw.settledAt),
  created_at: firstNonEmpty(raw.created_at, raw.createdAt),
  updated_at: firstNonEmpty(raw.updated_at, raw.updatedAt),
})

const CardTransactionListPage: React.FC = () => {
  const [params, setParams] = useState<QueryParams>(defaultParams)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['card-transactions', params],
    queryFn: () => cardService.getCardTransactions(params),
  })

  const items: CardTransaction[] = ((data as any)?.data?.items || []).map((item: RawCardTransaction) => normalizeCardTransaction(item))
  const total = (data as any)?.data?.total || 0

  const summary = useMemo(() => {
    const settled = items.filter((item) => item.status === 'SETTLED')
    const exception = items.filter((item) => item.status === 'EXCEPTION').length
    const matched = items.filter((item) => item.reconcile_status === 'MATCHED').length
    const pending = items.filter((item) => item.reconcile_status === 'PENDING').length
    const settledSummaryItems = settled.filter((item) => settlementSummaryTypes.has(item.type))
    const settledAmountSource = settledSummaryItems.length > 0 ? settledSummaryItems : settled
    const settledAmount = settledAmountSource.reduce((sum, item) => sum + Number(item.settlement_amount || item.amount || 0), 0)
    const authAmount = items.reduce((sum, item) => sum + Number(item.authorization_amount || item.amount || 0), 0)
    return { exception, matched, pending, settledAmount, authAmount }
  }, [items])

  const updateParams = (patch: Partial<QueryParams>) => {
    setParams((prev) => ({ ...prev, ...patch }))
  }

  const columns = [
    {
      title: '外部交易ID',
      dataIndex: 'external_transaction_id',
      width: 'max-content',
      fixed: 'left' as const,
      render: (value: string) =>
        value ? (
          <div className="inline-flex max-w-none whitespace-nowrap">
            <Typography.Text copyable={{ text: value }} className="font-mono text-xs whitespace-nowrap">
              {value}
            </Typography.Text>
          </div>
        ) : '-',
    },
    {
      title: '卡ID',
      dataIndex: 'external_card_id',
      width: 170,
      render: (value: string) => value || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 140,
      render: (value: string) => {
        const meta = getTransactionTypeMeta(value)
        return (
          <div className="space-y-1">
            <div>
              <Tag color="blue">{meta.label}</Tag>
            </div>
            <div className="text-xs text-slate-500">{meta.desc}</div>
          </div>
        )
      },
    },
    {
      title: '授权金额',
      dataIndex: 'authorization_amount',
      width: 130,
      render: (value: string, row: CardTransaction) => `${row.currency || 'USD'} ${value || row.amount || '0.00'}`,
    },
    {
      title: '结算金额',
      dataIndex: 'settlement_amount',
      width: 130,
      render: (value: string, row: CardTransaction) => `${row.currency || 'USD'} ${value || '0.00'}`,
    },
    {
      title: '差额',
      dataIndex: 'diff_amount',
      width: 110,
      render: (value: string) => value || '0.00',
    },
    {
      title: '交易状态',
      dataIndex: 'status',
      width: 170,
      render: (value: string) => {
        const meta = getTransactionStatusMeta(value)
        return (
          <div className="space-y-1">
            <div>{renderMappedTag(meta.label, meta.color, value)}</div>
            <div className="text-xs text-slate-500">{meta.desc}</div>
          </div>
        )
      },
    },
    {
      title: '对账状态',
      dataIndex: 'reconcile_status',
      width: 180,
      render: (value: string) => {
        const meta = getReconcileStatusMeta(value)
        return (
          <div className="space-y-1">
            <div>{renderMappedTag(meta.label, meta.color, value)}</div>
            <div className="text-xs text-slate-500">{meta.desc}</div>
          </div>
        )
      },
    },
    {
      title: '上游事件',
      dataIndex: 'provider_event',
      width: 180,
      render: (value: string) => {
        const meta = getProviderEventMeta(value)
        return (
          <div className="space-y-1">
            {renderMappedTag(meta.label, 'blue', value)}
            <div className="text-xs text-slate-500">{meta.desc}</div>
          </div>
        )
      },
    },
    {
      title: '上游交易类型',
      dataIndex: 'provider_transaction_type',
      width: 180,
      render: (value: string) => {
        const meta = getProviderTransactionTypeMeta(value)
        return (
          <div className="space-y-1">
            {renderMappedTag(meta.label, 'blue', value)}
            <div className="text-xs text-slate-500">{meta.desc}</div>
          </div>
        )
      },
    },
    {
      title: '上游交易状态',
      dataIndex: 'provider_transaction_state',
      width: 180,
      render: (value: string) => {
        const meta = getProviderTransactionStateMeta(value)
        return (
          <div className="space-y-1">
            {renderMappedTag(meta.label, 'purple', value)}
            <div className="text-xs text-slate-500">{meta.desc}</div>
          </div>
        )
      },
    },
    { title: '商户名称', dataIndex: 'merchant_name', width: 160, render: (value: string) => value || '-' },
    { title: '卡商名称', dataIndex: 'merchant_name_from_card', width: 160, render: (value: string) => value || '-' },
    { title: '授权时间', dataIndex: 'authorized_at', width: 180, render: (value: string) => formatDateTime(value) },
    { title: '结算时间', dataIndex: 'settled_at', width: 180, render: (value: string) => formatDateTime(value) },
    { title: '创建时间', dataIndex: 'created_at', width: 180, render: (value: string) => formatDateTime(value) },
  ]

  return (
    <div className="space-y-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[32px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_52%,#0ea5e9_100%)] text-white shadow-[0_28px_70px_rgba(30,64,175,0.28)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_28%)]" />
          <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-6 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.34em] text-sky-100/80">Card Transaction Ledger</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-white">卡交易台账</div>
              <div className="mt-3 max-w-3xl text-sm leading-6 text-sky-100">
                统一查看同步授权写入、上游交易回调更新、结算推进和对账状态，快速区分“本地已授权冻结”与“上游回调已落库”。
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                  loading={isLoading}
                  className="h-10 rounded-full border-white/15 bg-white/10 px-5 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
                >
                  刷新台账
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 self-stretch">
              {[
                { label: '当前页记录', value: items.length, helper: '分页当前载入', icon: <WalletOutlined className="text-sky-300" /> },
                { label: '筛选结果', value: total, helper: '当前筛选总数', icon: <SyncOutlined className="text-cyan-300" /> },
                { label: '异常交易', value: summary.exception, helper: '需重点排查', icon: <ExceptionOutlined className="text-amber-300" /> },
                { label: '已匹配', value: summary.matched, helper: '对账完成记录', icon: <CheckCircleOutlined className="text-emerald-300" /> },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/12 px-4 py-4 backdrop-blur-sm xl:min-h-[128px]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-sky-100/80">{item.label}</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-3 break-all text-2xl font-semibold text-white">{item.value}</div>
                  <div className="mt-1 text-xs text-sky-100/80">{item.helper}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card
        bordered={false}
        className="rounded-[30px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbff_100%)] shadow-sm"
        bodyStyle={{ padding: 16 }}
      >
        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">筛选面板</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">交易工作台</div>
            <div className="mt-1 text-sm text-slate-600">组合条件快速收敛授权通过、结算落账、同步异常和待核对流水。</div>
          </div>
          <Tag color="blue" className="w-fit rounded-full px-3 py-1">实时查询</Tag>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_180px_180px_180px_auto]">
          <Input.Search
            allowClear
            placeholder="搜索交易号、卡号或商户"
            onSearch={(search) => updateParams({ page: 1, search })}
          />
          <Select
            allowClear
            placeholder="交易类型"
            options={typeOptions}
            onChange={(type) => updateParams({ page: 1, type: type || '' })}
          />
          <Select
            allowClear
            placeholder="交易状态"
            options={statusOptions}
            onChange={(status) => updateParams({ page: 1, status: status || '' })}
          />
          <Select
            allowClear
            placeholder="对账状态"
            options={reconcileOptions}
            onChange={(reconcileStatus) => updateParams({ page: 1, reconcileStatus: reconcileStatus || '' })}
          />
          <Button onClick={() => setParams(defaultParams)} className="h-10 rounded-full border-slate-200 px-5">
            重置筛选
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <div className="rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
            事件口径：授权、结算、同步统一归集在同一台账
          </div>
          <div className="rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
            排查顺序：优先看外部交易 ID、卡 ID、上游事件与状态
          </div>
          <div className="rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
            重复通知：结合授权时间、结算时间与创建时间确认最终状态
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          bordered={false}
          className="rounded-[26px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#162033_100%)] text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]"
          bodyStyle={{ padding: 20 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-300">授权规模</div>
              <div className="mt-3 text-[28px] font-semibold tracking-tight text-white">{formatAmount(summary.authAmount)}</div>
              <div className="mt-2 text-sm text-slate-300">当前列表授权金额合计</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-slate-200">
              <WalletOutlined className="text-lg" />
            </div>
          </div>
        </Card>
        <Card
          bordered={false}
          className="rounded-[26px] border-0 bg-[linear-gradient(135deg,#111827_0%,#1e293b_100%)] text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]"
          bodyStyle={{ padding: 20 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-300">已结算金额</div>
              <div className="mt-3 text-[28px] font-semibold tracking-tight text-white">{formatAmount(summary.settledAmount)}</div>
              <div className="mt-2 text-sm text-slate-300">当前列表结算金额合计</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
              <CheckCircleOutlined className="text-lg" />
            </div>
          </div>
        </Card>
        <Card
          bordered={false}
          className="rounded-[26px] border-0 bg-[linear-gradient(135deg,#172554_0%,#1d4ed8_100%)] text-white shadow-[0_18px_40px_rgba(30,64,175,0.24)]"
          bodyStyle={{ padding: 20 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-blue-100/80">对账进度</div>
              <div className="mt-3 text-[28px] font-semibold tracking-tight text-white">{summary.matched} / {summary.pending}</div>
              <div className="mt-2 text-sm text-blue-100/80">已匹配 / 待核对</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-blue-100">
              <SyncOutlined className="text-lg" />
            </div>
          </div>
        </Card>
      </div>

      <Card
        bordered={false}
        className="rounded-[30px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">明细列表</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">交易台账记录</div>
            <div className="mt-2 text-sm text-slate-600">共 {total} 条记录，支持查看金额、状态、上游事件、回调推进阶段和关键时间轴。</div>
          </div>
          <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-medium text-sky-700">
            先看“上游事件”区分同步授权写入或上游回调更新
          </div>
        </div>

        <Table<CardTransaction>
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          scroll={{ x: 'max-content' }}
          rowClassName={() => 'hover:!bg-slate-50'}
          columns={columns}
          pagination={{
            current: params.page,
            pageSize: params.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (value, range) => `第 ${range[0]}-${range[1]} 条，共 ${value} 条`,
            onChange: (page, pageSize) => updateParams({ page, pageSize: pageSize || 20 }),
          }}
        />
      </Card>
    </div>
  )
}

export default CardTransactionListPage
