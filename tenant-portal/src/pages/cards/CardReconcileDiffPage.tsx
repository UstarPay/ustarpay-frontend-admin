import React, { useState } from 'react'
import { Button, Card, Input, Modal, Select, Space, Table, Tag } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardReconcileDiff } from '@shared/types'

const CardReconcileDiffPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [params, setParams] = useState({
    page: 1,
    pageSize: 20,
    search: '',
    status: '',
    diffType: '',
  })
  const [resolveState, setResolveState] = useState<{ open: boolean; id?: string }>({ open: false })
  const [note, setNote] = useState('')

  const { data, isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <Card bordered={false} className="rounded-[28px] border border-sky-100 bg-white shadow-sm">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-500">Reconciliation Diff Queue</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">对账差异</div>
          <div className="mt-2 text-sm text-slate-500">集中处理授权缺失、金额不一致和超额结算等异常。</div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input.Search
            allowClear
            placeholder="搜索交易号或差异类型"
            className="w-full lg:w-[320px]"
            onSearch={(search) => setParams((prev) => ({ ...prev, page: 1, search }))}
          />
          <Select
            allowClear
            placeholder="差异状态"
            className="w-full lg:w-[180px]"
            options={[
              { value: 'OPEN', label: '待处理' },
              { value: 'RESOLVED', label: '已解决' },
            ]}
            onChange={(status) => setParams((prev) => ({ ...prev, page: 1, status: status || '' }))}
          />
          <Select
            allowClear
            placeholder="差异类型"
            className="w-full lg:w-[220px]"
            options={[
              { value: 'AUTH_MISSING', label: '授权缺失' },
              { value: 'AMOUNT_MISMATCH', label: '金额不一致' },
              { value: 'OVER_SETTLEMENT', label: '超额结算' },
            ]}
            onChange={(diffType) => setParams((prev) => ({ ...prev, page: 1, diffType: diffType || '' }))}
          />
        </div>
      </Card>

      <Card bordered={false} className="rounded-[28px] border border-sky-100 bg-white shadow-sm">
        <Table<CardReconcileDiff>
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          scroll={{ x: 1320 }}
          columns={[
            { title: '外部交易ID', dataIndex: 'external_transaction_id', width: 200 },
            { title: '差异类型', dataIndex: 'diff_type', width: 160, render: (v) => <Tag color={v === 'AUTH_MISSING' ? 'volcano' : 'gold'}>{v}</Tag> },
            { title: '期望金额', dataIndex: 'expected_amount', width: 120, render: (v, row) => `${row.currency} ${v}` },
            { title: '实际金额', dataIndex: 'actual_amount', width: 120, render: (v, row) => `${row.currency} ${v}` },
            { title: '状态', dataIndex: 'status', width: 120, render: (v) => <Tag color={v === 'RESOLVED' ? 'success' : 'error'}>{v}</Tag> },
            { title: '处理说明', dataIndex: 'resolution_note', width: 200, render: (v) => v || '-' },
            { title: '创建时间', dataIndex: 'created_at', width: 180, render: (v) => (v ? new Date(v).toLocaleString('zh-CN') : '-') },
            { title: '解决时间', dataIndex: 'resolved_at', width: 180, render: (v) => (v ? new Date(v).toLocaleString('zh-CN') : '-') },
            {
              title: '操作',
              key: 'action',
              width: 140,
              render: (_, row) => (
                <Space>
                  <Button disabled={row.status === 'RESOLVED'} onClick={() => setResolveState({ open: true, id: row.id })}>
                    标记已处理
                  </Button>
                </Space>
              ),
            },
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
        <Input.TextArea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="填写处理说明，例如已人工补单、已核对属卡商重复通知等" />
      </Modal>
    </div>
  )
}

export default CardReconcileDiffPage
