import React, { useMemo, useState } from 'react'
import { Button, Card, Input, Table, Tag, Typography } from 'antd'
import {
  DollarCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cardService } from '@/services'
import type { CardRecord } from '@shared/types'
import { StatCard } from '@shared/components'
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
  const activeCards = useMemo(() => cards.filter((item: CardRecord) => item.status === 1).length, [cards])
  const totalBalance = useMemo(
    () => cards.reduce((sum: number, item: CardRecord) => sum + Number(item.balance || 0), 0),
    [cards]
  )
  const pendingBalance = useMemo(
    () => cards.reduce((sum: number, item: CardRecord) => sum + Number(item.pending_balance || 0), 0),
    [cards]
  )
  const physicalCardCount = useMemo(
    () => cards.filter((item: CardRecord) => item.card_material === 2).length,
    [cards]
  )

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
      render: (v: string) => (
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
      title: '用户名',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120,
      render: (v: string) => v || '-'
    },
    {
      title: '用户邮箱',
      dataIndex: 'user_email',
      key: 'user_email',
      width: 180,
      ellipsis: true,
      render: (v: string) => v || '-'
    },
    {
      title: '用户手机',
      dataIndex: 'user_phone',
      key: 'user_phone',
      width: 130,
      render: (v: string) => v || '-'
    },
    {
      title: '国家',
      dataIndex: 'country_code',
      key: 'country_code',
      width: 80,
      render: (v: string) => v || '-'
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
  const physicalRatio = total > 0 ? Math.round((physicalCardCount / total) * 100) : 0

  return (
    <div className="space-y-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[32px] border border-sky-100 bg-[linear-gradient(135deg,#f7fbff_0%,#edf7fb_44%,#f8fdff_100%)] shadow-[0_24px_60px_rgba(14,116,144,0.10)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-4 lg:px-8">
          <div className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,#0f766e_0%,#0284c7_50%,#67e8f9_100%)]" />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-4 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.32em] text-sky-700/70">Card Asset Ledger</div>
              <div className="mt-2 text-[28px] font-semibold tracking-tight text-slate-900">卡片列表</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-sky-100 bg-[#eff6ff] px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-sky-700/70">总卡量</div>
                  <div className="mt-1 text-[28px] font-semibold leading-none text-slate-900">{total}</div>
                </div>
                <div className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_58%,#0ea5e9_100%)] px-4 py-3 text-white">
                  <div className="text-xs uppercase tracking-[0.16em] text-white/60">实体卡占比</div>
                  <div className="mt-1 text-[28px] font-semibold leading-none">{physicalRatio}%</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading} className="h-9 rounded-full border-sky-200 bg-white px-5 hover:!border-sky-300 hover:!text-sky-700">
                  刷新卡片
                </Button>
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  onClick={() => setFeeConfigVisible(true)}
                  className="h-9 rounded-full bg-sky-700 px-5 shadow-none hover:!bg-sky-800"
                >
                  开卡费用配置
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">余额盘点</div>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  {[
                    { label: '卡片总余额', value: `$${totalBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`, helper: '可用资金沉淀', tone: 'bg-[#eff6ff]' },
                    { label: '待结算金额', value: `$${pendingBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`, helper: '账务处理中', tone: 'bg-[#ecfeff]' },
                    { label: '已激活卡片', value: activeCards, helper: '当前可用卡数', tone: 'bg-[#dbeafe]' }
                  ].map(item => (
                    <div key={item.label} className={`rounded-2xl border border-sky-100 ${item.tone} px-4 py-3`}>
                      <div className="text-xs text-slate-500">{item.label}</div>
                      <div className="mt-1 text-[22px] font-semibold leading-none text-slate-900">{item.value}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.helper}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-sky-700/70">费用策略</div>
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs text-slate-500">资金支出账户</div>
                    <div className="mt-1 break-all text-sm font-semibold text-slate-900">{deductAccount || '未配置'}</div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs text-slate-500">虚拟卡开卡费</div>
                    <div className="mt-1 text-[22px] font-semibold leading-none text-slate-900">${virtualFee}</div>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs text-slate-500">实体卡开卡费</div>
                    <div className="mt-1 text-[22px] font-semibold leading-none text-slate-900">${physicalFee}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="已激活卡片"
          value={activeCards}
          icon={<SafetyCertificateOutlined />}
          topStripColor="bg-cyan-500"
          iconColor="text-cyan-600"
        />
        <StatCard
          title="卡片总余额"
          value={totalBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
          icon={<WalletOutlined />}
          prefix="$"
          showThousandsSeparator={false}
          topStripColor="bg-blue-500"
          iconColor="text-blue-600"
        />
        <StatCard
          title="待结算金额"
          value={pendingBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
          icon={<DollarCircleOutlined />}
          prefix="$"
          showThousandsSeparator={false}
          topStripColor="bg-sky-500"
          iconColor="text-sky-600"
        />
      </div>

      <Card
        bordered={false}
        className="rounded-[30px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbff_100%)] shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <div className="text-sm font-medium text-sky-700">卡资产检索</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">卡记录列表</div>
            <div className="mt-2 text-sm text-slate-600">
              当前结果共 <span className="font-semibold text-slate-900">{total}</span> 张卡，实体卡占比
              <span className="mx-1 font-semibold text-slate-900">
                {physicalRatio}%
              </span>
              ，适合按用户、卡号和参考号排查。
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Input.Search
              placeholder="搜索外部卡ID、参考号或用户ID"
              allowClear
              onSearch={(val) => setSearchParams((p) => ({ ...p, page: 1, search: val || '' }))}
              className="w-full sm:w-[320px]"
            />
            <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-medium text-sky-700">
              余额、费用、卡状态同屏联动
            </div>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={cards}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1600 }}
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
      </Card>

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
