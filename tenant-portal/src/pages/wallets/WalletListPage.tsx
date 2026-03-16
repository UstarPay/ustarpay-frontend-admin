import React, { useState, useEffect } from 'react'
import { Button, Card, Space, Tag, Tooltip, Typography } from 'antd'
import {
  BankOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  SafetyCertificateOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { walletService, chainService, currencyService } from '@/services'
import { Status, WalletQueryParams, WalletWithBalance } from '@shared/types'
import { WalletBalanceModal, SearchTable } from '@shared/components'
import type { SearchField, TableColumn } from '@shared/components/SearchTable'


/**
 * 数字钱包列表页面
 */
const WalletListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedChainCode, setSelectedChainCode] = useState<string>('')
  const [searchParams, setSearchParams] = useState<WalletQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    // 默认不传 status，查询全部状态
  })
  const [balanceModalVisible, setBalanceModalVisible] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletWithBalance | null>(null)

  // 获取钱包列表
  const { data: walletsResponse, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets', searchParams],
    queryFn: () => walletService.getWallets(searchParams)
  })

  // 获取 chains 表数据，用于「支持网络」下拉
  const { data: chainsResponse } = useQuery({
    queryKey: ['chains', 'active'],
    queryFn: () => chainService.getActiveChains()
  })
  const chains = (chainsResponse?.data?.items || []) as Array<{ chainCode: string; chainName: string; nativeSymbol: string }>

  // 从 searchParams 同步 selectedChainCode（如从 URL 恢复）
  useEffect(() => {
    if (searchParams.chainCodes?.length) {
      setSelectedChainCode(searchParams.chainCodes[0])
    }
  }, [searchParams.chainCodes])

  // 根据选中的网络加载币种（currencies.symbol）
  const { data: currenciesResponse } = useQuery({
    queryKey: ['currencies', 'chain', selectedChainCode],
    queryFn: () => currencyService.getCurrenciesByChain(selectedChainCode),
    enabled: !!selectedChainCode
  })
  const currencies = (currenciesResponse?.data || []) as Array<{ symbol: string; name?: string }>

  // 从钱包数据中提取余额信息
  const wallets = (walletsResponse?.data?.items || []) as WalletWithBalance[]
  const totalWalletCount = walletsResponse?.data?.total || wallets.length
  const pagination = {
    current: walletsResponse?.data?.page || searchParams.page || 1,
    pageSize: walletsResponse?.data?.pageSize || searchParams.pageSize || 10,
    total: walletsResponse?.data?.total || 0
  }
  
  // 计算每个钱包的资产统计信息
  const walletStats = wallets.map(walletItem => {
    const wallet = walletItem.wallet
    const balanceByChain = walletItem.balanceByChain

    // 统计支持的链和币种
    const supportedChains = Object.keys(balanceByChain || {})
    const supportedSymbols = new Set<string>()
    let totalBalanceRecords = 0

    Object.values(balanceByChain || {}).forEach(chainData => {
      Object.keys(chainData).forEach(symbol => {
        if (symbol !== 'unknown') {
          supportedSymbols.add(symbol)
          totalBalanceRecords++
        }
      })
    })

    return {
      ...wallet,
      supportedChains,
      supportedSymbols: Array.from(supportedSymbols),
      totalBalanceRecords,
      balanceByChain,
      // 用户信息
      userName: walletItem.userName,
      userEmail: walletItem.userEmail,
      userPhone: walletItem.userPhone,
      userStatus: walletItem.userStatus,
      countryCode: walletItem.countryCode
    }
  })
  const totalChains = walletStats.length > 0 ? new Set(walletStats.flatMap(w => w.supportedChains)).size : 0
  const totalCurrencies = walletStats.length > 0 ? new Set(walletStats.flatMap(w => w.supportedSymbols)).size : 0
  const activeWallets = wallets.filter(w => w.wallet.status === 1).length
  const totalBalanceRecords = walletStats.reduce((sum, w) => sum + w.totalBalanceRecords, 0)
  const activeFilterTags = [
    searchParams.userId ? `UID: ${searchParams.userId}` : '',
    searchParams.userEmail ? `邮箱: ${searchParams.userEmail}` : '',
    searchParams.userPhone ? `手机: ${searchParams.userPhone}` : '',
    searchParams.search ? `地址: ${searchParams.search}` : '',
    searchParams.chainCodes?.[0] ? `网络: ${searchParams.chainCodes[0]}` : '',
    searchParams.symbols?.[0] ? `币种: ${searchParams.symbols[0]}` : '',
    searchParams.status !== undefined ? `状态: ${searchParams.status === 1 ? '正常' : '禁用'}` : '',
  ].filter(Boolean)
  const topChains = walletStats.length > 0
    ? Object.entries(
      walletStats.flatMap(item => item.supportedChains).reduce<Record<string, number>>((acc, chain) => {
        acc[chain] = (acc[chain] || 0) + 1
        return acc
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : []
  const topSymbols = walletStats.length > 0
    ? Object.entries(
      walletStats.flatMap(item => item.supportedSymbols).reduce<Record<string, number>>((acc, symbol) => {
        acc[symbol] = (acc[symbol] || 0) + 1
        return acc
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 4)
    : []
  // 表单变化时同步 selectedChainCode（用于级联加载币种）
  const handleFormChange = (values: any) => {
    setSelectedChainCode(values.chainCode || '')
  }

  // 处理搜索
  const handleSearch = (values: any) => {
    const newSearchParams: WalletQueryParams = {
      ...searchParams,
      page: 1,
      search: values.address || '',
    }
    if (values.userId) {
      newSearchParams.userId = values.userId
    }
    if (values.userEmail) {
      newSearchParams.userEmail = values.userEmail
    }
    if (values.userPhone) {
      newSearchParams.userPhone = values.userPhone
    }
    if (values.chainCode) {
      newSearchParams.chainCodes = [values.chainCode]
    }
    if (values.symbol) {
      newSearchParams.symbols = [values.symbol]
    }
    if (values.status !== undefined && values.status !== '' && values.status !== 'all') {
      newSearchParams.status = values.status as Status
    }
    setSearchParams(newSearchParams)
  }

  // 处理重置
  const handleReset = () => {
    setSelectedChainCode('')
    const resetParams: WalletQueryParams = {
      page: 1,
      pageSize: 10,
      search: '',
    }
    setSearchParams(resetParams)
  }

  // 处理刷新
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['wallets'] })
  }

  // 搜索字段配置（支持网络数据来源于 chains 表）
  const searchFields: SearchField[] = [
    {
      key: 'userId',
      label: '用户UID',
      type: 'text',
      placeholder: '请输入用户UID',
      span: 6
    },
    {
      key: 'userEmail',
      label: '用户邮箱',
      type: 'text',
      placeholder: '请输入用户邮箱',
      span: 6
    },
    {
      key: 'userPhone',
      label: '用户手机号',
      type: 'text',
      placeholder: '请输入用户手机号',
      span: 6
    },
    {
      key: 'address',
      label: '地址',
      type: 'text',
      placeholder: '请输入钱包地址',
      span: 6
    },
    {
      key: 'chainCode',
      label: '支持网络',
      type: 'select',
      span: 4,
      placeholder: '请先选择支持网络',
      options: [
        { label: '全部', value: '' },
        ...chains.map(c => ({ label: c.nativeSymbol || c.chainCode, value: c.chainCode }))
      ]
    },
    {
      key: 'symbol',
      label: '支持币种',
      type: 'select',
      span: 4,
      placeholder: '请先选择网络',
      disabled: (form) => !form.chainCode,
      clearWhen: 'chainCode',
      options: [
        { label: '全部', value: '' },
        ...currencies.map(c => ({ label: c.symbol, value: c.symbol }))
      ]
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      span: 2,
      options: [
        { label: '全部', value: 'all' },
        { label: '正常', value: 1, color: 'green' },
        { label: '禁用', value: 0, color: 'red' }
      ]
    },
  ]

  // 表格列配置
  const walletColumns: TableColumn[] = [
    {
      key: 'name',
      title: '钱包名称',
      dataIndex: 'name',
      width: 180,
      fixed: 'left',
      render: (name: string, record: any) => (
        <div className="min-w-0">
          <div className="font-semibold text-gray-800">{name || '未命名钱包'}</div>
          <div className="mt-1 text-xs text-gray-500">
            ID: {record.id || '-'}
          </div>
        </div>
      )
    },
    {
      key: 'address',
      title: '地址',
      dataIndex: 'address',
      width: 180,
      render: (address: string) => {
        if (!address) return <span className="text-gray-400">未生成</span>
        return (
          <Tooltip title={address} placement="topLeft">
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Typography.Text
                copyable={{
                  text: address,
                  icon: [<CopyOutlined key="copy" />, <CopyOutlined key="copied" />],
                  tooltips: ['复制地址', '已复制'],
                }}
                className="font-mono text-xs text-slate-700"
              >
                {address.slice(0, 10)}...{address.slice(-8)}
              </Typography.Text>
            </div>
          </Tooltip>
        )
      }
    },
    {
      key: 'userProfile',
      title: '用户信息',
      width: 220,
      render: (_: any, record: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <UserOutlined className="text-slate-400" />
            <span>{record.userName || '未实名用户'}</span>
          </div>
          <div className="text-xs text-gray-500">{record.userEmail || '-'}</div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{record.userPhone || '-'}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
              {record.countryCode || '未知地区'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: number) => (
        <Tag
          color={status === 1 ? 'green' : 'red'}
          className="rounded-full px-3 py-1 text-xs font-medium"
        >
          {status === 1 ? '正常' : '禁用'}
        </Tag>
      )
    },
    {
      key: 'supportedChains',
      title: '支持链',
      dataIndex: 'supportedChains',
      width: 150,
      render: (chains: string[]) => (
        <div className="flex flex-wrap gap-1">
          {chains.length > 0 ? (
            chains.slice(0, 2).map(chain => (
              <Tag key={chain} color="purple" className="rounded-full px-2 py-0.5 text-xs">{chain}</Tag>
            ))
          ) : (
            <span className="text-gray-400">-</span>
          )}
          {chains.length > 2 && <span className="text-xs text-gray-500">+{chains.length - 2}</span>}
        </div>
      )
    },
    {
      key: 'supportedSymbols',
      title: '支持币种',
      dataIndex: 'supportedSymbols',
      width: 170,
      render: (symbols: string[]) => (
        <div className="flex flex-wrap gap-1">
          {symbols.length > 0 ? (
            symbols.slice(0, 3).map(symbol => (
              <Tag key={symbol} color="blue" className="rounded-full px-2 py-0.5 text-xs">{symbol.toUpperCase()}</Tag>
            ))
          ) : (
            <span className="text-gray-400">-</span>
          )}
          {symbols.length > 3 && <span className="text-xs text-gray-500">+{symbols.length - 3}</span>}
        </div>
      )
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (date: string) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              // 将walletStats记录转换为WalletWithBalance格式
              const walletWithBalance: WalletWithBalance = {
                wallet: {
                  id: record.id,
                  name: record.name,
                  address: record.address,
                  description: record.description,
                  status: record.status,
                  createdAt: record.createdAt,
                  updatedAt: record.updatedAt,
                  tenantId: record.tenantId,
                  createdBy: record.createdBy,
                  updatedBy: record.updatedBy,
                  deletedBy: record.deletedBy
                },
                balanceByChain: record.balanceByChain
              }
              setSelectedWallet(walletWithBalance)
              setBalanceModalVisible(true)
            }}
          >
            查看
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="space-y-6 pb-2">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <Card
          bordered={false}
          className="overflow-hidden rounded-[30px] border border-[#d4e5e1] shadow-sm"
          bodyStyle={{ padding: 0 }}
        >
          <div className="bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_48%,#0ea5e9_100%)] px-6 py-6 text-white">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-100/80">User Wallet Registry</div>
                <div className="mt-3 text-3xl font-semibold tracking-tight">数字钱包列表</div>
                <div className="mt-3 max-w-2xl text-sm text-cyan-50/85">
                  面向用户资产检索和地址排查，快速查看钱包归属、网络覆盖、币种支持与余额记录沉淀情况。
                </div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <SafetyCertificateOutlined className="text-2xl text-cyan-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: '钱包总数', value: totalWalletCount, icon: <BankOutlined /> },
                { label: '活跃钱包', value: activeWallets, icon: <SafetyCertificateOutlined /> },
                { label: '支持网络', value: totalChains, icon: <EnvironmentOutlined /> },
                { label: '余额记录', value: totalBalanceRecords, icon: <FilterOutlined /> },
              ].map(item => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <div className="flex items-center justify-between text-cyan-50/80">
                    <span className="text-xs">{item.label}</span>
                    <span className="text-sm">{item.icon}</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card bordered={false} className="rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-500">筛选状态</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {activeFilterTags.length > 0 ? `已启用 ${activeFilterTags.length} 项条件` : '当前展示全部钱包'}
              </div>
            </div>
            <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              实时视图
            </div>
          </div>
          <div className="mt-4 flex min-h-[64px] flex-wrap gap-2">
            {activeFilterTags.length > 0 ? activeFilterTags.map(tag => (
              <Tag key={tag} color="processing" className="rounded-full px-3 py-1 text-xs">
                {tag}
              </Tag>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                当前未启用筛选条件
              </div>
            )}
          </div>
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">热门网络</div>
              <div className="flex flex-wrap gap-2">
                {topChains.length > 0 ? topChains.map(([chain, count]) => (
                  <span key={chain} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {chain} · {count}
                  </span>
                )) : (
                  <span className="text-sm text-slate-400">暂无网络分布数据</span>
                )}
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">热门币种</div>
              <div className="flex flex-wrap gap-2">
                {topSymbols.length > 0 ? topSymbols.map(([symbol, count]) => (
                  <span key={symbol} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                    {symbol.toUpperCase()} · {count}
                  </span>
                )) : (
                  <span className="text-sm text-slate-400">暂无币种分布数据</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card
        bordered={false}
        className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <div className="text-sm font-medium text-slate-500">钱包检索面板</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">按用户、地址、网络或币种快速定位钱包</div>
            <div className="mt-2 text-sm text-slate-600">
              当前返回 <span className="font-semibold text-slate-900">{walletStats.length}</span> 条记录，
              适合用于客服排障、资产确认和用户地址核验。
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">热门网络</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {topChains.length > 0 ? topChains.map(([chain]) => chain).join(' / ') : '暂无'}
              </div>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">热门币种</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {topSymbols.length > 0 ? topSymbols.map(([symbol]) => symbol.toUpperCase()).join(' / ') : '暂无'}
              </div>
            </div>
          </div>
        </div>

        <SearchTable
          dataSource={walletStats}
          columns={walletColumns}
          searchFields={searchFields}
          title="数字钱包列表"
          loading={walletsLoading}
          scroll={{ x: 1400 }}
          showPagination
          serverSidePagination
          pagination={pagination}
          onFormChange={handleFormChange}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          onReset={handleReset}
          onTableChange={(pager) => {
            setSearchParams(prev => ({
              ...prev,
              page: pager.current || 1,
              pageSize: pager.pageSize || prev.pageSize || 10
            }))
          }}
        />
      </Card>

      {/* 余额详情Modal */}
      <WalletBalanceModal
        visible={balanceModalVisible}
        onClose={() => setBalanceModalVisible(false)}
        wallet={selectedWallet}
      />
    </div>
  )
}

export default WalletListPage
