import React, { useState } from 'react'
import { Button, Space, Typography, message } from 'antd'
import { FireOutlined, PlusOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { hotWalletService } from '@/services'
import type { HotWallet } from '@shared/types'
import { PageHeaderCard, StatCard, SearchTable } from '@shared/components'
import type { SearchField, TableColumn } from '@shared/components'

// 临时类型定义，匹配实际 API 响应
interface ActualHotWalletWithBalance {
  wallet: HotWallet
  balanceByChain: any
}

import {
  HotWalletForm
} from './components'

const HotWalletListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  // 状态管理
  const [editingWallet, setEditingWallet] = useState<ActualHotWalletWithBalance | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [searchParams, setSearchParams] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    chainCode: undefined as string | undefined,
    symbol: undefined as string | undefined,
    status: undefined as any
  })

  // 获取热钱包列表
  const { data: walletData, isLoading, refetch } = useQuery({
    queryKey: ['hot-wallets', searchParams],
    queryFn: () => hotWalletService.getHotWallets(searchParams)
  })

  // 获取热钱包统计（暂时注释掉，因为未使用）
  // const { data: walletStats } = useQuery({
  //   queryKey: ['hot-wallet-stats'],
  //   queryFn: () => hotWalletService.getHotWalletStats()
  // })

  // 删除热钱包
  const deleteWalletMutation = useMutation({
    mutationFn: hotWalletService.deleteHotWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hot-wallets'] })
      queryClient.invalidateQueries({ queryKey: ['hot-wallet-stats'] })
    },
    onError: (error: any) => {
      console.error('删除失败:', error)
    }
  })

  // 处理创建
  const handleCreate = () => {
    setEditingWallet(null)
    setFormVisible(true)
  }

  // 处理编辑
  const handleEdit = (wallet: ActualHotWalletWithBalance) => {
    setEditingWallet(wallet)
    setFormVisible(true)
  }

  // 处理删除
  const handleDelete = async (walletId: string) => {
    try {
      await deleteWalletMutation.mutateAsync(walletId)
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 处理查看详情
  const handleViewDetail = (walletId: string) => {
    navigate(`/hot-wallets/${walletId}`)
  }

  // 处理设置（暂时注释掉，因为未使用）
  // const handleSettings = (walletId: string) => {
  //   // TODO: 实现设置页面路由
  //   console.log('设置热钱包:', walletId)
  // }

  // 处理表单成功
  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingWallet(null)
    queryClient.invalidateQueries({ queryKey: ['hot-wallets'] })
    queryClient.invalidateQueries({ queryKey: ['wallet-stats'] })
  }

  // 搜索字段配置
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
      type: 'select',
      span: 4,
      options: [
        { label: 'Bitcoin', value: 'bitcoin', color: 'orange' },
        { label: 'Ethereum', value: 'ethereum', color: 'blue' },
        { label: 'BSC', value: 'bsc', color: 'yellow' },
        { label: 'Polygon', value: 'polygon', color: 'purple' }
      ]
    },
    {
      key: 'symbol',
      label: '代币',
      type: 'select',
      span: 4,
      options: [
        { label: 'BTC', value: 'BTC', color: 'orange' },
        { label: 'ETH', value: 'ETH', color: 'blue' },
        { label: 'USDT', value: 'USDT', color: 'green' },
        { label: 'USDC', value: 'USDC', color: 'blue' }
      ]
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      span: 4,
      options: [
        { label: '活跃', value: 1, color: 'green' },
        { label: '非活跃', value: 0, color: 'orange' },
        { label: '冻结', value: 2, color: 'red' }
      ]
    }
  ]

  // 表格列配置
  const columns: TableColumn[] = [
    {
      key: 'name',
      title: '钱包名称',
      dataIndex: 'name',
      width: 200,
      fixed: 'left',
      render: (_: any, record: any) => (
        <div>
          <div className="font-medium">{record.wallet?.name || '未知'}</div>
          <div className="text-xs text-gray-500">{record.wallet?.description || '暂无描述'}</div>
        </div>
      )
    },
    {
      key: 'address',
      title: '钱包地址',
      dataIndex: 'address',
      width: 220,
      render: (_: any, record: any) => {
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
            style={{ maxWidth: 180 }}
          >
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </Typography.Text>
        )
      }
    },
    {
      key: 'chainCodes',
      title: '支持的链',
      dataIndex: 'chainCodes',
      width: 150,
      render: (_: any, record: any) => (
        <div>
          {record.wallet?.chainCodes?.length > 0 ? (
            record.wallet.chainCodes.map((code: string) => (
              <span key={code} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                {code.toUpperCase()}
              </span>
            ))
          ) : (
            <span className="text-orange-500">全部</span>
          )}
        </div>
      )
    },
    {
      key: 'symbols',
      title: '支持的代币',
      dataIndex: 'symbols',
      width: 150,
      render: (_: any, record: any) => (
        <div>
          {record.wallet?.symbols?.length > 0 ? (
            record.wallet.symbols.map((symbol: string) => (
              <span key={symbol} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                {symbol}
              </span>
            ))
          ) : (
            <span className="text-orange-500">全部</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_: any, record: any) => {
        const statusConfig: Record<number, { text: string; color: string }> = {
          1: { text: '活跃', color: 'green' },
          0: { text: '非活跃', color: 'orange' },
          2: { text: '冻结', color: 'red' }
        }
        const config = statusConfig[record.wallet?.status]
        return (
          <span className={`inline-block px-2 py-1 rounded text-xs ${
            config?.color === 'green' ? 'bg-green-100 text-green-800' :
            config?.color === 'orange' ? 'bg-orange-100 text-orange-800' :
            config?.color === 'red' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {config?.text || '未知'}
          </span>
        )
      }
    },
    {
      key: 'balance',
      title: '余额信息',
      width: 180,
      render: (_: any, record: any) => {
        const chains = record.balanceByChain
        if (!chains || Object.keys(chains).length === 0) {
          return <div className="text-gray-400">暂无余额</div>
        }
        return (
          <div>
            {Object.entries(chains).map(([chain, symbols]: [string, any]) =>
              Object.entries(symbols).map(([symbol, info]: [string, any]) => (
                <div key={`${chain}-${symbol}`} className="mb-1 last:mb-0">
                  <div className="font-medium">
                    {parseFloat(info.balance ?? 0).toFixed(8)} {symbol}
                  </div>
                  <div className="text-xs text-gray-500">
                    {chain} · 区块高度: {info.lastBlockHeight ?? '未知'}
                  </div>
                </div>
              ))
            )}
          </div>
        )
      }
    },
    {
      key: 'walletType',
      title: '钱包类型',
      width: 120,
      render: (_: any, record: any) => (
        <div>
          {record.wallet?.isWithdrawalWallet && (
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1 mb-1">提现钱包</span>
          )}
          {record.wallet?.isGasWallet && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">Gas钱包</span>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (_: any, record: any) => (
        <div className="text-xs">
          {record.wallet?.createdAt ? 
            new Date(record.wallet.createdAt).toLocaleString('zh-CN') : 
            '未知'
          }
        </div>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleViewDetail(record.wallet?.id)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDelete(record.wallet?.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 处理搜索
  const handleSearch = (values: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      search: values.search || '',
      chainCode: values.chainCode,
      symbol: values.symbol,
      status: values.status
    }))
  }

  // 处理重置
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

  // 计算统计数据
  const walletStatsData = walletData?.data?.items || []
  const totalWallets = walletStatsData.length
  const activeWallets = walletStatsData.filter((w: any) => w.wallet?.status === 1).length

  // 汇总所有钱包的余额（按币种聚合）
  const balanceByCoin: Record<string, number> = {}
  walletStatsData.forEach((w: any) => {
    const chains = w.balanceByChain
    if (!chains) return
    Object.values(chains).forEach((symbols: any) => {
      Object.entries(symbols).forEach(([symbol, info]: [string, any]) => {
        balanceByCoin[symbol] = (balanceByCoin[symbol] || 0) + parseFloat(info.balance ?? 0)
      })
    })
  })
  const totalBalanceDisplay = Object.keys(balanceByCoin).length > 0
    ? Object.entries(balanceByCoin).map(([symbol, amt]) => `${amt.toFixed(8)} ${symbol}`).join(' | ')
    : '0'
  const todayTransactions = 0

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <PageHeaderCard
        title="热钱包管理"
        subtitle="管理您的热钱包，支持快速交易和资金管理"
        logoText="🔥"
        gradientColors={['#fa541c', '#ff7a45', '#ff9c6e', '#ffad91']}
        actions={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              创建热钱包
            </Button>
          </Space>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总热钱包数"
          value={totalWallets}
          icon={<FireOutlined />}
          topStripColor="bg-orange-500"
          iconColor="text-orange-600"
          decorationIcon={<FireOutlined />}
        />
        <StatCard
          title="活跃钱包"
          value={activeWallets}
          icon={<FireOutlined />}
          topStripColor="bg-green-500"
          iconColor="text-green-600"
          decorationIcon={<FireOutlined />}
          trend="up"
        />
        <StatCard
          title="总余额"
          value={totalBalanceDisplay}
          icon={<FireOutlined />}
          topStripColor="bg-blue-500"
          iconColor="text-blue-600"
          decorationIcon={<FireOutlined />}
        />
        <StatCard
          title="今日交易"
          value={todayTransactions}
          icon={<FireOutlined />}
          topStripColor="bg-purple-500"
          iconColor="text-purple-600"
          decorationIcon={<FireOutlined />}
        />
      </div>

      {/* 热钱包列表搜索表格 */}
      <SearchTable
        dataSource={walletStatsData}
        columns={columns}
        searchFields={searchFields}
        title="热钱包列表"
        loading={isLoading}
        scroll={{ x: 1200 }}
        showPagination={false} // 使用服务端分页
        onSearch={handleSearch}
        onRefresh={() => refetch()}
        onReset={handleReset}
      />

      {/* 创建/编辑表单模态框 */}
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
