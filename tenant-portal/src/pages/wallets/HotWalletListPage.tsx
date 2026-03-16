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
      monthlyTransactions: 0
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
        className="overflow-hidden rounded-[30px] border border-[#c9d9dc] bg-[linear-gradient(180deg,#f6fbfb_0%,#edf6f6_100%)] shadow-[0_20px_48px_rgba(34,78,88,0.10)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#0f766e_0%,#14b8a6_45%,#7dd3fc_100%)]" />
          <div className="absolute right-6 top-6 hidden h-20 w-20 rounded-[24px] border border-teal-200/80 bg-white/70 lg:flex lg:items-center lg:justify-center">
            <div className="grid grid-cols-3 gap-2">
              {new Array(9).fill(null).map((_, index) => (
                <span
                  key={index}
                  className={`h-3 w-3 rounded-sm ${index % 3 === 0 ? 'bg-teal-500' : index % 2 === 0 ? 'bg-sky-400' : 'bg-slate-300'}`}
                />
              ))}
            </div>
          </div>
          <div className="relative flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] uppercase tracking-[0.34em] text-teal-700/70">Hot Wallet Network</div>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">热钱包列表</div>
                <div className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  查看热钱包状态、用途分工与余额快照。
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                  loading={isLoading}
                  className="h-10 rounded-full border-slate-300 bg-white px-5 text-slate-700 shadow-none hover:!border-teal-400 hover:!color-[#0f766e]"
                >
                  刷新列表
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  className="h-10 rounded-full border-0 bg-[#0f766e] px-5 shadow-none hover:!bg-[#115e59]"
                >
                  新建热钱包
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.95fr]">
              <div className="rounded-[26px] border border-[#cfe3e2] bg-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">节点健康度</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900">{activeRate}%</div>
                  </div>
                  <SafetyCertificateOutlined className="text-2xl text-teal-600" />
                </div>
                <div className="mt-3">
                  <Progress percent={activeRate} showInfo={false} strokeColor="#0f766e" trailColor="#dbeceb" />
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {stats.activeWallets} / {stats.totalWallets} 钱包当前处于活跃状态
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs text-slate-400">地址覆盖</div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{stats.totalAddresses}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Gas 节点</span>
                      <ThunderboltOutlined className="text-amber-500" />
                    </div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{gasWalletCount}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>提现节点</span>
                      <RocketOutlined className="text-sky-500" />
                    </div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{withdrawalWalletCount}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#cfe3e2] bg-[linear-gradient(180deg,#ffffff_0%,#f4fbfb_100%)] px-5 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">运行快照</div>
                <div className="mt-3 space-y-3">
                  <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <div className="text-xs text-slate-400">总余额聚合</div>
                      <div className="mt-1 text-base font-semibold text-slate-900 break-all">{stats.totalBalance || '0'}</div>
                    </div>
                    <WalletOutlined className="mt-1 text-lg text-teal-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-xs text-slate-400">今日交易</div>
                      <div className="mt-1 text-xl font-semibold text-slate-900">{stats.todayTransactions}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-xs text-slate-400">月度交易</div>
                      <div className="mt-1 text-xl font-semibold text-slate-900">{stats.monthlyTransactions}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-teal-300 bg-teal-50 px-4 py-3">
                    <div className="text-xs text-teal-700/70">最近创建</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {latestCreatedAt ? new Date(latestCreatedAt).toLocaleString('zh-CN') : '暂无数据'}
                    </div>
                  </div>
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
