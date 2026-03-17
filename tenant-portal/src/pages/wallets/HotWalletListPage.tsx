import React, { useMemo, useState } from 'react'
import { Button, Card, Progress, Space, Tag, Typography } from 'antd'
import {
  CopyOutlined,
  PlusOutlined,
  ReloadOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { hotWalletService } from '@/services'
import type { HotWallet, HotWalletStats, WalletQueryParams } from '@shared/types'
import { SearchTable } from '@shared/components'
import type { SearchField, TableColumn } from '@shared/components'
import { HotWalletForm } from './components'

interface ActualHotWalletWithBalance {
  wallet: HotWallet
  balanceByChain: Record<string, Record<string, { balance?: string; lastBlockHeight?: string }>>
}

const formatAmount = (value: string | number, digits = 8) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return String(value || '0')
  }
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits
  })
}

const statusConfig: Record<number, { text: string; color: string; dot: string }> = {
  1: { text: '活跃', color: 'green', dot: 'bg-emerald-500' },
  0: { text: '非活跃', color: 'orange', dot: 'bg-orange-400' },
  2: { text: '冻结', color: 'red', dot: 'bg-rose-500' }
}

const HotWalletListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [editingWallet, setEditingWallet] = useState<ActualHotWalletWithBalance | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [searchParams, setSearchParams] = useState<WalletQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    chainCode: undefined,
    symbol: undefined,
    status: undefined
  })

  const { data: walletResponse, isLoading, refetch } = useQuery({
    queryKey: ['hot-wallets', searchParams],
    queryFn: () => hotWalletService.getHotWallets(searchParams)
  })

  const { data: statsResponse } = useQuery({
    queryKey: ['hot-wallet-stats'],
    queryFn: () => hotWalletService.getHotWalletStats()
  })

  const deleteWalletMutation = useMutation({
    mutationFn: hotWalletService.deleteHotWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hot-wallets'] })
      queryClient.invalidateQueries({ queryKey: ['hot-wallet-stats'] })
    }
  })

  const wallets = ((walletResponse?.data?.items || []) as ActualHotWalletWithBalance[])
  const pagination = {
    current: walletResponse?.data?.page || searchParams.page || 1,
    pageSize: walletResponse?.data?.pageSize || searchParams.pageSize || 10,
    total: walletResponse?.data?.total || 0
  }

  const fallbackStats = useMemo<HotWalletStats>(() => {
    const balanceByCoin: Record<string, number> = {}
    wallets.forEach(walletItem => {
      Object.values(walletItem.balanceByChain || {}).forEach(symbols => {
        Object.entries(symbols || {}).forEach(([symbol, info]) => {
          balanceByCoin[symbol] = (balanceByCoin[symbol] || 0) + Number(info?.balance || 0)
        })
      })
    })

    return {
      totalWallets: walletResponse?.data?.total || wallets.length,
      activeWallets: wallets.filter(item => item.wallet?.status === 1).length,
      totalBalance: Object.entries(balanceByCoin).map(([symbol, amount]) => `${formatAmount(amount)} ${symbol}`).join(' | ') || '0',
      totalUsdtValue: '0',
      totalAddresses: wallets.length,
      todayTransactions: 0,
      monthlyTransactions: 0,
      symbols: Object.keys(balanceByCoin),
      chainCodes: Array.from(new Set(wallets.flatMap(item => item.wallet?.chainCodes || [])))
    }
  }, [walletResponse?.data?.total, wallets])

  const stats = statsResponse || fallbackStats
  const activeRate = stats.totalWallets > 0 ? Math.round((stats.activeWallets / stats.totalWallets) * 100) : 0
  const gasWalletCount = wallets.filter(item => item.wallet?.isGasWallet).length
  const withdrawalWalletCount = wallets.filter(item => item.wallet?.isWithdrawalWallet).length
  const latestCreatedAt = wallets.length > 0
    ? wallets.map(item => item.wallet?.createdAt).filter(Boolean).sort((a, b) => new Date(String(b)).getTime() - new Date(String(a)).getTime())[0]
    : ''

  const handleCreate = () => {
    setEditingWallet(null)
    setFormVisible(true)
  }

  const handleEdit = (wallet: ActualHotWalletWithBalance) => {
    setEditingWallet(wallet)
    setFormVisible(true)
  }

  const handleDelete = async (walletId: string) => {
    try {
      await deleteWalletMutation.mutateAsync(walletId)
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleViewDetail = (walletId: string) => {
    navigate(`/hot-wallets/${walletId}`)
  }

  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingWallet(null)
    queryClient.invalidateQueries({ queryKey: ['hot-wallets'] })
    queryClient.invalidateQueries({ queryKey: ['hot-wallet-stats'] })
  }

  const searchFields: SearchField[] = [
    {
      key: 'search',
      label: '搜索',
      type: 'text',
      placeholder: '搜索钱包名称或描述',
      span: 6
    },
    {
      key: 'chainCode',
      label: '链',
      type: 'text',
      placeholder: '如 BSC、ETH、TRON',
      span: 4,
      minWidth: 150
    },
    {
      key: 'symbol',
      label: '代币',
      type: 'text',
      placeholder: '如 USDT、ETH',
      span: 4,
      minWidth: 140
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      span: 4,
      minWidth: 144,
      options: [
        { label: '全部', value: '' },
        { label: '活跃', value: 1, color: 'green' },
        { label: '非活跃', value: 0, color: 'orange' },
        { label: '冻结', value: 2, color: 'red' }
      ]
    }
  ]

  const columns: TableColumn[] = [
    {
      key: 'name',
      title: '热钱包档案',
      width: 260,
      fixed: 'left',
      render: (_: unknown, record: ActualHotWalletWithBalance) => {
        const status = statusConfig[record.wallet?.status || 0]
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${status?.dot || 'bg-slate-400'}`} />
              <div className="text-sm font-semibold text-slate-900">{record.wallet?.name || '未知钱包'}</div>
            </div>
            <div className="text-xs text-slate-500">{record.wallet?.description || '暂无描述'}</div>
            <div className="flex flex-wrap gap-2">
              {record.wallet?.isWithdrawalWallet && (
                <Tag color="green" className="rounded-full px-2 py-0.5 text-[11px]">提现钱包</Tag>
              )}
              {record.wallet?.isGasWallet && (
                <Tag color="blue" className="rounded-full px-2 py-0.5 text-[11px]">Gas 钱包</Tag>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'address',
      title: '钱包地址',
      width: 220,
      render: (_: unknown, record: ActualHotWalletWithBalance) => {
        const address = record.wallet?.address
        if (!address) return <span className="text-gray-400">未知地址</span>
        return (
          <Typography.Text
            copyable={{
              text: address,
              icon: [<CopyOutlined key="copy" />, <CopyOutlined key="copied" />],
              tooltips: ['复制地址', '已复制'],
            }}
            className="font-mono text-xs"
          >
            {`${address.slice(0, 8)}...${address.slice(-6)}`}
          </Typography.Text>
        )
      }
    },
    {
      key: 'chainCodes',
      title: '链路覆盖',
      width: 170,
      render: (_: unknown, record: ActualHotWalletWithBalance) => (
        <div>
          {record.wallet?.chainCodes?.length > 0 ? (
            record.wallet.chainCodes.map(code => (
              <Tag key={code} color="blue" className="mb-1 rounded-full px-2 py-0.5 text-[11px]">
                {code.toUpperCase()}
              </Tag>
            ))
          ) : (
            <Tag color="gold" className="rounded-full px-2 py-0.5 text-[11px]">全部链</Tag>
          )}
        </div>
      )
    },
    {
      key: 'symbols',
      title: '代币覆盖',
      width: 170,
      render: (_: unknown, record: ActualHotWalletWithBalance) => (
        <div>
          {record.wallet?.symbols?.length > 0 ? (
            record.wallet.symbols.map(symbol => (
              <Tag key={symbol} color="cyan" className="mb-1 rounded-full px-2 py-0.5 text-[11px]">
                {symbol.toUpperCase()}
              </Tag>
            ))
          ) : (
            <Tag color="gold" className="rounded-full px-2 py-0.5 text-[11px]">全部币种</Tag>
          )}
        </div>
      )
    },
    {
      key: 'balance',
      title: '余额快照',
      width: 250,
      render: (_: unknown, record: ActualHotWalletWithBalance) => {
        const chains = record.balanceByChain
        if (!chains || Object.keys(chains).length === 0) {
          return <div className="text-gray-400">暂无余额</div>
        }
        return (
          <div className="space-y-2">
            {Object.entries(chains).slice(0, 2).map(([chain, symbols]) =>
              Object.entries(symbols || {}).slice(0, 2).map(([symbol, info]) => (
                <div key={`${chain}-${symbol}`}>
                  <div className="font-medium text-slate-900">
                    {formatAmount(info.balance || 0)} {symbol}
                  </div>
                  <div className="text-xs text-slate-500">
                    {chain} · 区块高度 {info.lastBlockHeight || '未知'}
                  </div>
                </div>
              ))
            )}
          </div>
        )
      }
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (_: unknown, record: ActualHotWalletWithBalance) => {
        const status = statusConfig[record.wallet?.status || 0]
        return (
          <Tag color={status?.color || 'default'} className="rounded-full px-3 py-1 text-xs font-medium">
            {status?.text || '未知'}
          </Tag>
        )
      }
    },
    {
      key: 'createdAt',
      title: '创建时间',
      width: 170,
      render: (_: unknown, record: ActualHotWalletWithBalance) => (
        <div className="text-xs text-slate-600">
          {record.wallet?.createdAt ? new Date(record.wallet.createdAt).toLocaleString('zh-CN') : '未知'}
        </div>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: ActualHotWalletWithBalance) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record.wallet?.id)}>查看</Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.wallet?.id)}>删除</Button>
        </Space>
      )
    }
  ]

  const handleSearch = (values: Record<string, unknown>) => {
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      search: values.search ? String(values.search) : '',
      chainCode: values.chainCode ? String(values.chainCode) : undefined,
      symbol: values.symbol ? String(values.symbol) : undefined,
      status: values.status !== '' && values.status !== undefined ? Number(values.status) : undefined
    }))
  }

  const handleReset = () => {
    setSearchParams({
      page: 1,
      pageSize: 10,
      search: '',
      chainCode: undefined,
      symbol: undefined,
      status: undefined
    })
  }

  return (
    <div className="space-y-6 pb-2">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border border-[rgba(30,64,175,0.10)] bg-[linear-gradient(130deg,rgba(15,23,42,0.96)_0%,rgba(30,64,175,0.95)_38%,rgba(8,47,73,0.94)_100%)] shadow-[0_24px_70px_rgba(30,64,175,0.18)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-8">
          <div className="absolute right-[-36px] top-[-30px] h-36 w-36 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute bottom-[-42px] left-[30%] h-32 w-32 rounded-full bg-cyan-300/18 blur-3xl" />
          <div className="relative grid gap-6 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-[#dbeafe]">
                Hot Wallet Network
              </div>
              <div className="mt-4 text-3xl font-semibold tracking-tight text-white">热钱包列表</div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                  loading={isLoading}
                  className="h-10 rounded-full border-white/20 bg-white/10 px-5 text-[#eff6ff] shadow-none hover:!border-sky-300 hover:!bg-white/15 hover:!text-white"
                >
                  刷新列表
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  className="h-10 rounded-full border-0 bg-[#2563eb] px-5 shadow-none hover:!bg-[#1d4ed8]"
                >
                  新建热钱包
                </Button>
              </div>
              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#dbeafe]">节点健康度</div>
                    <div className="mt-1 text-[26px] font-semibold leading-none text-white">{activeRate}%</div>
                  </div>
                  <SafetyCertificateOutlined className="text-2xl text-[#dbeafe]" />
                </div>
                <div className="mt-3">
                  <Progress percent={activeRate} showInfo={false} strokeColor="#60a5fa" trailColor="rgba(219,234,254,0.24)" />
                </div>
                <div className="mt-1 text-xs text-[#dbeafe]">
                  {stats.activeWallets} / {stats.totalWallets} 钱包当前处于活跃状态
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5">
                    <div className="text-xs text-[#dbeafe]">地址覆盖</div>
                    <div className="mt-1 text-lg font-semibold text-white">{stats.totalAddresses}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5">
                    <div className="flex items-center justify-between text-xs text-[#dbeafe]">
                      <span>Gas 节点</span>
                      <ThunderboltOutlined className="text-amber-300" />
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">{gasWalletCount}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5">
                    <div className="flex items-center justify-between text-xs text-[#dbeafe]">
                      <span>提现节点</span>
                      <RocketOutlined className="text-sky-300" />
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">{withdrawalWalletCount}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[22px] border border-white/10 bg-[rgba(30,64,175,0.24)] px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#dbeafe]">总余额聚合</div>
                  <div className="mt-2 break-all text-xl font-semibold leading-snug text-white">
                    {stats.totalBalance || '0'}
                  </div>
                  <div className="mt-2 text-xs text-[#93c5fd]">实时汇总当前热钱包余额结构</div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                    <div className="flex items-center justify-between text-[#dbeafe]">
                      <span className="text-xs uppercase tracking-[0.16em]">今日交易</span>
                      <WalletOutlined className="text-base" />
                    </div>
                    <div className="mt-1 text-xl font-semibold text-white">{stats.todayTransactions}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[#dbeafe]">月度交易</div>
                    <div className="mt-1 text-xl font-semibold text-white">{stats.monthlyTransactions}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-dashed border-white/20 bg-white/10 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.16em] text-[#dbeafe]">最近创建</div>
                <div className="mt-1 text-sm font-medium text-white">
                  {latestCreatedAt ? new Date(latestCreatedAt).toLocaleString('zh-CN') : '暂无数据'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <SearchTable
        dataSource={wallets}
        columns={columns}
        searchFields={searchFields}
        title="热钱包列表"
        searchCardClassName="border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(239,246,255,0.92)_100%)] shadow-sm"
        tableCardClassName="border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(239,246,255,0.92)_72%,rgba(219,234,254,0.90)_100%)] shadow-sm"
        loading={isLoading}
        scroll={{ x: 1450 }}
        showPagination
        serverSidePagination
        pagination={pagination}
        onSearch={handleSearch}
        onRefresh={() => refetch()}
        onReset={handleReset}
        onTableChange={(nextPagination) => {
          setSearchParams(prev => ({
            ...prev,
            page: nextPagination.current,
            pageSize: nextPagination.pageSize
          }))
        }}
      />

      <HotWalletForm
        visible={formVisible}
        editingWallet={editingWallet}
        onCancel={() => {
          setFormVisible(false)
          setEditingWallet(null)
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}

export default HotWalletListPage
