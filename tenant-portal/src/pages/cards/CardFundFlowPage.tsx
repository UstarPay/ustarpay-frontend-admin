import React, { useState } from 'react'
import { Card, Input, Select, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { FundFlowRecord } from '@/services/fundFlowService'

const directionMap: Record<number, { text: string; color: string }> = {
  1: { text: '入账', color: 'success' },
  2: { text: '出账', color: 'error' },
}

const CardFundFlowPage: React.FC = () => {
  const [params, setParams] = useState({
    page: 1,
    pageSize: 20,
    search: '',
    changeType: '',
    status: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['card-fund-flows', params],
    queryFn: () => cardService.getCardFundFlows(params),
  })

  const items: FundFlowRecord[] = (data as any)?.data?.items || []
  const pagination = (data as any)?.data?.pagination
  const total = pagination?.total || 0

  return (
    <div className="space-y-6">
      <Card bordered={false} className="rounded-[28px] border border-sky-100 bg-white shadow-sm">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-500">Tenant Fund Flow Ledger</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">卡资金总账</div>
          <div className="mt-2 text-sm text-slate-500">这里展示 `tenant_fund_flow_records` 里属于卡消费场景的总账记录。</div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <Input.Search
            allowClear
            placeholder="搜索参考号、业务号或备注"
            className="w-full lg:w-[320px]"
            onSearch={(search) => setParams((prev) => ({ ...prev, page: 1, search }))}
          />
          <Select
            allowClear
            placeholder="变动类型"
            className="w-full lg:w-[200px]"
            options={[
              { value: 'card_consume_auth', label: '授权冻结' },
              { value: 'card_consume_release', label: '差额释放' },
              { value: 'card_consume_adjust', label: '超额补扣' },
            ]}
            onChange={(changeType) => setParams((prev) => ({ ...prev, page: 1, changeType: changeType || '' }))}
          />
          <Select
            allowClear
            placeholder="状态"
            className="w-full lg:w-[160px]"
            options={[
              { value: '1', label: '成功' },
              { value: '2', label: '冲正' },
            ]}
            onChange={(status) => setParams((prev) => ({ ...prev, page: 1, status: status || '' }))}
          />
        </div>
      </Card>

      <Card bordered={false} className="rounded-[28px] border border-sky-100 bg-white shadow-sm">
        <Table<FundFlowRecord>
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          scroll={{ x: 1500 }}
          columns={[
            { title: '变动类型', dataIndex: 'changeType', width: 160 },
            { title: '方向', dataIndex: 'direction', width: 90, render: (v) => <Tag color={directionMap[v]?.color || 'default'}>{directionMap[v]?.text || v}</Tag> },
            { title: '金额', dataIndex: 'amount', width: 130, render: (v, row) => `${row.symbol} ${v}` },
            { title: '余额前', dataIndex: 'balanceBefore', width: 120 },
            { title: '余额后', dataIndex: 'balanceAfter', width: 120 },
            { title: '冻结前', dataIndex: 'frozenBefore', width: 120 },
            { title: '冻结后', dataIndex: 'frozenAfter', width: 120 },
            { title: '参考ID', dataIndex: 'referenceId', width: 180 },
            { title: '业务号', dataIndex: 'businessId', width: 180, render: (v) => v || '-' },
            { title: '备注', dataIndex: 'remark', width: 180, render: (v) => v || '-' },
            { title: '时间', dataIndex: 'occurredAt', width: 180, render: (v) => (v ? new Date(v).toLocaleString('zh-CN') : '-') },
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

export default CardFundFlowPage
