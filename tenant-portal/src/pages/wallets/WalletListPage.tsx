import React, { useState } from 'react'
import { Button, Space, Tag, Typography } from 'antd'
import { 
  PlusOutlined, 
  ReloadOutlined,
  CopyOutlined
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { walletService } from '@/services'
import WalletCreateModal from './WalletCreateModal'
import { Status, WalletQueryParams, WalletWithBalance } from '@shared/types'
import { WalletBalanceModal, WalletSummaryStats, PageHeaderCard, SearchTable } from '@shared/components'
import type { SearchField, TableColumn } from '@shared/components/SearchTable'


/**
 * 钱包管理页面
 */
const WalletListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useState<WalletQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    status: Status.ACTIVE, 
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [balanceModalVisible, setBalanceModalVisible] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletWithBalance | null>(null)

  // 获取钱包列表
  const { data: walletsResponse, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets', searchParams],
    queryFn: () => walletService.getWallets(searchParams)
  })

  // 从钱包数据中提取余额信息
  const wallets = (walletsResponse?.data?.items || []) as WalletWithBalance[]
  
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
      balanceByChain
    }
  })
  // 分页信息（暂时注释掉，因为使用SearchTable的内置分页）
  // const pagination = {
  //   current: walletsResponse?.data?.page || 1,
  //   pageSize: walletsResponse?.data?.pageSize || 10,
  //   total: walletsResponse?.data?.total || 0
  // }

  // 处理搜索
  const handleSearch = (values: any) => {
    console.log('搜索条件:', values)
    const newSearchParams = {
      ...searchParams,
      page: 1, // 重置到第一页
      search: values.name || values.description || values.address || '',
      status: values.status !== undefined ? values.status : Status.ACTIVE,
    }
    setSearchParams(newSearchParams)
  }

  // 处理重置
  const handleReset = () => {
    console.log('重置搜索条件')
    const resetParams = {
      page: 1,
      pageSize: 10,
      search: '',
      status: Status.ACTIVE,
    }
    setSearchParams(resetParams)
  }

  // 处理刷新
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['wallets'] })
  }

  // 处理创建成功
  const handleCreateSuccess = () => {
    setModalVisible(false)
    queryClient.invalidateQueries({ queryKey: ['wallets'] })
  }


  // 搜索字段配置
  const searchFields: SearchField[] = [
    {
      key: 'name',
      label: '钱包名称',
      type: 'text',
      placeholder: '请输入钱包名称',
      span: 6
    },
    {
      key: 'description',
      label: '描述',
      type: 'text',
      placeholder: '请输入描述',
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
      key: 'status',
      label: '状态',
      type: 'select',
      span: 3,
      options: [
        { label: '正常', value: 1, color: 'green' },
        { label: '禁用', value: 0, color: 'red' }
      ]
    },
    {
      key: 'supportedChains',
      label: '支持链',
      type: 'select',
      span: 3,
      multiple: true,
      options: [
        { label: 'ETH', value: 'ETH', color: 'blue' },
        { label: 'BSC', value: 'BSC', color: 'yellow' },
        { label: 'POLYGON', value: 'POLYGON', color: 'purple' },
        { label: 'AVALANCHE', value: 'AVALANCHE', color: 'red' }
      ]
    }
  ]

  // 表格列配置
  const walletColumns: TableColumn[] = [
    {
      key: 'name',
      title: '钱包名称',
      dataIndex: 'name',
      width: 150,
      fixed: 'left',
      render: (name: string) => (
        <span className="font-medium">{name || '未命名钱包'}</span>
      )
    },
    {
      key: 'description',
      title: '描述',
      dataIndex: 'description',
      width: 200,
      render: (description: string) => (
        <span className="text-gray-600">{description || '-'}</span>
      )
    },
    {
      key: 'address',
      title: '地址',
      dataIndex: 'address',
      width: 200,
      render: (address: string) => {
        if (!address) return <span className="text-gray-400">未生成</span>
        return (
          <Typography.Text
            copyable={{
              text: address,
              icon: [<CopyOutlined key="copy" />, <CopyOutlined key="copied" />],
              tooltips: ['复制地址', '已复制'],
            }}
            className="font-mono text-xs"
          >
            {address}
          </Typography.Text>
        )
      }
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '正常' : '禁用'}
        </Tag>
      )
    },
    {
      key: 'supportedChains',
      title: '支持链',
      dataIndex: 'supportedChains',
      render: (chains: string[]) => (
        <div className="flex flex-wrap gap-1">
          {chains.length > 0 ? (
            chains.map(chain => (
              <Tag key={chain} color="purple">{chain}</Tag>
            ))
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'supportedSymbols',
      title: '支持币种',
      dataIndex: 'supportedSymbols',
      render: (symbols: string[]) => (
        <div className="flex flex-wrap gap-1">
          {symbols.length > 0 ? (
            symbols.map(symbol => (
              <Tag key={symbol} color="blue">{symbol.toUpperCase()}</Tag>
            ))
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'totalBalanceRecords',
      title: '资产记录数',
      dataIndex: 'totalBalanceRecords',
      render: (count: number) => (
        <span className="font-medium text-gray-700">{count}</span>
      )
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (date: string) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {new Date(date).toLocaleString('zh-CN')}
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
            查看余额
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题卡片 */}
      <PageHeaderCard
        title="钱包管理"
        subtitle="管理您的数字钱包和查看资产余额"
        logoText="NH Wallet"
        gradientColors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        actions={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={walletsLoading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              创建钱包
            </Button>
          </Space>
        }
      />

      {/* 统计卡片 */}
      <WalletSummaryStats
        totalChains={walletStats.length > 0 ? new Set(walletStats.flatMap(w => w.supportedChains)).size : 0}
        totalCurrencies={walletStats.length > 0 ? new Set(walletStats.flatMap(w => w.supportedSymbols)).size : 0}
        activeWallets={wallets.filter(w => w.wallet.status === 1).length}
        totalBalanceRecords={walletStats.reduce((sum, w) => sum + w.totalBalanceRecords, 0)}
      />

      {/* 钱包列表搜索表格 */}
      <SearchTable
        dataSource={walletStats}
        columns={walletColumns}
        searchFields={searchFields}
        title="钱包列表"
        loading={walletsLoading}
        scroll={{ x: 1000 }}
        showPagination={false} // 使用服务端分页
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        onReset={handleReset}
      />

      {/* 创建钱包Modal */}
      <WalletCreateModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

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
