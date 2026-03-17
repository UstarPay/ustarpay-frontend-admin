import React, { useMemo, useState } from 'react'
import { Card, Progress, Tag } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  ExclamationCircleOutlined,
  IdcardOutlined,
  ReloadOutlined,
  UserOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cardFundAccountService } from '@/services'
import type { CardFundAccount, CardFundAccountQueryParams, CardFundAccountStats } from '@shared/types'
import { SearchTable } from '@shared/components'
import type { SearchField, TableColumn } from '@shared/components/SearchTable'

const formatAmount = (value: string) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return value || '0'
  }
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const statusColorMap: Record<number, string> = {
  0: 'default',
  1: 'orange',
  2: 'gold',
  3: 'processing',
  4: 'green',
  5: 'red'
}

const statusAccentMap: Record<number, string> = {
  0: 'bg-slate-400',
  1: 'bg-orange-400',
  2: 'bg-amber-400',
  3: 'bg-sky-500',
  4: 'bg-emerald-500',
  5: 'bg-rose-500'
}

const CardFundAccountListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useState<CardFundAccountQueryParams>({
    page: 1,
    pageSize: 20
  })

  const { data: response, isLoading } = useQuery({
    queryKey: ['card-fund-accounts', searchParams],
    queryFn: () => cardFundAccountService.getCardFundAccounts(searchParams)
  })
  const { data: statsResponse } = useQuery({
    queryKey: ['card-fund-accounts', 'stats'],
    queryFn: () => cardFundAccountService.getCardFundAccountStats()
  })

  const accounts = ((response?.data?.items || []) as CardFundAccount[])
  const pagination = {
    current: response?.data?.page || searchParams.page || 1,
    pageSize: response?.data?.pageSize || searchParams.pageSize || 20,
    total: response?.data?.total || 0
  }

  const fallbackStats = useMemo<CardFundAccountStats>(() => ({
    totalAccounts: response?.data?.total || accounts.length,
    activeAccounts: accounts.filter(item => item.status === 4).length,
    virtualAccounts: accounts.filter(item => item.cardType === 1).length,
    physicalAccounts: accounts.filter(item => item.cardType === 2).length,
    totalBalance: String(accounts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0))
  }), [accounts, response?.data?.total])

  const stats = (statsResponse?.data || fallbackStats) as CardFundAccountStats
  const latestUpdatedAt = accounts.length > 0
    ? accounts.map(item => item.updatedAt).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    : ''

  const uniqueUsers = new Set(accounts.map(item => item.userId)).size
  const pendingAccounts = accounts.filter(item => item.status === 3).length
  const exceptionAccounts = accounts.filter(item => item.status === 2 || item.status === 5).length
  const activeRate = stats.totalAccounts > 0 ? Math.round((stats.activeAccounts / stats.totalAccounts) * 100) : 0
  const virtualRate = stats.totalAccounts > 0 ? Math.round((stats.virtualAccounts / stats.totalAccounts) * 100) : 0

  const activeFilterTags = [
    searchParams.userId ? `UID: ${searchParams.userId}` : '',
    searchParams.cardType === 1 ? '卡类型: 虚拟卡' : '',
    searchParams.cardType === 2 ? '卡类型: 实体卡' : '',
    searchParams.status !== undefined ? `状态: ${accounts.find(item => item.status === searchParams.status)?.statusName || String(searchParams.status)}` : ''
  ].filter(Boolean)

  const searchFields: SearchField[] = [
    {
      key: 'userId',
      label: '用户UID',
      type: 'text',
      placeholder: '请输入用户UID',
      span: 6
    },
    {
      key: 'cardType',
      label: '卡类型',
      type: 'select',
      span: 4,
      minWidth: 148,
      options: [
        { label: '全部', value: '' },
        { label: '虚拟卡', value: 1, color: 'blue' },
        { label: '实体卡', value: 2, color: 'purple' }
      ]
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      span: 4,
      minWidth: 156,
      options: [
        { label: '全部', value: '' },
        { label: '作废', value: 0, color: 'default' },
        { label: '已过期', value: 1, color: 'orange' },
        { label: '冻结', value: 2, color: 'gold' },
        { label: '待激活', value: 3, color: 'processing' },
        { label: '正常', value: 4, color: 'green' },
        { label: '异常', value: 5, color: 'red' }
      ]
    }
  ]

  const columns: TableColumn[] = [
    {
      key: 'userProfile',
      title: '持卡用户',
      width: 230,
      render: (_: unknown, record: CardFundAccount) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserOutlined className="text-slate-400" />
            <span>{record.userName || '未命名用户'}</span>
          </div>
          <div className="text-xs text-slate-500">UID: {record.userId}</div>
          <div className="text-xs text-slate-500">{record.userEmail || record.userPhone || '-'}</div>
        </div>
      )
    },
    {
      key: 'cardInfo',
      title: '卡账户档案',
      width: 260,
      render: (_: unknown, record: CardFundAccount) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CreditCardOutlined className="text-fuchsia-500" />
            <span>{record.cardTypeName}</span>
          </div>
          <div className="font-mono text-xs text-slate-500">Card ID: {record.cardId}</div>
          <div className="flex items-center gap-2">
            <Tag color={record.cardType === 1 ? 'blue' : 'purple'} className="rounded-full px-2 py-0.5 text-[11px]">
              {record.cardTypeName}
            </Tag>
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${statusAccentMap[record.status] || 'bg-slate-400'}`} />
            <span className="text-xs text-slate-500">{record.statusName}</span>
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      title: '账户额度',
      dataIndex: 'amount',
      width: 160,
      render: (value: string) => (
        <div>
          <div className="text-base font-semibold text-emerald-600">{formatAmount(value)} USD</div>
          <div className="mt-1 text-xs text-slate-400">卡消费资金池</div>
        </div>
      )
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'statusName',
      width: 110,
      render: (value: string, record: CardFundAccount) => (
        <Tag color={statusColorMap[record.status] || 'default'} className="rounded-full px-3 py-1 text-xs font-medium">
          {value}
        </Tag>
      )
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN')
    }
  ]

  const handleSearch = (values: Record<string, unknown>) => {
    setSearchParams({
      page: 1,
      pageSize: searchParams.pageSize || 20,
      userId: values.userId ? String(values.userId) : undefined,
      cardType: values.cardType !== '' && values.cardType !== undefined ? Number(values.cardType) : undefined,
      status: values.status !== '' && values.status !== undefined ? Number(values.status) : undefined
    })
  }

  const handleReset = () => {
    setSearchParams({
      page: 1,
      pageSize: 20
    })
  }

  return (
    <div className="space-y-6 pb-2">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border border-[rgba(30,64,175,0.10)] bg-[linear-gradient(130deg,rgba(15,23,42,0.96)_0%,rgba(30,64,175,0.95)_38%,rgba(8,47,73,0.94)_100%)] shadow-[0_24px_70px_rgba(30,64,175,0.18)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6">
          <div className="absolute right-[-40px] top-[-32px] h-32 w-32 rounded-full bg-sky-400/25 blur-3xl" />
          <div className="absolute bottom-[-48px] left-[32%] h-32 w-32 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] uppercase tracking-[0.34em] text-[#dbeafe]">Card Capital Console</div>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  卡账户列表
                </div>
                <div className="mt-3 text-sm leading-6 text-[#eff6ff]/90">
                  聚焦用户卡额度、活跃度与异常状态分布。
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:min-w-[320px]">
                <div className="rounded-[20px] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.20)_0%,rgba(219,234,254,0.14)_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <div className="flex items-center justify-between text-[#dbeafe]">
                    <span className="text-xs uppercase tracking-[0.18em]">总额度</span>
                    <WalletOutlined className="text-[#dbeafe]" />
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">{formatAmount(stats.totalBalance)}</div>
                  <div className="text-xs text-[#dbeafe]">USD</div>
                </div>
                <div className="rounded-[20px] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.20)_0%,rgba(219,234,254,0.14)_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <div className="flex items-center justify-between text-[#dbeafe]">
                    <span className="text-xs uppercase tracking-[0.18em]">正常占比</span>
                    <CheckCircleOutlined className="text-[#dbeafe]" />
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">{activeRate}%</div>
                  <div className="text-xs text-[#dbeafe]">{stats.activeAccounts} / {stats.totalAccounts}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_72%,#dbeafe_100%)] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">卡类型结构</div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{virtualRate}% 虚拟卡</div>
                  </div>
                  <div className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-medium text-sky-700">
                    最近刷新 {latestUpdatedAt ? new Date(latestUpdatedAt).toLocaleDateString('zh-CN') : '暂无'}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-2"><CreditCardOutlined />虚拟卡</span>
                      <span>{stats.virtualAccounts}</span>
                    </div>
                    <Progress percent={virtualRate} showInfo={false} strokeColor="#64748b" trailColor="#e2e8f0" />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-2"><IdcardOutlined />实体卡</span>
                      <span>{stats.physicalAccounts}</span>
                    </div>
                    <Progress percent={Math.max(0, 100 - virtualRate)} showInfo={false} strokeColor="#94a3b8" trailColor="#e2e8f0" />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_72%,#dbeafe_100%)] px-5 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">运营关注</div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-sky-100 bg-[#eff6ff] px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">待激活</span>
                      <ClockCircleOutlined className="text-sky-600" />
                    </div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{pendingAccounts}</div>
                  </div>
                  <div className="rounded-2xl border border-cyan-100 bg-[#ecfeff] px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">异常/冻结</span>
                      <ExclamationCircleOutlined className="text-rose-600" />
                    </div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{exceptionAccounts}</div>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-[#eff6ff] px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">覆盖用户</span>
                      <UserOutlined className="text-slate-600" />
                    </div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{uniqueUsers}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {activeFilterTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilterTags.map(tag => (
            <Tag key={tag} color="processing" className="rounded-full px-3 py-1 text-xs">
              {tag}
            </Tag>
          ))}
        </div>
      )}

      <SearchTable
        title="卡账户列表"
        searchFields={searchFields}
        onSearch={handleSearch}
        onReset={handleReset}
        columns={columns}
        dataSource={accounts}
        loading={isLoading}
        className="rounded-[28px]"
        searchCardClassName="border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(239,246,255,0.92)_100%)] shadow-sm"
        tableCardClassName="border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(239,246,255,0.92)_72%,rgba(219,234,254,0.90)_100%)] shadow-sm"
        serverSidePagination
        pagination={pagination}
        onTableChange={(nextPagination) => {
          setSearchParams(prev => ({
            ...prev,
            page: nextPagination.current,
            pageSize: nextPagination.pageSize
          }))
        }}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['card-fund-accounts'] })}
      />
    </div>
  )
}

export default CardFundAccountListPage
