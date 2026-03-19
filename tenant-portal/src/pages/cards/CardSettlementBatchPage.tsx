import React, { useMemo, useState } from 'react'
import { Button, Card, Input, Progress, Select, Table, Tag } from 'antd'
import {
  CheckCircleOutlined,
  ClusterOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardSettlementBatch } from '@shared/types'
import { getSettlementBatchStatusMeta, renderMappedTag } from './cardDisplay'

type QueryParams = {
  page: number
  pageSize: number
  search: string
  status: string
}

const defaultParams: QueryParams = {
  page: 1,
  pageSize: 20,
  search: '',
  status: '',
}

const statusOptions = [
  { value: 'PENDING', label: '处理中' },
  { value: 'PROCESSED', label: '已处理' },
]

const formatAmount = (value: number) => value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-')

const CardSettlementBatchPage: React.FC = () => {
  const [params, setParams] = useState<QueryParams>(defaultParams)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['card-settlement-batches', params],
    queryFn: () => cardService.getSettlementBatches(params),
  })

  const items: CardSettlementBatch[] = (data as any)?.data?.items || []
  const total = (data as any)?.data?.total || 0

  const summary = useMemo(() => {
    const processed = items.filter((item) => item.status === 'PROCESSED').length
    const pending = items.filter((item) => item.status === 'PENDING').length
    const diffCount = items.reduce((sum, item) => sum + Number(item.diff_count || 0), 0)
    const totalAmount = items.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
    return { processed, pending, diffCount, totalAmount }
  }, [items])

  const updateParams = (patch: Partial<QueryParams>) => {
    setParams((prev) => ({ ...prev, ...patch }))
  }

  const columns = [
    { title: '批次号', dataIndex: 'batch_id', width: 220 },
    { title: '渠道', dataIndex: 'provider', width: 110, render: (value: string) => (value === 'dtcpay' ? 'DTC 发卡' : (value || '-')) },
    {
      title: '状态',
      dataIndex: 'status',
      width: 180,
      render: (value: string) => {
        const meta = getSettlementBatchStatusMeta(value)
        return (
          <div className="space-y-1">
            <div>{renderMappedTag(meta.label, meta.color, value)}</div>
            <div className="text-xs text-slate-500">{meta.desc}</div>
          </div>
        )
      },
    },
    { title: '币种', dataIndex: 'currency', width: 90, render: (value: string) => value || '-' },
    { title: '笔数', dataIndex: 'total_count', width: 90 },
    { title: '总金额', dataIndex: 'total_amount', width: 130 },
    {
      title: '匹配进度',
      key: 'matched',
      width: 240,
      render: (_: unknown, row: CardSettlementBatch) => {
        const totalCount = row.total_count || 0
        const matched = row.matched_count || 0
        const percent = totalCount > 0 ? Math.round((matched / totalCount) * 100) : 0
        return <Progress percent={percent} size="small" status={row.diff_count > 0 ? 'exception' : 'success'} />
      },
    },
    { title: '差异数', dataIndex: 'diff_count', width: 100 },
    { title: '最后结算时间', dataIndex: 'last_settled_at', width: 180, render: (value: string) => formatDateTime(value) },
    { title: '更新时间', dataIndex: 'updated_at', width: 180, render: (value: string) => formatDateTime(value) },
  ]

  return (
    <div className="space-y-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#172554_55%,#1d4ed8_100%)] text-white shadow-[0_24px_56px_rgba(30,64,175,0.24)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-white/10 px-6 py-5 xl:border-b-0 xl:border-r xl:border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.34em] text-slate-300">Settlement Batch Control</div>
                <div className="mt-2 text-[30px] font-semibold tracking-tight text-white">卡结算批次</div>
                <div className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                  按批次查看卡商结算进度、匹配结果和差异数量，优先识别处理中的批次与异常差异。
                </div>
              </div>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
                className="h-10 rounded-full border-white/15 bg-white/10 px-4 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
              >
                刷新
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4">
            {[
              { label: '批次数', value: total, helper: '当前筛选总数' },
              { label: '处理中', value: summary.pending, helper: '待继续同步' },
              { label: '已处理', value: summary.processed, helper: '批次已完成' },
              { label: '差异合计', value: summary.diffCount, helper: '待继续核对' },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`flex min-h-[138px] flex-col justify-between px-5 py-5 border-white/10 ${
                  index < 2 ? 'border-b xl:border-b-0' : ''
                } ${index < 3 ? 'xl:border-r' : ''} ${index % 2 === 0 ? 'border-r xl:border-r' : ''}`}
              >
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</div>
                <div className="py-2 text-[30px] font-semibold tracking-tight text-white">{item.value}</div>
                <div className="text-xs text-slate-200">{item.helper}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card
        bordered={false}
        className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
        bodyStyle={{ padding: 0 }}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] px-5 py-3 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-500">筛选面板</div>
                <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">批次工作区</div>
              </div>
              <Tag color="blue" className="rounded-full px-3 py-1">批次视角</Tag>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
              <Input.Search
                allowClear
                placeholder="搜索批次号"
                onSearch={(search) => updateParams({ page: 1, search })}
              />
              <Select
                allowClear
                placeholder="批次状态"
                options={statusOptions}
                onChange={(status) => updateParams({ page: 1, status: status || '' })}
              />
              <Button onClick={() => setParams(defaultParams)} className="h-10 rounded-full border-slate-200 px-5">
                重置筛选
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                优先处理 `处理中` 且差异数大于 0 的批次
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                匹配进度需结合差异数一起判断
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,#0f172a_0%,#162033_100%)] px-4 py-3 text-white md:border-b-0 md:border-r">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-300">结算总额</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{formatAmount(summary.totalAmount)}</div>
                  <div className="mt-1 text-xs text-slate-300">当前列表批次金额合计</div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-100">
                  <ClusterOutlined />
                </div>
              </div>
            </div>

            <div className="border-b border-white/10 bg-[linear-gradient(135deg,#111827_0%,#1e293b_100%)] px-4 py-3 text-white md:border-b-0 md:border-r">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-300">处理完成率</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                    {total > 0 ? `${Math.round((summary.processed / total) * 100)}%` : '0%'}
                  </div>
                  <div className="mt-1 text-xs text-slate-300">按当前列表批次计算</div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                  <CheckCircleOutlined />
                </div>
              </div>
            </div>

            <div className="bg-[linear-gradient(135deg,#172554_0%,#1d4ed8_100%)] px-4 py-3 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-blue-100/80">异常提示</div>
                  <div className="mt-2 text-base font-semibold tracking-tight text-white">优先关注存在差异的批次</div>
                  <div className="mt-1 text-xs text-blue-100/80">差异数大于 0 时，匹配进度高也不能直接视为完成。</div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-100">
                  <ExclamationCircleOutlined />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card
        bordered={false}
        className="rounded-[30px] border border-slate-200 bg-white shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">批次列表</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">结算批次记录</div>
            <div className="mt-2 text-sm text-slate-600">共 {total} 条记录，支持查看批次状态、匹配进度、差异数和更新时间。</div>
          </div>
        </div>

        <Table<CardSettlementBatch>
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          scroll={{ x: 1600 }}
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

export default CardSettlementBatchPage
