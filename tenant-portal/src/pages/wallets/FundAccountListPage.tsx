import React, { useMemo, useState } from 'react'
import { Card, Tag } from 'antd'
import {
  BankOutlined,
  FieldTimeOutlined,
  FilterOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fundAccountService } from '@/services'
import type { FundAccount, FundAccountQueryParams, FundAccountStats, Status } from '@shared/types'
import { SearchTable } from '@shared/components'
import type { SearchField, TableColumn } from '@shared/components/SearchTable'

const formatAmount = (value: string) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return value || '0'
  }
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  })
}

const FundAccountListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useState<FundAccountQueryParams>({
    page: 1,
    pageSize: 20
  })

  const { data: response, isLoading } = useQuery({
    queryKey: ['fund-accounts', searchParams],
    queryFn: () => fundAccountService.getFundAccounts(searchParams)
  })
  const { data: statsResponse } = useQuery({
    queryKey: ['fund-accounts', 'stats'],
    queryFn: () => fundAccountService.getFundAccountStats()
  })

  const accounts = ((response?.data?.items || []) as FundAccount[])
  const pagination = {
    current: response?.data?.page || searchParams.page || 1,
    pageSize: response?.data?.pageSize || searchParams.pageSize || 20,
    total: response?.data?.total || 0
  }
  const fallbackStats = useMemo<FundAccountStats>(() => ({
    totalAccounts: response?.data?.total || accounts.length,
    activeAccounts: accounts.filter(item => item.status === 1).length,
    totalSymbols: new Set(accounts.map(item => item.symbol)).size,
    totalBalance: String(accounts.reduce((sum, item) => sum + (Number(item.balance) || 0), 0)),
    totalFrozen: String(accounts.reduce((sum, item) => sum + (Number(item.frozenBalance) || 0), 0)),
    totalAvailable: String(accounts.reduce((sum, item) => sum + (Number(item.availableBalance) || 0), 0)),
  }), [accounts, response?.data?.total])
  const stats = (statsResponse?.data || fallbackStats) as FundAccountStats
  const activeFilterTags = [
    searchParams.userId ? `UID: ${searchParams.userId}` : '',
    searchParams.symbol ? `币种: ${searchParams.symbol}` : '',
    searchParams.status !== undefined ? `状态: ${searchParams.status === 1 ? '正常' : '禁用'}` : '',
  ].filter(Boolean)
  const latestUpdatedAt = accounts.length > 0
    ? accounts
      .map(item => item.updatedAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    : ''

  const searchFields: SearchField[] = [
    {
      key: 'userId',
      label: '用户UID',
      type: 'text',
      placeholder: '请输入用户UID',
      span: 6
    },
    {
      key: 'symbol',
      label: '币种',
      type: 'text',
      placeholder: '请输入币种',
      span: 4,
      minWidth: 140
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      span: 3,
      minWidth: 120,
      options: [
        { label: '全部', value: '' },
        { label: '正常', value: 1, color: 'green' },
        { label: '禁用', value: 0, color: 'red' }
      ]
    }
  ]

  const columns: TableColumn[] = [
    {
      key: 'userProfile',
      title: '用户信息',
      width: 240,
      render: (_: any, record: FundAccount) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <UserOutlined className="text-slate-400" />
            <span>{record.userName || '未命名用户'}</span>
          </div>
          <div className="text-xs text-slate-500">UID: {record.userId}</div>
          <div className="text-xs text-slate-500">{record.userEmail || record.userPhone || '-'}</div>
        </div>
      )
    },
    {
      key: 'balance',
      title: '账户余额',
      dataIndex: 'balance',
      width: 180,
      render: (value: string, record: FundAccount) => (
        <div>
          <div className="font-semibold text-slate-900">{formatAmount(value)} {record.symbol?.toUpperCase()}</div>
          <div className="mt-1">
            <Tag color="blue" className="rounded-full px-2 py-0.5 text-[11px] font-medium">
              {record.symbol?.toUpperCase()}
            </Tag>
          </div>
        </div>
      )
    },
    {
      key: 'frozenBalance',
      title: '冻结余额',
      dataIndex: 'frozenBalance',
      width: 150,
      render: (value: string, record: FundAccount) => (
        <span className="font-medium text-amber-600">{formatAmount(value)} {record.symbol?.toUpperCase()}</span>
      )
    },
    {
      key: 'availableBalance',
      title: '可用余额',
      dataIndex: 'availableBalance',
      width: 160,
      render: (value: string, record: FundAccount) => (
        <span className="font-semibold text-emerald-600">{formatAmount(value)} {record.symbol?.toUpperCase()}</span>
      )
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: number) => (
        <Tag color={value === 1 ? 'green' : 'red'} className="rounded-full px-3 py-1 text-xs font-medium">
          {value === 1 ? '正常' : '禁用'}
        </Tag>
      )
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value: string) => new Date(value).toLocaleString('zh-CN')
    }
  ]

  const handleSearch = (values: Record<string, any>) => {
    const nextParams: FundAccountQueryParams = {
      page: 1,
      pageSize: searchParams.pageSize || 20,
      userId: values.userId || undefined,
      symbol: values.symbol || undefined,
      status: values.status !== '' && values.status !== undefined ? values.status as Status : undefined
    }

    setSearchParams(nextParams)
  }

  const handleReset = () => {
    const nextParams: FundAccountQueryParams = {
      page: 1,
      pageSize: 20
    }

    setSearchParams(nextParams)
  }

  return (
    <div className="space-y-6 pb-2">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Card
            bordered={false}
            className="overflow-hidden rounded-[28px] border border-amber-200/60 bg-gradient-to-b from-[#1f1a17] to-[#3f2f26] text-white shadow-[0_18px_40px_rgba(60,34,20,0.18)]"
            bodyStyle={{ padding: 28 }}
          >
            <div className="text-[11px] uppercase tracking-[0.28em] text-amber-200/70">资金账户</div>
            <div className="mt-4 whitespace-nowrap text-3xl font-semibold leading-tight">
              资金账户列表
            </div>
            <div className="mt-8 rounded-[24px] border border-white/10 bg-white/10 p-4">
              <div className="flex items-center justify-between text-amber-100/80">
                <span className="text-xs">最后更新时间</span>
                <FieldTimeOutlined />
              </div>
              <div className="mt-3 text-sm font-medium text-white">
                {latestUpdatedAt ? new Date(latestUpdatedAt).toLocaleString('zh-CN') : '暂无数据'}
              </div>
            </div>
          </Card>

          <Card bordered={false} className="rounded-[24px] border border-stone-200 bg-[#fcfaf6] shadow-sm">
            <div className="text-xs uppercase tracking-[0.22em] text-stone-400">核心指标</div>
            <div className="mt-4 space-y-3">
              {[
                { label: '账户总数', value: stats.totalAccounts, icon: <BankOutlined className="text-stone-500" /> },
                { label: '正常账户', value: stats.activeAccounts, icon: <SafetyCertificateOutlined className="text-emerald-600" /> },
                { label: '覆盖币种', value: stats.totalSymbols, icon: <FilterOutlined className="text-sky-600" /> },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3">
                  <div>
                    <div className="text-xs text-stone-400">{item.label}</div>
                    <div className="mt-1 text-2xl font-semibold text-stone-900">{item.value}</div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100">
                    {item.icon}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <section className="space-y-5">
          <Card
            bordered={false}
            className="rounded-[28px] border border-stone-200 bg-[linear-gradient(135deg,#fffaf0_0%,#f6efe3_52%,#f8f5ef_100%)] shadow-sm"
            bodyStyle={{ padding: 28 }}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-sm font-medium text-stone-500">统计摘要</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
                  全量可用余额 {formatAmount(stats.totalAvailable)}
                </div>
                <div className="mt-3 text-sm leading-6 text-stone-600">
                  全量冻结余额 {formatAmount(stats.totalFrozen)}
                </div>
              </div>
              <div className="grid min-w-[260px] gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                <div className="rounded-[22px] border border-stone-200 bg-white px-4 py-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-stone-400">
                    <span>可用资金</span>
                    <RiseOutlined className="text-emerald-600" />
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-emerald-600">
                    {formatAmount(stats.totalAvailable)}
                  </div>
                </div>
                <div className="rounded-[22px] border border-stone-200 bg-white px-4 py-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-stone-400">
                    <span>冻结资金</span>
                    <WalletOutlined className="text-amber-600" />
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-amber-600">
                    {formatAmount(stats.totalFrozen)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {activeFilterTags.length > 0 ? activeFilterTags.map(tag => (
                <Tag key={tag} color="gold" className="rounded-full px-3 py-1 text-xs">
                  {tag}
                </Tag>
              )) : (
                <span className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-500">
                  全部数据
                </span>
              )}
            </div>
          </Card>

          <Card bordered={false} className="rounded-[28px] border border-stone-200 bg-white shadow-sm" bodyStyle={{ padding: 24 }}>
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-stone-400">查询条件</div>
                <div className="mt-2 text-2xl font-semibold text-stone-900">资金账户列表</div>
                <div className="mt-1 text-sm text-stone-500">按用户、币种和状态查询账户数据。</div>
              </div>
              <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-600">
                当前返回 {accounts.length} 条
              </div>
            </div>

        <SearchTable
          dataSource={accounts}
          columns={columns}
          searchFields={searchFields}
          title="资金账户列表"
          loading={isLoading}
          scroll={{ x: 1100 }}
          showPagination
          serverSidePagination
          pagination={pagination}
          onSearch={handleSearch}
          onReset={handleReset}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['fund-accounts'] })}
          onTableChange={(pager) => {
            setSearchParams(prev => ({
              ...prev,
              page: pager.current || 1,
              pageSize: pager.pageSize || prev.pageSize || 20
            }))
          }}
        />
          </Card>
        </section>
      </div>
    </div>
  )
}

export default FundAccountListPage
