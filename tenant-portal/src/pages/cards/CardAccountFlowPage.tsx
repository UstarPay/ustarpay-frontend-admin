import React, { useState } from 'react'
import { Card, Input, Select, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardAccountFlow } from '@shared/types'

const flowColorMap: Record<string, string> = {
  HOLD: 'processing',
  SETTLE: 'success',
  RELEASE: 'gold',
  ADJUST: 'volcano',
  REVERSE: 'default',
}

const CardAccountFlowPage: React.FC = () => {
  const [params, setParams] = useState({
    page: 1,
    pageSize: 20,
    search: '',
    flowType: '',
    currency: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['card-account-flows', params],
    queryFn: () => cardService.getCardAccountFlows(params),
  })

  const items: CardAccountFlow[] = (data as any)?.data?.items || []
  const total = (data as any)?.data?.total || 0

  return (
    <div className="space-y-6">
      <Card bordered={false} className="rounded-[28px] border border-sky-100 bg-white shadow-sm">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-500">Card Account Ledger</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">卡额度流水</div>
          <div className="mt-2 text-sm text-slate-500">查看授权冻结、结算确认、差额释放和补扣过程。</div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input.Search
            allowClear
            placeholder="搜索交易号或卡记录"
            className="w-full lg:w-[320px]"
            onSearch={(search) => setParams((prev) => ({ ...prev, page: 1, search }))}
          />
          <Select
            allowClear
            placeholder="流水类型"
            className="w-full lg:w-[180px]"
            options={[
              { value: 'HOLD', label: '授权冻结' },
              { value: 'SETTLE', label: '结算确认' },
              { value: 'RELEASE', label: '差额释放' },
              { value: 'ADJUST', label: '补扣调整' },
            ]}
            onChange={(flowType) => setParams((prev) => ({ ...prev, page: 1, flowType: flowType || '' }))}
          />
          <Select
            allowClear
            placeholder="币种"
            className="w-full lg:w-[140px]"
            options={[{ value: 'USD', label: 'USD' }]}
            onChange={(currency) => setParams((prev) => ({ ...prev, page: 1, currency: currency || '' }))}
          />
        </div>
      </Card>

      <Card bordered={false} className="rounded-[28px] border border-sky-100 bg-white shadow-sm">
        <Table<CardAccountFlow>
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          scroll={{ x: 1400 }}
          columns={[
            { title: '外部交易ID', dataIndex: 'external_transaction_id', width: 180, render: (v) => v || '-' },
            { title: '流水类型', dataIndex: 'flow_type', width: 120, render: (v) => <Tag color={flowColorMap[v] || 'default'}>{v || '-'}</Tag> },
            { title: '金额', dataIndex: 'amount', width: 120, render: (v, row) => `${row.currency} ${v}` },
            { title: '可用前', dataIndex: 'available_before', width: 120 },
            { title: '可用后', dataIndex: 'available_after', width: 120 },
            { title: '冻结前', dataIndex: 'held_before', width: 120 },
            { title: '冻结后', dataIndex: 'held_after', width: 120 },
            { title: '引用ID', dataIndex: 'reference_id', width: 180, render: (v) => v || '-' },
            { title: '备注', dataIndex: 'remark', width: 180, render: (v) => v || '-' },
            { title: '时间', dataIndex: 'created_at', width: 180, render: (v) => (v ? new Date(v).toLocaleString('zh-CN') : '-') },
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

export default CardAccountFlowPage
