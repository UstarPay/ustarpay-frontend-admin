import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
  SearchOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'

import {
  fundFlowService,
} from '@/services'
import type { FundFlowQuery, FundFlowRecord, FundFlowStats } from '@/services/fundFlowService'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

type FundFlowFilterState = {
  search: string
  symbol: string
  changeType: string
  bizType: string
  direction: string
  status: string
  dateRange: [Dayjs, Dayjs] | null
}

const DEFAULT_STATS: FundFlowStats = {
  totalRecords: 0,
  incomeCount: 0,
  expenseCount: 0,
  reversedCount: 0,
  todayRecords: 0,
  incomeAmount: '0',
  expenseAmount: '0',
  netAmount: '0',
  latestOccurredAt: '',
  distinctUsersCount: 0,
}

const INITIAL_FILTERS: FundFlowFilterState = {
  search: '',
  symbol: 'all',
  changeType: 'all',
  bizType: 'all',
  direction: 'all',
  status: 'all',
  dateRange: null,
}

const PAGE_SIZE = 20

function formatAmount(value?: string, digits = 6) {
  return Number(value || 0).toFixed(digits)
}

function toQueryParams(filters: FundFlowFilterState, page = 1): FundFlowQuery {
  return {
    page,
    pageSize: PAGE_SIZE,
    search: filters.search || undefined,
    symbol: filters.symbol !== 'all' ? filters.symbol : undefined,
    changeType: filters.changeType !== 'all' ? filters.changeType : undefined,
    bizType: filters.bizType !== 'all' ? filters.bizType : undefined,
    direction: filters.direction !== 'all' ? filters.direction : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
    endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD'),
  }
}

function getDirectionTag(direction: number) {
  if (direction === 1) {
    return <Tag color="success" icon={<ArrowDownOutlined />}>入账</Tag>
  }
  if (direction === 2) {
    return <Tag color="error" icon={<ArrowUpOutlined />}>出账</Tag>
  }
  return <Tag>未知</Tag>
}

function getStatusTag(status: number) {
  if (status === 1) {
    return <Tag color="processing">成功</Tag>
  }
  if (status === 2) {
    return <Tag color="warning">冲正</Tag>
  }
  return <Tag>未知</Tag>
}

function getChangeTypeColor(changeType: string) {
  const colorMap: Record<string, string> = {
    deposit: 'green',
    withdraw: 'red',
    withdraw_fee: 'volcano',
    card_open_fee: 'gold',
    transfer_to_card: 'blue',
    invite_rebate: 'cyan',
    wealth_subscribe: 'purple',
    wealth_redeem: 'lime',
  }
  return colorMap[changeType] || 'default'
}

function getChangeTypeLabel(changeType: string) {
  const labelMap: Record<string, string> = {
    deposit: '充值入账',
    withdraw: '提现扣款',
    withdraw_fee: '提现手续费',
    card_open_fee: '开卡费',
    transfer_to_card: '转卡资金',
    invite_rebate: '邀请返佣',
    wealth_subscribe: '理财申购',
    wealth_redeem: '理财赎回',
  }
  return labelMap[changeType] || changeType || '-'
}

function getBizTypeLabel(bizType?: string) {
  const labelMap: Record<string, string> = {
    withdrawal: '提现业务',
    card_apply: '开卡业务',
    card_consume: '卡消费业务',
  }
  return labelMap[bizType || ''] || bizType || '-'
}

function getReferenceTypeLabel(referenceType?: string) {
  const labelMap: Record<string, string> = {
    tenant_withdrawal: '提现单',
    card_apply: '开卡申请单',
    card_transaction: '卡交易单',
  }
  return labelMap[referenceType || ''] || referenceType || '-'
}

const FundFlowListPage: React.FC = () => {
  const [filters, setFilters] = useState<FundFlowFilterState>(INITIAL_FILTERS)
  const [records, setRecords] = useState<FundFlowRecord[]>([])
  const [stats, setStats] = useState<FundFlowStats>(DEFAULT_STATS)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const queryParams = useMemo(() => toQueryParams(filters, page), [filters, page])

  const loadData = async (params: FundFlowQuery) => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        fundFlowService.getFundFlows(params),
        fundFlowService.getFundFlowStats(params),
      ])

      const listData = listRes.data as any
      const statsData = statsRes.data as any

      setRecords(listData?.items || [])
      setTotal(listData?.pagination?.total || 0)
      setStats(statsData || DEFAULT_STATS)
    } catch (error) {
      console.error('加载资金变动明细账失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(queryParams)
  }, [queryParams])

  const uniqueSymbols = useMemo(
    () => Array.from(new Set(records.map((item) => item.symbol).filter(Boolean))),
    [records]
  )

  const uniqueBizTypes = useMemo(
    () => Array.from(new Set(records.map((item) => item.bizType).filter(Boolean))),
    [records]
  )

  const uniqueChangeTypes = useMemo(
    () => Array.from(new Set(records.map((item) => item.changeType).filter(Boolean))),
    [records]
  )

  const columns: ColumnsType<FundFlowRecord> = [
    {
      title: '账务时间',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 170,
      render: (value: string) => (
        <Space direction="vertical" size={0}>
          <Text strong>{dayjs(value).format('MM-DD HH:mm:ss')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(value).format('YYYY')}
          </Text>
        </Space>
      ),
    },
    {
      title: '方向 / 类型',
      key: 'directionType',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {getDirectionTag(record.direction)}
          <Tag color={getChangeTypeColor(record.changeType)}>{getChangeTypeLabel(record.changeType)}</Tag>
        </Space>
      ),
    },
    {
      title: '变动金额',
      key: 'amount',
      width: 180,
      render: (_, record) => {
        const isIncome = record.direction === 1
        return (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: isIncome ? '#15803d' : '#b91c1c', fontSize: 15 }}>
              {isIncome ? '+' : '-'}{formatAmount(record.amount)} {record.symbol}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              账务状态 {record.status === 1 ? '已入账' : '已冲正'}
            </Text>
          </Space>
        )
      },
    },
    {
      title: '余额快照',
      key: 'balance',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text>可用: {formatAmount(record.balanceBefore)} → {formatAmount(record.balanceAfter)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            冻结: {formatAmount(record.frozenBefore)} → {formatAmount(record.frozenAfter)}
          </Text>
        </Space>
      ),
    },
    {
      title: '业务信息',
      key: 'bizInfo',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{getBizTypeLabel(record.bizType)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            引用: {getReferenceTypeLabel(record.referenceType)}
          </Text>
          <Tooltip title={record.referenceId}>
            <Text code>{record.referenceId?.slice(0, 12) || '-'}{record.referenceId?.length > 12 ? '...' : ''}</Text>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '用户 / 单号',
      key: 'userOrder',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tooltip title={record.userId}>
            <Text>{record.userId?.slice(0, 8)}...{record.userId?.slice(-4)}</Text>
          </Tooltip>
          <Text type="secondary" style={{ fontSize: 12 }}>
            业务单号: {record.businessId || record.orderNo || '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => getStatusTag(record.status),
    },
  ]

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7fb_0%,#eef4f9_42%,#f8fafc_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-[1680px] space-y-6">
        <section className="overflow-hidden rounded-[34px] border border-sky-100/70 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_48%,#0ea5e9_100%)] text-white shadow-[0_30px_80px_rgba(29,78,216,0.20)]">
          <div className="relative px-6 py-4 md:px-8 md:py-4">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.18),rgba(15,118,110,0))]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.04)_100%)]" />
            <div className="relative flex flex-col gap-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-emerald-100">
                    Ledger Journal
                  </div>
                  <Title level={1} className="!mb-1 !mt-2 !text-[28px] !font-semibold !tracking-tight !text-[#fffaf2] md:!text-[30px]">
                    资金变动明细账
                  </Title>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
                  <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">净变动</div>
                    <div className="mt-1 text-[22px] font-semibold tracking-tight text-white">{formatAmount(stats.netAmount)}</div>
                    <div className="mt-0.5 text-xs text-slate-300">入账减出账后的账务净额</div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/15 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">账务状态</div>
                    <div className="mt-2 space-y-1.5">
                      {[
                        { label: '入账', value: stats.incomeCount, tone: 'text-emerald-200' },
                        { label: '出账', value: stats.expenseCount, tone: 'text-amber-200' },
                        { label: '冲正', value: stats.reversedCount, tone: 'text-rose-200' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/6 px-4 py-1.5">
                          <span className="text-[13px] text-slate-200">{item.label}</span>
                          <span className={`text-[15px] font-semibold ${item.tone}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: '总流水笔数', value: stats.totalRecords, helper: '累计入账与出账明细', tone: 'bg-white/8 text-white' },
                  { label: '今日记账', value: stats.todayRecords, helper: '当日新增台账', tone: 'bg-emerald-400/15 text-emerald-100' },
                  { label: '涉及用户', value: stats.distinctUsersCount, helper: '发生过记账的用户', tone: 'bg-amber-400/15 text-amber-100' },
                  { label: '入账总额', value: formatAmount(stats.incomeAmount), helper: '成功入账金额', tone: 'bg-sky-400/15 text-sky-100' },
                  { label: '出账总额', value: formatAmount(stats.expenseAmount), helper: '成功出账金额', tone: 'bg-rose-400/15 text-rose-100' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-[22px] px-4 py-2.5 ${item.tone}`}>
                    <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">{item.label}</div>
                    <div className="mt-1.5 break-all text-[19px] font-semibold leading-none">{item.value}</div>
                    <div className="mt-1 text-[11px] opacity-80">{item.helper}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-[#dce7f3] bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_52%,#eef6ff_100%)] shadow-[0_16px_38px_rgba(21,40,67,0.05)]">
          <div className="border-b border-[#dde7f2] px-6 py-3.5 md:px-8 md:py-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Ledger Filters</div>
                <div className="mt-1.5 text-[22px] font-semibold tracking-tight text-slate-900">台账筛选面板</div>
                <div className="mt-1 text-sm text-slate-500">
                  当前结果 {records.length} 条，最近记账时间 {stats.latestOccurredAt ? dayjs(stats.latestOccurredAt).format('YYYY-MM-DD HH:mm:ss') : '-'}。
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => loadData(queryParams)}
                  loading={loading}
                  className="!h-11 !rounded-full !border-0 !bg-[#16324f] !px-5 !shadow-none"
                >
                  刷新
                </Button>
                <Button
                  icon={<SwapOutlined />}
                  onClick={() => {
                    setPage(1)
                    setFilters(INITIAL_FILTERS)
                  }}
                  className="!h-11 !rounded-full !border-[#d8e4f0] !bg-white !px-5 !text-slate-700"
                >
                  重置筛选
                </Button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 md:px-8 md:py-4">
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12} xl={8}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="搜索用户ID、引用ID、业务单号、备注"
                  value={filters.search}
                  className="!h-11 !rounded-2xl"
                  onChange={(event) => {
                    setPage(1)
                    setFilters((prev) => ({ ...prev, search: event.target.value }))
                  }}
                />
              </Col>
              <Col xs={12} md={6} xl={4}>
                <Select
                  className="fund-flow-select"
                  style={{ width: '100%' }}
                  value={filters.direction}
                  onChange={(value) => {
                    setPage(1)
                    setFilters((prev) => ({ ...prev, direction: value }))
                  }}
                  options={[
                    { value: 'all', label: '全部方向' },
                    { value: '1', label: '入账' },
                    { value: '2', label: '出账' },
                  ]}
                />
              </Col>
              <Col xs={12} md={6} xl={4}>
                <Select
                  className="fund-flow-select"
                  style={{ width: '100%' }}
                  value={filters.status}
                  onChange={(value) => {
                    setPage(1)
                    setFilters((prev) => ({ ...prev, status: value }))
                  }}
                  options={[
                    { value: 'all', label: '全部状态' },
                    { value: '1', label: '成功' },
                    { value: '2', label: '冲正' },
                  ]}
                />
              </Col>
              <Col xs={12} md={6} xl={4}>
                <Select
                  className="fund-flow-select"
                  style={{ width: '100%' }}
                  value={filters.symbol}
                  onChange={(value) => {
                    setPage(1)
                    setFilters((prev) => ({ ...prev, symbol: value }))
                  }}
                  options={[
                    { value: 'all', label: '全部币种' },
                    ...uniqueSymbols.map((item) => ({ value: item, label: item })),
                  ]}
                />
              </Col>
              <Col xs={12} md={6} xl={4}>
                <Select
                  className="fund-flow-select"
                  style={{ width: '100%' }}
                  value={filters.changeType}
                  onChange={(value) => {
                    setPage(1)
                    setFilters((prev) => ({ ...prev, changeType: value }))
                  }}
                  options={[
                    { value: 'all', label: '全部变动类型' },
                    ...uniqueChangeTypes.map((item) => ({ value: item, label: getChangeTypeLabel(item) })),
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Select
                  className="fund-flow-select"
                  style={{ width: '100%' }}
                  value={filters.bizType}
                  onChange={(value) => {
                    setPage(1)
                    setFilters((prev) => ({ ...prev, bizType: value }))
                  }}
                  options={[
                    { value: 'all', label: '全部业务类型' },
                    ...uniqueBizTypes.map((item) => ({ value: item, label: getBizTypeLabel(item) })),
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={8}>
                <RangePicker
                  style={{ width: '100%', height: 44 }}
                  value={filters.dateRange}
                  onChange={(value) => {
                    setPage(1)
                    setFilters((prev) => ({ ...prev, dateRange: value as [Dayjs, Dayjs] | null }))
                  }}
                />
              </Col>
            </Row>
          </div>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-[#dce7f3] bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
          <div className="border-b border-[#edf2f7] px-6 py-5 md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Ledger Entries</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">明细账列表</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-emerald-700">入账笔数</div>
                  <div className="mt-2 text-xl font-semibold text-emerald-900">{stats.incomeCount}</div>
                </div>
                <div className="rounded-[20px] border border-rose-100 bg-rose-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-rose-700">出账笔数</div>
                  <div className="mt-2 text-xl font-semibold text-rose-900">{stats.expenseCount}</div>
                </div>
                <div className="rounded-[20px] border border-amber-100 bg-amber-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-amber-700">冲正笔数</div>
                  <div className="mt-2 text-xl font-semibold text-amber-900">{stats.reversedCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-2 py-2 md:px-4 md:py-4">
            <Table
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={records}
              scroll={{ x: 1280 }}
              pagination={{
                current: page,
                pageSize: PAGE_SIZE,
                total,
                showSizeChanger: false,
                onChange: (nextPage) => setPage(nextPage),
              }}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

export default FundFlowListPage
