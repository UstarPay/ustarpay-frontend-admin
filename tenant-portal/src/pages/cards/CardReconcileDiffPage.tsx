import React, { useMemo, useState } from 'react'
import { Button, Card, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd'
import {
  AlertOutlined,
  CheckCircleOutlined,
  IssuesCloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardReconcileDiff } from '@shared/types'
import { getReconcileDiffStatusMeta, getReconcileDiffTypeMeta, renderMappedTag } from './cardDisplay'

type QueryParams = {
  page: number
  pageSize: number
  search: string
  status: string
  diffType: string
}

const defaultParams: QueryParams = {
  page: 1,
  pageSize: 20,
  search: '',
  status: '',
  diffType: '',
}

const statusOptions = [
  { value: 'OPEN', label: '待处理' },
  { value: 'RESOLVED', label: '已解决' },
]

const diffTypeOptions = [
  { value: 'AUTH_MISSING', label: '授权缺失' },
  { value: 'AMOUNT_MISMATCH', label: '金额不一致' },
  { value: 'OVER_SETTLEMENT', label: '超额结算' },
]

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-')

const CardReconcileDiffPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [params, setParams] = useState<QueryParams>(defaultParams)
  const [resolveState, setResolveState] = useState<{ open: boolean; id?: string }>({ open: false })
  const [note, setNote] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['card-reconcile-diffs', params],
    queryFn: () => cardService.getReconcileDiffs(params),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, noteText }: { id: string; noteText: string }) => cardService.resolveReconcileDiff(id, noteText),
    onSuccess: async () => {
      setResolveState({ open: false })
      setNote('')
      await queryClient.invalidateQueries({ queryKey: ['card-reconcile-diffs'] })
    },
  })

  const items: CardReconcileDiff[] = (data as any)?.data?.items || []
  const total = (data as any)?.data?.total || 0

  const summary = useMemo(() => {
    const openCount = items.filter((item) => item.status === 'OPEN').length
    const resolvedCount = items.filter((item) => item.status === 'RESOLVED').length
    const authMissing = items.filter((item) => item.diff_type === 'AUTH_MISSING').length
    const amountMismatch = items.filter((item) => item.diff_type === 'AMOUNT_MISMATCH').length
    return { openCount, resolvedCount, authMissing, amountMismatch }
  }, [items])

  const updateParams = (patch: Partial<QueryParams>) => {
    setParams((prev) => ({ ...prev, ...patch }))
  }

  const columns = [
    {
      title: '外部交易ID',
      dataIndex: 'external_transaction_id',
      width: 220,
      render: (value: string) =>
        value ? (
          <Typography.Text copyable={{ text: value }} className="font-mono text-xs">
            {value}
          </Typography.Text>
        ) : '-',
    },
    {
      title: '差异类型',
      dataIndex: 'diff_type',
      width: 190,
      render: (value: string) => {
        const meta = getReconcileDiffTypeMeta(value)
        return (
          <div className="space-y-1">
            <div>{renderMappedTag(meta.label, meta.color, value)}</div>
            <div className="text-xs text-slate-500">{meta.desc}</div>
          </div>
        )
      },
    },
    { title: '期望金额', dataIndex: 'expected_amount', width: 130, render: (value: string, row: CardReconcileDiff) => `${row.currency} ${value}` },
    { title: '实际金额', dataIndex: 'actual_amount', width: 130, render: (value: string, row: CardReconcileDiff) => `${row.currency} ${value}` },
    {
      title: '状态',
      dataIndex: 'status',
      width: 180,
      render: (value: string) => {
        const meta = getReconcileDiffStatusMeta(value)
        return (
          <div className="space-y-1">
            <div>{renderMappedTag(meta.label, meta.color, value)}</div>
            <div className="text-xs text-slate-500">{meta.desc}</div>
          </div>
        )
      },
    },
    { title: '处理说明', dataIndex: 'resolution_note', width: 220, render: (value: string) => value || '-' },
    { title: '创建时间', dataIndex: 'created_at', width: 180, render: (value: string) => formatDateTime(value) },
    { title: '解决时间', dataIndex: 'resolved_at', width: 180, render: (value: string) => formatDateTime(value) },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, row: CardReconcileDiff) => (
        <Space>
          <Button disabled={row.status === 'RESOLVED'} onClick={() => setResolveState({ open: true, id: row.id })}>
            标记已处理
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#172554_55%,#1d4ed8_100%)] text-white shadow-[0_24px_56px_rgba(30,64,175,0.24)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_260px]">
          <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_100%)] px-4 py-2 xl:border-b-0 xl:border-r">
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-300">Reconciliation Diff Queue</div>
            <div className="mt-1 text-[22px] font-semibold tracking-tight text-white">卡对账差异</div>
            <div className="mt-1 text-xs leading-4 text-slate-200">
              集中处理授权缺失、金额不一致和超额结算异常，优先定位仍在开放状态的差异记录。
            </div>
            <div className="mt-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
                className="h-8 rounded-full border-white/15 bg-white/10 px-3 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
              >
                刷新差异
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            {[
              { label: '待处理', value: summary.openCount, helper: 'OPEN 状态', icon: <AlertOutlined className="text-amber-200" /> },
              { label: '已解决', value: summary.resolvedCount, helper: 'RESOLVED 状态', icon: <CheckCircleOutlined className="text-emerald-200" /> },
              { label: '授权缺失', value: summary.authMissing, helper: 'AUTH_MISSING', icon: <IssuesCloseOutlined className="text-sky-200" /> },
              {
                label: '金额不一致',
                value: summary.amountMismatch,
                helper: 'AMOUNT_MISMATCH',
                icon: <IssuesCloseOutlined className="text-blue-100" />,
              },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`flex min-h-[104px] flex-col justify-between px-4 py-3 border-white/10 ${
                  index < 2 ? 'border-b lg:border-b-0' : ''
                } ${index < 3 ? 'lg:border-r' : ''} ${index % 2 === 0 ? 'border-r lg:border-r' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</div>
                  <div>{item.icon}</div>
                </div>
                <div className="py-1 text-2xl font-semibold tracking-tight text-white">{item.value}</div>
                <div className="text-xs text-slate-200">{item.helper}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] px-4 py-3 xl:border-l xl:border-t-0">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-300">风险摘要</div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-white">{summary.openCount}</div>
            <div className="mt-1 text-xs text-slate-200">待处理差异需要优先清理，避免对账长期堆积。</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-xs text-slate-300">已解决占比</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {total > 0 ? `${Math.round((summary.resolvedCount / total) * 100)}%` : '0%'}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-xs text-slate-300">重点关注</div>
                <div className="mt-1 text-sm font-semibold text-white">授权缺失 / 金额不一致</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5">
        <Card
          bordered={false}
          className="rounded-[28px] border border-slate-200 bg-transparent shadow-none"
          bodyStyle={{ padding: 8 }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-500">筛选工作区</div>
              <div className="mt-1 text-base font-semibold tracking-tight text-slate-900">异常定位面板</div>
            </div>
            <Tag color="blue" className="rounded-full px-3 py-1">差异队列</Tag>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.1fr)_200px_220px_auto]">
            <div>
              <div className="mb-1 text-xs uppercase tracking-[0.16em] text-slate-400">检索条件</div>
              <Input.Search
                allowClear
                placeholder="搜索交易号或差异类型"
                onSearch={(search) => updateParams({ page: 1, search })}
              />
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-[0.16em] text-slate-400">差异状态</div>
              <Select
                allowClear
                placeholder="差异状态"
                options={statusOptions}
                className="w-full"
                onChange={(status) => updateParams({ page: 1, status: status || '' })}
              />
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-[0.16em] text-slate-400">差异类型</div>
              <Select
                allowClear
                placeholder="差异类型"
                options={diffTypeOptions}
                className="w-full"
                onChange={(diffType) => updateParams({ page: 1, diffType: diffType || '' })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => setParams(defaultParams)} className="h-8 w-full rounded-full border-slate-200 px-4 text-slate-700 hover:!border-slate-300 hover:!text-slate-900">
                重置筛选
              </Button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <div className="rounded-2xl border border-slate-200 px-3 py-1.5">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">处理顺序</div>
              <div className="mt-1 text-xs text-slate-600">优先处理 `待处理` 且金额不一致、超额结算的记录。</div>
            </div>
            <div className="rounded-2xl border border-slate-200 px-3 py-1.5">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">核对建议</div>
              <div className="mt-1 text-xs text-slate-600">核对时结合外部交易 ID、期望金额、实际金额和处理说明一起判断。</div>
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
            <div className="text-sm font-medium text-slate-500">差异明细</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">对账差异记录</div>
            <div className="mt-2 text-sm text-slate-600">共 {total} 条记录，支持查看差异类型、金额偏差、状态和处理说明。</div>
          </div>
        </div>

        <Table<CardReconcileDiff>
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

      <Modal
        title="处理对账差异"
        open={resolveState.open}
        onCancel={() => setResolveState({ open: false })}
        onOk={() => {
          if (!resolveState.id) return
          resolveMutation.mutate({ id: resolveState.id, noteText: note })
        }}
        confirmLoading={resolveMutation.isPending}
      >
        <Input.TextArea
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="填写处理说明，例如已人工补单、已核对属卡商重复通知等"
        />
      </Modal>
    </div>
  )
}

export default CardReconcileDiffPage
