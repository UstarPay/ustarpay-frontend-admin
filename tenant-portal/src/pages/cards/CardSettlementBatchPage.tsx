import React, { useState } from 'react'
import { Card, Input, Progress, Select, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardSettlementBatch } from '@shared/types'

const CardSettlementBatchPage: React.FC = () => {
  const [params, setParams] = useState({
    page: 1,
    pageSize: 20,
    search: '',
    status: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['card-settlement-batches', params],
    queryFn: () => cardService.getSettlementBatches(params),
  })

  const items: CardSettlementBatch[] = (data as any)?.data?.items || []
  const total = (data as any)?.data?.total || 0

  return (
    <div className="space-y-6">
      <Card bordered={false} className="rounded-[28px] border border-sky-100 bg-white shadow-sm">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-500">Settlement Batch Control</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">结算批次</div>
          <div className="mt-2 text-sm text-slate-500">按批次查看卡商结算进度、匹配结果和差异数量。</div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input.Search
            allowClear
            placeholder="搜索批次号"
            className="w-full lg:w-[320px]"
            onSearch={(search) => setParams((prev) => ({ ...prev, page: 1, search }))}
          />
          <Select
            allowClear
            placeholder="批次状态"
            className="w-full lg:w-[180px]"
            options={[
              { value: 'PENDING', label: '处理中' },
              { value: 'PROCESSED', label: '已处理' },
            ]}
            onChange={(status) => setParams((prev) => ({ ...prev, page: 1, status: status || '' }))}
          />
        </div>
      </Card>

      <Card bordered={false} className="rounded-[28px] border border-sky-100 bg-white shadow-sm">
        <Table<CardSettlementBatch>
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          columns={[
            { title: '批次号', dataIndex: 'batch_id', width: 220 },
            { title: '渠道', dataIndex: 'provider', width: 100 },
            { title: '状态', dataIndex: 'status', width: 120, render: (v) => <Tag color={v === 'PROCESSED' ? 'success' : 'processing'}>{v}</Tag> },
            { title: '币种', dataIndex: 'currency', width: 90 },
            { title: '笔数', dataIndex: 'total_count', width: 90 },
            { title: '总金额', dataIndex: 'total_amount', width: 120 },
            {
              title: '匹配进度',
              key: 'matched',
              width: 220,
              render: (_, row) => {
                const totalCount = row.total_count || 0
                const matched = row.matched_count || 0
                const percent = totalCount > 0 ? Math.round((matched / totalCount) * 100) : 0
                return <Progress percent={percent} size="small" status={row.diff_count > 0 ? 'exception' : 'success'} />
              },
            },
            { title: '差异数', dataIndex: 'diff_count', width: 100 },
            { title: '最后结算时间', dataIndex: 'last_settled_at', width: 180, render: (v) => (v ? new Date(v).toLocaleString('zh-CN') : '-') },
            { title: '更新时间', dataIndex: 'updated_at', width: 180, render: (v) => (v ? new Date(v).toLocaleString('zh-CN') : '-') },
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

export default CardSettlementBatchPage
