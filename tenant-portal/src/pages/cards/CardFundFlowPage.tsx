import React, { useMemo, useState } from 'react'
import { Button, Card, Input, Select, Table, Tag, Typography } from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
  SnippetsOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { FundFlowRecord } from '@/services/fundFlowService'

const directionMap: Record<number, { text: string; color: string }> = {
  1: { text: '入账', color: 'success' },
  2: { text: '出账', color: 'error' },
}

type QueryParams = {
  page: number
  pageSize: number
  search: string
  changeType: string
  status: string
}

const defaultParams: QueryParams = {
  page: 1,
  pageSize: 20,
  search: '',
  changeType: '',
  status: '',
}

const changeTypeOptions = [
  { value: 'card_consume_auth', label: '授权冻结' },
  { value: 'card_consume_release', label: '差额释放' },
  { value: 'card_consume_adjust', label: '超额补扣' },
]

const statusOptions = [
  { value: '1', label: '成功' },
  { value: '2', label: '冲正' },
]

const formatAmount = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-')

const CardFundFlowPage: React.FC = () => {
  const [params, setParams] = useState<QueryParams>(defaultParams)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['card-fund-flows', params],
    queryFn: () => cardService.getCardFundFlows(params),
  })

  const items: FundFlowRecord[] = (data as any)?.data?.items || []
  const pagination = (data as any)?.data?.pagination
  const total = pagination?.total || 0

  const summary = useMemo(() => {
    const incomeCount = items.filter((item) => Number(item.direction) === 1).length
    const expenseCount = items.filter((item) => Number(item.direction) === 2).length
    const successCount = items.filter((item) => String(item.status) === '1').length
    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    return { incomeCount, expenseCount, successCount, totalAmount }
  }, [items])

  const updateParams = (patch: Partial<QueryParams>) => {
    setParams((prev) => ({ ...prev, ...patch }))
  }

  const columns = [
    {
      title: '变动类型',
      dataIndex: 'changeType',
      width: 170,
      render: (value: string) => value || '-',
    },
    {
      title: '方向',
      dataIndex: 'direction',
      width: 100,
      render: (value: number) => <Tag color={directionMap[value]?.color || 'default'}>{directionMap[value]?.text || value}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 130,
      render: (value: string, row: FundFlowRecord) => `${row.symbol} ${value}`,
    },
    { title: '余额前', dataIndex: 'balanceBefore', width: 120 },
    { title: '余额后', dataIndex: 'balanceAfter', width: 120 },
    { title: '冻结前', dataIndex: 'frozenBefore', width: 120 },
    { title: '冻结后', dataIndex: 'frozenAfter', width: 120 },
    {
      title: '参考ID',
      dataIndex: 'referenceId',
      width: 190,
      render: (value: string) =>
        value ? (
          <Typography.Text copyable={{ text: value }} className="font-mono text-xs">
            {value}
          </Typography.Text>
        ) : '-',
    },
    { title: '业务号', dataIndex: 'businessId', width: 180, render: (value: string) => value || '-' },
    { title: '备注', dataIndex: 'remark', width: 220, render: (value: string) => value || '-' },
    { title: '时间', dataIndex: 'occurredAt', width: 180, render: (value: string) => formatDateTime(value) },
  ]

  return (
    <div className="space-y-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#172554_55%,#1d4ed8_100%)] text-white shadow-[0_24px_56px_rgba(30,64,175,0.24)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="flex flex-col gap-0 xl:flex-row">
          <div className="border-b border-white/10 px-5 py-2 text-white xl:w-[46%] xl:border-b-0 xl:border-r xl:border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.34em] text-slate-300">Tenant Fund Flow Ledger</div>
                <div className="mt-1 text-[22px] font-semibold tracking-tight text-white">卡资金总账</div>
                <div className="mt-1 max-w-2xl text-xs leading-4 text-slate-200">
                  聚焦卡消费场景的总账记录，重点核对冻结、释放、补扣和冲正结果。
                </div>
              </div>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
                className="h-8 rounded-full border-white/15 bg-white/10 px-3 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
              >
                刷新
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 xl:w-[54%]">
            {[
              { label: '当前页记录', value: items.length, helper: '分页当前载入' },
              { label: '总账记录', value: total, helper: '筛选结果总数' },
              { label: '成功记录', value: summary.successCount, helper: '状态为成功' },
              { label: '合计金额', value: formatAmount(summary.totalAmount), helper: '当前列表金额合计' },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`flex min-h-[132px] flex-col justify-between px-6 py-5 border-white/10 ${
                  index < 2 ? 'md:border-b' : ''
                } ${index < 3 ? 'xl:border-r' : ''} xl:border-b-0`}
              >
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</div>
                <div className="py-2 text-[30px] font-semibold tracking-tight text-white">{item.value}</div>
                <div className="text-xs text-slate-200">{item.helper}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card
          bordered={false}
          className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#0f172a_0%,#18243b_100%)] text-white shadow-[0_20px_48px_rgba(15,23,42,0.22)]"
          bodyStyle={{ padding: 20 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <SnippetsOutlined className="text-lg text-slate-100" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">筛选条件</div>
              <div className="text-xs text-slate-400">按总账口径收敛记录</div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Input.Search
              allowClear
              placeholder="搜索参考号、业务号或备注"
              onSearch={(search) => updateParams({ page: 1, search })}
            />
            <Select
              allowClear
              placeholder="变动类型"
              options={changeTypeOptions}
              onChange={(changeType) => updateParams({ page: 1, changeType: changeType || '' })}
            />
            <Select
              allowClear
              placeholder="状态"
              options={statusOptions}
              onChange={(status) => updateParams({ page: 1, status: status || '' })}
            />
            <Button onClick={() => setParams(defaultParams)} className="h-10 w-full rounded-full border-white/15 bg-white/10 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white">
              重置筛选
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">总账口径</div>
              <div className="mt-2 text-sm text-slate-100">该页面只展示卡消费场景写入的资金总账记录。</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">排查建议</div>
              <div className="mt-2 text-sm text-slate-100">优先结合参考 ID、业务号和冻结前后金额进行核对。</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card bordered={false} className="rounded-[24px] border border-emerald-100 bg-emerald-50 shadow-sm" bodyStyle={{ padding: 18 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-emerald-700/80">入账记录</div>
                  <div className="mt-2 text-[28px] font-semibold tracking-tight text-emerald-900">{summary.incomeCount}</div>
                  <div className="mt-1 text-sm text-emerald-700/80">方向为入账</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-emerald-600">
                  <ArrowDownOutlined />
                </div>
              </div>
            </Card>
            <Card bordered={false} className="rounded-[24px] border border-rose-100 bg-rose-50 shadow-sm" bodyStyle={{ padding: 18 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-rose-700/80">出账记录</div>
                  <div className="mt-2 text-[28px] font-semibold tracking-tight text-rose-900">{summary.expenseCount}</div>
                  <div className="mt-1 text-sm text-rose-700/80">方向为出账</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-rose-600">
                  <ArrowUpOutlined />
                </div>
              </div>
            </Card>
            <Card bordered={false} className="rounded-[24px] border border-amber-100 bg-amber-50 shadow-sm" bodyStyle={{ padding: 18 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-amber-700/80">重点提示</div>
                  <div className="mt-2 text-base font-semibold tracking-tight text-amber-900">冻结前后与余额前后需联看</div>
                  <div className="mt-2 text-sm text-amber-700/80">仅看金额不足以判断真实账务结果</div>
                </div>
              </div>
            </Card>
          </div>

          <Card
            bordered={false}
            className="rounded-[30px] border border-slate-200 bg-white shadow-sm"
            bodyStyle={{ padding: 24 }}
          >
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500">总账明细</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">资金总账记录</div>
            <div className="mt-2 text-sm text-slate-600">共 {total} 条记录，支持查看变动类型、方向、金额、余额变化和参考信息。</div>
          </div>
        </div>

            <Table<FundFlowRecord>
              rowKey="id"
              loading={isLoading}
              dataSource={items}
              scroll={{ x: 1700 }}
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
      </div>
    </div>
  )
}

export default CardFundFlowPage
