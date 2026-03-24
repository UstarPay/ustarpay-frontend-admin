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
import { getCardStatusMeta } from './cardDisplay'
import { StatCard } from '@shared/components'
import { CardFeeConfigModal } from './components/CardFeeConfigModal'

function formatExpiryDate(value?: string) {
  const raw = value?.trim()
  if (!raw) {
    return '-'
  }

  const monthYearMatch = raw.match(/^(\d{2})\/(\d{2})$/)
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch
    return `${month}/20${year}`
  }

  const fullMonthYearMatch = raw.match(/^(\d{2})\/(\d{4})$/)
  if (fullMonthYearMatch) {
    const [, month, year] = fullMonthYearMatch
    return `${month}/${year}`
  }

  const isoMonthMatch = raw.match(/^(\d{4})-(\d{2})$/)
  if (isoMonthMatch) {
    const [, year, month] = isoMonthMatch
    return `${month}/${year}`
  }

  const compactYearMonthMatch = raw.match(/^(\d{4})(\d{2})$/)
  if (compactYearMonthMatch) {
    const [, year, month] = compactYearMonthMatch
    return `${month}/${year}`
  }

  return raw
}

function formatDateOnly(value?: string) {
  const raw = value?.trim()
  if (!raw) {
    return '-'
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return raw
  }

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

function formatCardExpiryDate(value?: string, createdAt?: string) {
  const created = createdAt ? new Date(createdAt) : null
  if (created && !Number.isNaN(created.getTime())) {
    const expiry = new Date(created)
    expiry.setFullYear(expiry.getFullYear() + 3)
    return formatDateOnly(expiry.toISOString())
  }

  return formatExpiryDate(value)
}

const internalCardMaterialMap: Record<number, string> = {
  1: '虚拟卡',
  2: '实体卡',
}

const providerCardMaterialMap: Record<number, string> = {
  2: '金属卡',
  3: '塑料卡',
}

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
  const pendingCards = useMemo(() => cards.filter((item: CardRecord) => item.status === 99).length, [cards])
  const frozenCards = useMemo(() => cards.filter((item: CardRecord) => item.status === 2).length, [cards])
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

  const columns = [
    {
      title: '外部卡ID',
      dataIndex: 'external_card_id',
      key: 'external_card_id',
      width: 220,
      render: (v: string) => (
        <Typography.Text copyable={{ text: v }} className="font-mono text-xs">
          {v || '-'}
        </Typography.Text>
      )
    },
    {
      title: '参考号',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 180,
      render: (v: string) =>
        v ? (
          <Typography.Text copyable={{ text: v }} className="font-mono text-xs">
            {v}
          </Typography.Text>
        ) : '-'
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
      width: 140,
      render: (v: number, record: CardRecord) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900">{v ? internalCardMaterialMap[v] || `未知(${v})` : '-'}</div>
          <div className="text-xs text-slate-500">
            上游: {record.provider_card_material ? providerCardMaterialMap[record.provider_card_material] || `枚举${record.provider_card_material}` : '-'}
          </div>
        </div>
      )
    },
    {
      title: '持卡信息',
      key: 'holder_info',
      width: 180,
      render: (_: unknown, record: CardRecord) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900">{record.cardholder_name || '-'}</div>
          <div className="text-xs text-slate-500">{record.preferred_printed_name || '无印刷名'}</div>
        </div>
      )
    },
    {
      title: '完整卡号',
      dataIndex: 'card_number',
      key: 'card_number',
      width: 180,
      render: (v: string, record: CardRecord) => {
        const value = v || record.card_number_last4 || '-'
        return value === '-' ? (
          value
        ) : (
          <Typography.Text copyable={{ text: value }} className="font-mono text-xs">
            {value}
          </Typography.Text>
        )
      }
    },
    {
      title: '有效期',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 120,
      render: (v: string, record: CardRecord) => formatCardExpiryDate(v, record.created_at)
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
      width: 140,
      render: (v: number, record: CardRecord) => {
        const meta = getCardStatusMeta(v, record.status_desc, record.card_material)
        return (
          <div className="space-y-1">
            <Tag color={meta.color}>{meta.label}</Tag>
            <div className="text-xs text-slate-500">{meta.helper}</div>
          </div>
        )
      }
    },
    {
      title: '额度 / 功能',
      key: 'limits',
      width: 210,
      render: (_: unknown, record: CardRecord) => (
        <div className="space-y-1 text-xs text-slate-600">
          <div>单笔: {record.transaction_limit ? `${record.currency || 'USD'} ${record.transaction_limit}` : '-'}</div>
          <div>月限: {record.monthly_limit ? `${record.currency || 'USD'} ${record.monthly_limit}` : '-'}</div>
          <div>PIN {record.pin_enabled ? '开' : '关'} / 自动扣款 {record.auto_debit_enabled ? '开' : '关'} / 限额 {record.card_limit_enabled ? '开' : '关'}</div>
        </div>
      )
    },
    {
      title: '上游快照',
      key: 'provider_snapshot',
      width: 200,
      render: (_: unknown, record: CardRecord) => (
        <div className="space-y-1 text-xs text-slate-600">
          <div>ClientID: {record.provider_client_id || '-'}</div>
          <div>{record.email || '-'}</div>
          <div>{record.mobile_number || '-'}</div>
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => formatDateOnly(v)
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
        className="overflow-hidden rounded-[32px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#172554_55%,#1d4ed8_100%)] text-white shadow-[0_24px_60px_rgba(30,64,175,0.24)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-5 py-2 lg:px-6">
          <div className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,#93c5fd_0%,#dbeafe_100%)]" />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.32em] text-slate-300">Card Asset Ledger</div>
              <div className="mt-1 text-[22px] font-semibold tracking-tight text-white">卡片列表</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-300">总卡量</div>
                  <div className="mt-1 text-[22px] font-semibold leading-none text-white">{total}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-300">实体卡占比</div>
                  <div className="mt-1 text-[22px] font-semibold leading-none">{physicalRatio}%</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading} className="h-8 rounded-full border-white/15 bg-white/10 px-4 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white">
                  刷新卡片
                </Button>
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  onClick={() => setFeeConfigVisible(true)}
                  className="h-8 rounded-full border border-white/15 bg-white/10 px-4 text-white shadow-none hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
                >
                  开卡费用配置
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-300">余额盘点</div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {[
                    { label: '卡片总余额', value: `$${totalBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`, helper: '可用资金沉淀' },
                    { label: '待结算金额', value: `$${pendingBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`, helper: '账务处理中' },
                    { label: '已激活卡片', value: activeCards, helper: '当前可用卡数' },
                    { label: '待审批 / 冻结', value: `${pendingCards} / ${frozenCards}`, helper: '待审批与冻结状态' }
                  ].map(item => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                      <div className="text-xs text-slate-300">{item.label}</div>
                      <div className="mt-1 text-[18px] font-semibold leading-none text-white">{item.value}</div>
                      <div className="mt-1 text-xs text-slate-300">{item.helper}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-300">费用策略</div>
                <div className="mt-2 space-y-2">
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                    <div className="text-xs text-slate-300">资金支出账户</div>
                    <div className="mt-1 break-all text-sm font-semibold text-white">{deductAccount || '未配置'}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                    <div className="text-xs text-slate-300">虚拟卡开卡费</div>
                    <div className="mt-1 text-[18px] font-semibold leading-none text-white">${virtualFee}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                    <div className="text-xs text-slate-300">实体卡开卡费</div>
                    <div className="mt-1 text-[18px] font-semibold leading-none text-white">${physicalFee}</div>
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
              。
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
