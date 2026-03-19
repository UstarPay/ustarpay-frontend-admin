import React, { useMemo, useState } from 'react'
import { Button, Card, Input, Select, Table, Tag, Typography } from 'antd'
import {
  CheckCircleOutlined,
  ReloadOutlined,
  SyncOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardAccountFlow } from '@shared/types'
import { getCardFlowTypeMeta, renderMappedTag } from './cardDisplay'

type QueryParams = {
  page: number
  pageSize: number
  search: string
  flowType: string
  currency: string
}

const defaultParams: QueryParams = {
  page: 1,
  pageSize: 20,
  search: '',
  flowType: '',
  currency: '',
}

const flowTypeOptions = [
  { value: 'HOLD', label: '授权冻结' },
  { value: 'SETTLE', label: '结算确认' },
  { value: 'RELEASE', label: '差额释放' },
  { value: 'ADJUST', label: '补扣调整' },
]

const formatAmount = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-')

const CardAccountFlowPage: React.FC = () => {
  const [params, setParams] = useState<QueryParams>(defaultParams)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['card-account-flows', params],
    queryFn: () => cardService.getCardAccountFlows(params),
  })

  const items: CardAccountFlow[] = (data as any)?.data?.items || []
  const total = (data as any)?.data?.total || 0

  const summary = useMemo(() => {
    const holdCount = items.filter((item) => item.flow_type === 'HOLD').length
    const settleCount = items.filter((item) => item.flow_type === 'SETTLE').length
    const releaseCount = items.filter((item) => item.flow_type === 'RELEASE').length
    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    return { holdCount, settleCount, releaseCount, totalAmount }
  }, [items])

  const updateParams = (patch: Partial<QueryParams>) => {
    setParams((prev) => ({ ...prev, ...patch }))
  }

  const columns = [
    {
      title: '外部交易ID',
      dataIndex: 'external_transaction_id',
      width: 200,
      render: (value: string) =>
        value ? (
          <Typography.Text copyable={{ text: value }} className="font-mono text-xs">
            {value}
          </Typography.Text>
        ) : '-',
    },
    {
      title: '流水类型',
      dataIndex: 'flow_type',
      width: 180,
      render: (value: string) => {
        const meta = getCardFlowTypeMeta(value)
        return (
          <div className="space-y-1">
            <div>{renderMappedTag(meta.label, meta.color, value)}</div>
            <div className="text-xs text-slate-500">{meta.desc}</div>
          </div>
        )
      },
    },
    { title: '金额', dataIndex: 'amount', width: 120, render: (value: string, row: CardAccountFlow) => `${row.currency} ${value}` },
    { title: '可用前', dataIndex: 'available_before', width: 120 },
    { title: '可用后', dataIndex: 'available_after', width: 120 },
    { title: '冻结前', dataIndex: 'held_before', width: 120 },
    { title: '冻结后', dataIndex: 'held_after', width: 120 },
    { title: '引用ID', dataIndex: 'reference_id', width: 180, render: (value: string) => value || '-' },
    { title: '备注', dataIndex: 'remark', width: 180, render: (value: string) => value || '-' },
    { title: '时间', dataIndex: 'created_at', width: 180, render: (value: string) => formatDateTime(value) },
  ]

  return (
    <div className="space-y-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#172554_55%,#1d4ed8_100%)] text-white shadow-[0_24px_56px_rgba(30,64,175,0.24)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="px-4 py-2 text-white lg:px-5">
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-300">Card Account Ledger</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-white">卡额度流水</div>
            <div className="mt-1 max-w-3xl text-xs leading-4 text-slate-300">
              查看授权冻结、结算确认、差额释放和补扣过程，快速定位额度冻结与释放链路中的异常点。
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
                className="h-8 rounded-full border-white/15 bg-white/10 px-3 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
              >
                刷新流水
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-white/10 bg-transparent xl:border-l xl:border-t-0 xl:border-white/10">
            {[
              { label: '当前页记录', value: items.length, helper: '分页当前载入' },
              { label: '筛选结果', value: total, helper: '当前筛选总数' },
              { label: '授权冻结', value: summary.holdCount, helper: 'HOLD 流水数' },
              { label: '结算确认', value: summary.settleCount, helper: 'SETTLE 流水数' },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`px-4 py-3 ${index % 2 === 0 ? 'xl:border-r' : ''} ${index < 2 ? 'border-b' : ''} border-white/10`}
              >
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{item.value}</div>
                <div className="mt-0.5 text-xs text-slate-200">{item.helper}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card
          bordered={false}
          className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
          bodyStyle={{ padding: 20 }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-500">筛选面板</div>
              <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">额度工作台</div>
            </div>
            <Tag color="blue" className="rounded-full px-3 py-1">实时查询</Tag>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px]">
            <Input.Search
              allowClear
              placeholder="搜索交易号或卡记录"
              onSearch={(search) => updateParams({ page: 1, search })}
            />
            <Select
              allowClear
              placeholder="流水类型"
              options={flowTypeOptions}
              onChange={(flowType) => updateParams({ page: 1, flowType: flowType || '' })}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[140px_auto]">
            <Select
              allowClear
              placeholder="币种"
              options={[{ value: 'USD', label: 'USD' }]}
              onChange={(currency) => updateParams({ page: 1, currency: currency || '' })}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setParams(defaultParams)} className="h-10 rounded-full border-slate-200 px-5">
                重置筛选
              </Button>
              <div className="rounded-full bg-slate-50 px-3 py-2 text-xs text-slate-600">
                冻结、确认、释放、补扣按同一交易关联
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Card
            bordered={false}
            className="rounded-[24px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#162033_100%)] text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]"
            bodyStyle={{ padding: 14 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-300">流水金额</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{formatAmount(summary.totalAmount)}</div>
                <div className="mt-1 text-sm text-slate-300">当前列表金额合计</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-200">
                <WalletOutlined className="text-lg" />
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
            <Card
              bordered={false}
              className="rounded-[24px] border-0 bg-[linear-gradient(135deg,#111827_0%,#1e293b_100%)] text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]"
              bodyStyle={{ padding: 14 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-300">结算确认</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{summary.settleCount}</div>
                  <div className="mt-1 text-sm text-slate-300">已确认额度流水</div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                  <CheckCircleOutlined className="text-lg" />
                </div>
              </div>
            </Card>
            <Card
              bordered={false}
              className="rounded-[24px] border-0 bg-[linear-gradient(135deg,#172554_0%,#1d4ed8_100%)] text-white shadow-[0_18px_40px_rgba(30,64,175,0.24)]"
              bodyStyle={{ padding: 14 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-blue-100/80">差额释放</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{summary.releaseCount}</div>
                  <div className="mt-1 text-sm text-blue-100/80">RELEASE 流水数</div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-100">
                  <SyncOutlined className="text-lg" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Card
        bordered={false}
        className="rounded-[30px] border border-slate-200 bg-white shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">明细列表</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">额度流水记录</div>
            <div className="mt-2 text-sm text-slate-600">共 {total} 条记录，支持查看金额、余额前后、冻结前后和引用信息。</div>
          </div>
          <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-medium text-sky-700">
            额度变动与引用关系联动展示
          </div>
        </div>

        <Table<CardAccountFlow>
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          scroll={{ x: 1500 }}
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

export default CardAccountFlowPage
