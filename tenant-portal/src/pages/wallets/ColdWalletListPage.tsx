import React, { useMemo, useState } from 'react'
import { Button, Card, Space, Tag, Typography } from 'antd'
import {
  AlertOutlined,
  CopyOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { coldWalletService, chainService } from '@/services'
import type { Chain, ColdWallet, WalletQueryParams } from '@shared/types'
import { SearchTable } from '@shared/components'
import type { SearchField, TableColumn } from '@shared/components'
import { ColdWalletForm } from './components'

interface ActualColdWalletWithBalance {
  wallet: ColdWallet
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
  0: { text: '非活跃', color: 'orange', dot: 'bg-amber-400' },
  2: { text: '冻结', color: 'red', dot: 'bg-rose-500' }
}

const ColdWalletListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [editingWallet, setEditingWallet] = useState<ActualColdWalletWithBalance | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [searchParams, setSearchParams] = useState<WalletQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    chainCodes: undefined,
    symbols: undefined,
    status: undefined
  })

  const { data: chainsData } = useQuery({
    queryKey: ['chains', 'active'],
    queryFn: async () => {
      try {
        const result = await chainService.getActiveChains()
        return result.success ? result.data : null
      } catch (error) {
        console.error('获取链数据失败:', error)
        return null
      }
    }
  })

  const { data: walletResponse, isLoading, refetch } = useQuery({
    queryKey: ['cold-wallets', searchParams],
    queryFn: () => coldWalletService.getColdWallets(searchParams)
  })

  const { data: statsData } = useQuery({
    queryKey: ['cold-wallet-stats'],
    queryFn: () => coldWalletService.getColdWalletStats()
  })

  const deleteWalletMutation = useMutation({
    mutationFn: coldWalletService.deleteColdWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cold-wallets'] })
      queryClient.invalidateQueries({ queryKey: ['cold-wallet-stats'] })
    },
    onError: (error: unknown) => {
      console.error('删除失败:', error)
    },
  })

  const wallets = ((walletResponse?.data?.items || []) as ActualColdWalletWithBalance[])
  const pagination = {
    current: walletResponse?.data?.page || searchParams.page || 1,
    pageSize: walletResponse?.data?.pageSize || searchParams.pageSize || 10,
    total: walletResponse?.data?.total || 0
  }

  const allCurrencies = (chainsData?.items as Chain[])?.flatMap((chain: Chain) => {
    if (!chain?.chainCode || !chain?.chainName || !Array.isArray(chain.currencies)) {
      return []
    }
    return chain.currencies
      .filter((currency: any) => currency?.symbol && currency?.name)
      .map((currency: any) => ({
        ...currency,
        chainCode: chain.chainCode,
        chainName: chain.chainName
      }))
  }) || []

  const filteredCurrencies = searchParams.chainCodes?.length
    ? allCurrencies.filter(currency => searchParams.chainCodes!.includes(currency.chainCode))
    : allCurrencies

  const totalWallets = statsData?.totalWallets ?? wallets.length
  const activeWallets = statsData?.activeWallets ?? wallets.filter(item => item.wallet?.status === 1).length
  const todayTransactions = statsData?.todayTransactions ?? 0
  const frozenWallets = wallets.filter(item => {
    const status = Number(item.wallet?.status)
    return status === 2 || status === -1
  }).length
  const latestCreatedAt = wallets.length > 0
    ? wallets.map(item => item.wallet?.createdAt).filter(Boolean).sort((a, b) => new Date(String(b)).getTime() - new Date(String(a)).getTime())[0]
    : ''
  const activeRate = totalWallets > 0 ? Math.round((activeWallets / totalWallets) * 100) : 0

  const aggregatedBalance = useMemo(() => {
    const balanceByCoin: Record<string, number> = {}
    wallets.forEach(walletItem => {
      Object.values(walletItem.balanceByChain || {}).forEach(symbols => {
        Object.entries(symbols || {}).forEach(([symbol, info]) => {
          balanceByCoin[symbol] = (balanceByCoin[symbol] || 0) + Number(info?.balance || 0)
        })
      })
    })
    return Object.entries(balanceByCoin).map(([symbol, amount]) => `${formatAmount(amount)} ${symbol}`).join(' | ') || '0'
  }, [wallets])

  const coldStorageScope = useMemo(() => {
    const chainSet = new Set<string>()
    wallets.forEach(item => {
      item.wallet?.chainCodes?.forEach(code => chainSet.add(code))
    })
    return chainSet.size
  }, [wallets])

  const handleCreate = () => {
    setEditingWallet(null)
    setFormVisible(true)
  }

  const handleEdit = (wallet: ActualColdWalletWithBalance) => {
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
    navigate(`/cold-wallets/${walletId}`)
  }

  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingWallet(null)
    queryClient.invalidateQueries({ queryKey: ['cold-wallets'] })
    queryClient.invalidateQueries({ queryKey: ['cold-wallet-stats'] })
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
      key: 'chainCodes',
      label: '链',
      type: 'select',
      span: 5,
      multiple: true,
      minWidth: 180,
      options: (chainsData?.items as Chain[])?.map((chain: Chain) => ({
        label: chain.chainName,
        value: chain.chainCode,
        color: 'blue'
      })) || []
    },
    {
      key: 'symbols',
      label: '代币',
      type: 'select',
      span: 5,
      multiple: true,
      minWidth: 180,
      options: filteredCurrencies.map((currency: any) => ({
        label: `${currency.symbol} (${currency.chainName})`,
        value: currency.symbol,
        color: 'cyan'
      }))
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
      title: '冷存档案',
      width: 250,
      fixed: 'left',
      render: (_: unknown, record: ActualColdWalletWithBalance) => {
        const status = statusConfig[record.wallet?.status || 0]
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${status?.dot || 'bg-slate-400'}`} />
              <div className="text-sm font-semibold text-slate-900">{record.wallet?.name || '未知钱包'}</div>
            </div>
            <div className="text-xs text-slate-500">{record.wallet?.description || '暂无描述'}</div>
            <Tag color="cyan" className="rounded-full px-2 py-0.5 text-[11px]">
              冷存储
            </Tag>
          </div>
        )
      }
    },
    {
      key: 'address',
      title: '钱包地址',
      width: 220,
      render: (_: unknown, record: ActualColdWalletWithBalance) => {
        const address = record.wallet?.address
        if (!address) return <span className="text-slate-400">未知地址</span>
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
      title: '链路范围',
      width: 170,
      render: (_: unknown, record: ActualColdWalletWithBalance) => (
        <div>
          {record.wallet?.chainCodes?.length > 0 ? (
            record.wallet.chainCodes.map((code: string) => (
              <Tag key={`${record.wallet?.id}-chain-${code}`} color="blue" className="mb-1 rounded-full px-2 py-0.5 text-[11px]">
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
      title: '资产范围',
      width: 170,
      render: (_: unknown, record: ActualColdWalletWithBalance) => (
        <div>
          {record.wallet?.symbols?.length > 0 ? (
            record.wallet.symbols.map((symbol: string) => (
              <Tag key={`${record.wallet?.id}-symbol-${symbol}`} color="cyan" className="mb-1 rounded-full px-2 py-0.5 text-[11px]">
                {symbol}
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
      width: 240,
      render: (_: unknown, record: ActualColdWalletWithBalance) => {
        const chains = record.balanceByChain
        if (!chains || Object.keys(chains).length === 0) {
          return <div className="text-slate-400">暂无余额</div>
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
      render: (_: unknown, record: ActualColdWalletWithBalance) => {
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
      render: (_: unknown, record: ActualColdWalletWithBalance) => (
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
      render: (_: unknown, record: ActualColdWalletWithBalance) => (
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
      chainCodes: values.chainCodes as string[] | undefined,
      symbols: values.symbols as string[] | undefined,
      status: values.status !== '' && values.status !== undefined ? Number(values.status) : undefined
    }))
  }

  const handleReset = () => {
    setSearchParams({
      page: 1,
      pageSize: 10,
      search: '',
      chainCodes: undefined,
      symbols: undefined,
      status: undefined
    })
  }

  return (
    <div className="space-y-6 pb-2">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card
          bordered={false}
          className="overflow-hidden rounded-[30px] border border-[#d7d0c5] bg-[linear-gradient(180deg,#faf7f2_0%,#f0e9de_100%)] shadow-[0_22px_44px_rgba(71,57,40,0.1)]"
          bodyStyle={{ padding: 0 }}
        >
          <div className="relative h-full overflow-hidden px-6 py-6">
            <div className="absolute inset-x-0 top-0 h-[5px] bg-[linear-gradient(90deg,#6b7280_0%,#b8a58d_50%,#6b7280_100%)]" />
            <div className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Cold Vault Registry</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">冷钱包列表</div>
            <div className="mt-3 text-sm leading-6 text-stone-600">
              查看托管范围、状态与余额快照。
            </div>

            <div className="mt-5 rounded-[24px] border border-stone-300 bg-[linear-gradient(180deg,#fffdfa_0%,#f4ede3_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-stone-400">Vault Seal</div>
                  <div className="mt-1 text-2xl font-semibold text-stone-900">{activeRate}%</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white/80">
                  <LockOutlined className="text-lg text-stone-700" />
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#57534e_0%,#292524_100%)]" style={{ width: `${activeRate}%` }} />
              </div>
              <div className="mt-2 text-xs text-stone-500">
                {activeWallets} / {totalWallets} 钱包处于活跃状态
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] border border-stone-300/90 bg-white/60 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-stone-400">库区编号</div>
                <div className="mt-1 text-base font-semibold text-stone-900">VAULT-01</div>
              </div>
              <div className="rounded-[18px] border border-stone-300/90 bg-white/60 px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-stone-400">最近创建</div>
                <div className="mt-1 truncate text-sm font-medium text-stone-800">
                  {latestCreatedAt ? new Date(latestCreatedAt).toLocaleDateString('zh-CN') : '暂无数据'}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
                className="h-10 rounded-full border-stone-400 bg-white/80 px-5 text-stone-700 shadow-none hover:!border-stone-500"
              >
                刷新列表
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                className="h-10 rounded-full border-0 bg-[linear-gradient(180deg,#44403c_0%,#1c1917_100%)] px-5 shadow-none hover:!bg-stone-900"
              >
                新建冷钱包
              </Button>
            </div>
          </div>
        </Card>

        <Card
          bordered={false}
          className="overflow-hidden rounded-[30px] border border-[#d9e0e6] bg-[linear-gradient(180deg,#fdfefe_0%,#f3f6f8_100%)] shadow-[0_22px_48px_rgba(15,23,42,0.06)]"
          bodyStyle={{ padding: 0 }}
        >
          <div className="relative overflow-hidden px-6 py-6">
            <div className="absolute inset-y-0 left-[42%] hidden w-px bg-[linear-gradient(180deg,rgba(203,213,225,0)_0%,rgba(148,163,184,0.8)_18%,rgba(148,163,184,0.8)_82%,rgba(203,213,225,0)_100%)] xl:block" />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
              <div>
                <div className="text-xs font-medium tracking-[0.18em] text-slate-400">资产保管概览</div>
                <div className="mt-3 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Balance Snapshot</div>
                      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">冷存储资产概览</div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                      <WalletOutlined className="text-lg text-slate-700" />
                    </div>
                  </div>
                  <div className="mt-4 rounded-[22px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 font-mono text-sm leading-6 text-slate-700">
                    {aggregatedBalance}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">托管钱包</div>
                      <div className="mt-1 text-xl font-semibold text-slate-900">{totalWallets}</div>
                    </div>
                    <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">链路覆盖</div>
                      <div className="mt-1 text-xl font-semibold text-slate-900">{coldStorageScope}</div>
                    </div>
                    <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">冻结钱包</div>
                      <div className="mt-1 text-xl font-semibold text-slate-900">{frozenWallets}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-medium tracking-[0.18em] text-slate-400">托管台账</div>
                <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fa_100%)] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">风险缓冲</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">{frozenWallets}</div>
                    </div>
                    <SafetyCertificateOutlined className="text-2xl text-slate-600" />
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">冻结钱包维持在独立隔离状态。</div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fa_100%)] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">交易监测</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">{todayTransactions}</div>
                    </div>
                    <AlertOutlined className="text-2xl text-slate-600" />
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">统计当日涉及冷钱包的链上交易。</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">保管范围</div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{coldStorageScope}</div>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">最近创建</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {latestCreatedAt ? new Date(latestCreatedAt).toLocaleDateString('zh-CN') : '暂无数据'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <SearchTable
        dataSource={wallets}
        columns={columns}
        searchFields={searchFields}
        title="冷钱包列表"
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

      <ColdWalletForm
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

export default ColdWalletListPage
