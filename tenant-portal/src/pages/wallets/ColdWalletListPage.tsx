import React, { useState } from 'react'
import { Button, Space, Typography } from 'antd'
import { CloudOutlined, PlusOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { coldWalletService, chainService } from '@/services'
import type { ColdWallet, Chain } from '@shared/types'
import { PageHeaderCard, StatCard, SearchTable } from '@shared/components'
import type { SearchField, TableColumn } from '@shared/components'
import { ColdWalletForm } from './components'

export { coldWalletService } from '@/services'

// 临时类型定义，匹配实际 API 响应
interface ActualColdWalletWithBalance {
  wallet: ColdWallet
  balanceByChain: any
}

const ColdWalletListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  // 状态管理
  const [editingWallet, setEditingWallet] = useState<ActualColdWalletWithBalance | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [searchParams, setSearchParams] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    chainCodes: undefined as string[] | undefined,
    symbols: undefined as string[] | undefined,
    status: undefined as any
  })

  // 获取链列表
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

  // 获取冷钱包列表
  const { data: walletData, isLoading, refetch } = useQuery({
    queryKey: ['cold-wallets', searchParams],
    queryFn: () => coldWalletService.getColdWallets(searchParams)
  })

  // 获取冷钱包统计（总钱包数、活跃钱包数、今日交易数）
  const { data: statsData } = useQuery({
    queryKey: ['cold-wallet-stats'],
    queryFn: () => coldWalletService.getColdWalletStats()
  })

  // 从 chains 数据中提取所有代币
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

  // 根据已选择的链筛选代币
  const filteredCurrencies = searchParams.chainCodes?.length
    ? allCurrencies.filter(currency => searchParams.chainCodes!.includes(currency.chainCode))
    : allCurrencies

  // 删除冷钱包
  const deleteWalletMutation = useMutation({
    mutationFn: coldWalletService.deleteColdWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cold-wallets'] })
      queryClient.invalidateQueries({ queryKey: ['cold-wallet-stats'] })
    },
    onError: (error: any) => {
      console.error('删除失败:', error)
    },
  })

  // 处理创建
  const handleCreate = () => {
    setEditingWallet(null)
    setFormVisible(true)
  }

  // 处理编辑
  const handleEdit = (wallet: ActualColdWalletWithBalance) => {
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
    navigate(`/cold-wallets/${walletId}`)
  }

  // 处理设置（暂时注释掉，因为未使用）
  // const handleSettings = (walletId: string) => {
  //   // TODO: 实现设置页面路由
  //   console.log('设置冷钱包:', walletId)
  // }

  // 处理表单成功
  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingWallet(null)
    queryClient.invalidateQueries({ queryKey: ['cold-wallets'] })
    queryClient.invalidateQueries({ queryKey: ['cold-wallet-stats'] })
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
      key: 'chainCodes',
      label: '链',
      type: 'select',
      span: 4,
      multiple: true,
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
      span: 4,
      multiple: true,
      options: filteredCurrencies.map((currency: any) => ({
        label: `${currency.symbol} (${currency.chainName})`,
        value: currency.symbol,
        color: 'green'
      }))
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
      width: 200,
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
      key: 'walletType',
      title: '钱包类型',
      width: 120,
      render: (_: any, _record: any) => (
        <div>
          <span className="inline-block bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded mr-1 mb-1">
            <CloudOutlined /> 冷钱包
          </span>
          <div className="text-xs text-gray-500">无私钥存储</div>
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
      chainCodes: values.chainCodes,
      symbols: values.symbols,
      status: values.status
    }))
  }

  // 处理重置
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

  // 表格数据与统计数据
  const walletStatsData = walletData?.data?.items || []
  const totalWallets = statsData?.totalWallets ?? walletStatsData.length
  const activeWallets = statsData?.activeWallets ?? walletStatsData.filter((w: any) => w.wallet?.status === 1).length
  const todayTransactions = statsData?.todayTransactions ?? 0

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <PageHeaderCard
        title="冷钱包管理"
        subtitle="管理您的冷钱包，支持监控地址余额和交易记录"
        logoText="❄️"
        gradientColors={['#1890ff', '#40a9ff', '#69c0ff', '#91d5ff']}
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
              创建冷钱包
            </Button>
          </Space>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="总冷钱包数"
          value={totalWallets}
          icon={<CloudOutlined />}
          topStripColor="bg-blue-500"
          iconColor="text-blue-600"
          decorationIcon={<CloudOutlined />}
        />
        <StatCard
          title="活跃钱包"
          value={activeWallets}
          icon={<CloudOutlined />}
          topStripColor="bg-green-500"
          iconColor="text-green-600"
          decorationIcon={<CloudOutlined />}
          trend="up"
        />
        <StatCard
          title="今日交易"
          value={todayTransactions}
          icon={<CloudOutlined />}
          topStripColor="bg-orange-500"
          iconColor="text-orange-600"
          decorationIcon={<CloudOutlined />}
        />
      </div>

      {/* 冷钱包列表搜索表格 */}
      <SearchTable
        dataSource={walletStatsData}
        columns={columns}
        searchFields={searchFields}
        title="冷钱包列表"
        loading={isLoading}
        scroll={{ x: 1200 }}
        showPagination={false} // 使用服务端分页
        onSearch={handleSearch}
        onRefresh={() => refetch()}
        onReset={handleReset}
      />

      {/* 创建/编辑表单模态框 */}
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
