import React, { useState } from 'react'
import { Button, Space, Typography, Tag, Input, Table } from 'antd'
import { CreditCardOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardRecord } from '@shared/types'
import { PageHeaderCard, StatCard } from '@shared/components'
import { CardFeeConfigModal } from './components/CardFeeConfigModal'

const CardListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useState({
    page: 1,
    pageSize: 20,
    search: ''
  })
  const [feeConfigVisible, setFeeConfigVisible] = useState(false)

  const { data: cardData, isLoading, refetch } = useQuery({
    queryKey: ['cards', searchParams],
    queryFn: () => cardService.getCards(searchParams)
  })

  const { data: feeConfig } = useQuery({
    queryKey: ['card-fee-config'],
    queryFn: () => cardService.getFeeConfig()
  })

  const cards = (cardData as any)?.data?.items || []
  const total = (cardData as any)?.data?.total ?? 0

  const cardMaterialMap: Record<number, string> = {
    1: '虚拟卡',
    2: '实体卡'
  }

  const columns = [
    {
      title: '外部卡ID',
      dataIndex: 'external_card_id',
      key: 'external_card_id',
      width: 140,
      render: (v: string, r: CardRecord) => (
        <Typography.Text copyable={{ text: v }} className="font-mono text-xs">
          {v?.slice(0, 12)}...
        </Typography.Text>
      )
    },
    {
      title: '参考号',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 140,
      ellipsis: true
    },
    {
      title: '卡商名称',
      dataIndex: 'merchant_name',
      key: 'merchant_name',
      width: 120,
      ellipsis: true,
      render: (v: string) => v || '-'
    },
    {
      title: '卡类型',
      dataIndex: 'card_material',
      key: 'card_material',
      width: 90,
      render: (v: number) => (v ? cardMaterialMap[v] || `未知(${v})` : '-')
    },
    {
      title: '卡号后四位',
      dataIndex: 'card_number_last4',
      key: 'card_number_last4',
      width: 100,
      render: (v: string) => v || '-'
    },
    {
      title: '有效期',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 90,
      render: (v: string) => v || '-'
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 100,
      render: (v: string, r: CardRecord) => `${r.currency || 'USD'} ${v || '0.00'}`
    },
    {
      title: '待结算',
      dataIndex: 'pending_balance',
      key: 'pending_balance',
      width: 100,
      render: (v: string, r: CardRecord) => `${r.currency || 'USD'} ${v || '0.00'}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: number) => (
        <Tag color={v === 1 ? 'success' : v === 0 ? 'processing' : 'default'}>
          {v === 0 ? '待激活' : v === 1 ? '已激活' : `状态${v}`}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => (v ? new Date(v).toLocaleString('zh-CN') : '-')
    }
  ]

  const virtualFee = feeConfig?.defaultVirtualCardFee ?? '--'
  const physicalFee = feeConfig?.defaultPhysicalCardFee ?? '--'
  const deductAccount = feeConfig?.deductSymbol || feeConfig?.deductAccountId || '未配置'

  return (
    <div className="space-y-6">
      <PageHeaderCard
        title="卡片列表"
        logoText="💳"
        gradientColors={['#1890ff', '#40a9ff', '#69c0ff', '#91d5ff']}
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => setFeeConfigVisible(true)}
            >
              开卡费用配置
            </Button>
          </Space>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="资金支出账户"
          value={deductAccount || '未配置'}
          icon={<CreditCardOutlined />}
          showThousandsSeparator={false}
          topStripColor="bg-amber-500"
          iconColor="text-amber-600"
        />
        <StatCard
          title="虚拟卡开卡费"
          value={virtualFee}
          icon={<CreditCardOutlined />}
          prefix="$"
          showThousandsSeparator={false}
          topStripColor="bg-blue-500"
          iconColor="text-blue-600"
        />
        <StatCard
          title="实体卡开卡费"
          value={physicalFee}
          icon={<CreditCardOutlined />}
          prefix="$"
          showThousandsSeparator={false}
          topStripColor="bg-green-500"
          iconColor="text-green-600"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">卡记录列表</h3>
          <Space>
            <Input.Search
              placeholder="搜索外部卡ID或参考号"
              allowClear
              onSearch={(val) => setSearchParams((p) => ({ ...p, page: 1, search: val || '' }))}
              style={{ width: 260 }}
            />
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={cards}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) =>
              setSearchParams((p) => ({ ...p, page, pageSize: pageSize || 20 }))
          }}
        />
      </div>

      <CardFeeConfigModal
        visible={feeConfigVisible}
        onClose={() => setFeeConfigVisible(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['card-fee-config'] })
        }}
      />
    </div>
  )
}

export default CardListPage
