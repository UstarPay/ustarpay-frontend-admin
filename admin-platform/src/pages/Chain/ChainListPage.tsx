import React, { useState } from 'react'
import { Card, Button, Space, Alert } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { chainApi } from '@/services/apis/chainApi'
import { useAuthStore, useAppStore } from '@/stores'
import { Chain, ChainListParams } from '@shared/types/chain'
import ChainList from './components/ChainList'
import ChainSearchForm from './components/ChainSearchForm'
import ChainCreateModal from './components/ChainCreateModal'
import ChainEditModal from './components/ChainEditModal'
import ChainDetailModal from './components/ChainDetailModal'
import ChainScanHeightModal from './components/ChainScanHeightModal'
import './ChainListPage.css'

/**
 * 区块链网络管理页面
 */
const ChainListPage: React.FC = () => {
  const { hasPermission } = useAuthStore()
  const { addNotification } = useAppStore()
  const queryClient = useQueryClient()

  // 状态管理
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isScanHeightModalVisible, setIsScanHeightModalVisible] =
    useState(false)
  const [searchParams, setSearchParams] = useState<ChainListParams>({
    page: 1,
    pageSize: 20,
  })

  // 获取区块链网络列表
  const {
    data: chainListResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['chains', searchParams],
    queryFn: () => chainApi.getChains(searchParams),
    enabled: hasPermission('chain:list'),
  })

  const chains = chainListResponse?.items || []
  const totalChains = chainListResponse?.total || 0
  const activeChains = chains.filter((chain) => chain.status === 1).length
  const networkTypeCount = new Set(
    chains
      .map((chain) => chain.chainNetwork)
      .filter((network): network is string => Boolean(network))
  ).size
  const highestScanHeight = chains.reduce((max, chain) => {
    return Math.max(max, Number(chain.lastScanHeight || chain.scanHeight || 0))
  }, 0)
  const averageConfirmations = chains.length
    ? Math.round(
        chains.reduce(
          (sum, chain) => sum + Number(chain.confirmationBlocks || 0),
          0
        ) / chains.length
      )
    : 0
  const networkHighlights = Array.from(
    new Set(
      chains
        .map((chain) => chain.chainNetwork)
        .filter((network): network is string => Boolean(network))
    )
  ).slice(0, 4)

  // 事件处理函数
  const handleSearch = (values: ChainListParams) => {
    setSearchParams({ ...values, page: 1, pageSize: 20 })
  }

  // 提交回调函数
  const handleCreateSubmit = async (values: any) => {
    try {
      await chainApi.createChain(values)
      queryClient.invalidateQueries({ queryKey: ['chains'] })
      setIsCreateModalVisible(false)
      addNotification({
        type: 'success',
        title: '创建成功',
        message: '区块链网络创建成功',
      })
    } catch (error: any) {
      handleError(error, '创建失败')
    }
  }

  const handleDelete = async (chainId: number) => {
    try {
      await chainApi.deleteChain(chainId)
      queryClient.invalidateQueries({ queryKey: ['chains'] })
      addNotification({
        type: 'success',
        title: '删除成功',
        message: '区块链网络删除成功',
      })
    } catch (error: any) {
      handleError(error, '删除失败')
    }
  }

  const handleEditSubmit = async (chainId: number, values: any) => {
    try {
      await chainApi.updateChain(chainId, values)
      queryClient.invalidateQueries({ queryKey: ['chains'] })
      setIsEditModalVisible(false)
      setSelectedChain(null)
      addNotification({
        type: 'success',
        title: '更新成功',
        message: '区块链网络信息更新成功',
      })
    } catch (error: any) {
      handleError(error, '更新失败')
    }
  }

  const handleScanHeightSubmit = async (
    chainCode: string,
    scanHeight: number
  ) => {
    try {
      await chainApi.updateScanHeight(chainCode, scanHeight)
      queryClient.invalidateQueries({ queryKey: ['chains'] })
      setIsScanHeightModalVisible(false)
      setSelectedChain(null)
      addNotification({
        type: 'success',
        title: '更新成功',
        message: '扫描高度更新成功',
      })
    } catch (error: any) {
      handleError(error, '更新失败')
    }
  }

  const handleError = (error: any, title: string) => {
    console.error(`${title} error:`, error)
    const errorMessage = error?.response?.data?.message || '操作失败'
    addNotification({ type: 'error', title, message: errorMessage })
  }

  // 模态框事件处理
  const handleView = (chain: Chain) => {
    setSelectedChain(chain)
    setIsDetailModalVisible(true)
  }

  const handleEdit = (chain: Chain) => {
    setSelectedChain(chain)
    setIsEditModalVisible(true)
  }

  const handleUpdateScanHeight = (chain: Chain) => {
    setSelectedChain(chain)
    setIsScanHeightModalVisible(true)
  }

  const handlePaginationChange = (page: number, pageSize?: number) => {
    setSearchParams({ ...searchParams, page, pageSize: pageSize || 20 })
  }

  // 权限检查
  if (!hasPermission('chain:list')) {
    return (
      <div className="chain-list-page">
        <Card className="chain-permission-card">
          <Alert
            message="权限不足"
            description="您没有权限访问区块链网络管理页面"
            type="error"
            showIcon
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="chain-list-page">
      <div className="chain-top-layout">
        <div className="chain-side-column">
          <section className="chain-hero-card">
            <div className="chain-hero-orb chain-hero-orb-left" />
            <div className="chain-hero-orb chain-hero-orb-right" />
            <div className="chain-hero-top">
              <div className="chain-page-title">
                <span className="chain-page-kicker">
                  Blockchain Network Console
                </span>
                <h1>区块链网络</h1>
                {networkHighlights.length > 0 && (
                  <div className="chain-highlight-list">
                    {networkHighlights.map((network) => (
                      <span key={network} className="chain-highlight-pill">
                        {network}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="chain-page-actions">
                <Space wrap>
                  <Button
                    className="chain-ghost-btn"
                    icon={<ReloadOutlined />}
                    onClick={() => refetch()}
                  >
                    刷新数据
                  </Button>
                  {hasPermission('chain:create') && (
                    <Button
                      type="primary"
                      className="chain-primary-btn"
                      icon={<PlusOutlined />}
                      onClick={() => setIsCreateModalVisible(true)}
                    >
                      创建区块链网络
                    </Button>
                  )}
                </Space>
              </div>
            </div>

            <div className="chain-metrics-grid">
              <div className="chain-metric-card">
                <span className="chain-metric-label">网络总数</span>
                <strong>{totalChains}</strong>
                <p>当前筛选条件下的链路规模</p>
              </div>
              <div className="chain-metric-card">
                <span className="chain-metric-label">本页启用</span>
                <strong>{activeChains}</strong>
                <p>已开启同步与业务使用的网络</p>
              </div>
              <div className="chain-metric-card">
                <span className="chain-metric-label">网络类型</span>
                <strong>{networkTypeCount}</strong>
                <p>EVM / Bitcoin / Tron 等接入覆盖</p>
              </div>
              <div className="chain-metric-card">
                <span className="chain-metric-label">扫描概览</span>
                <strong>{highestScanHeight.toLocaleString()}</strong>
                <p>平均确认块数 {averageConfirmations}</p>
              </div>
            </div>
          </section>

          <section className="chain-panel chain-search-panel">
            <div className="chain-panel-header">
              <div>
                <span className="chain-panel-eyebrow">Filter</span>
                <h2>网络筛选</h2>
              </div>
              <p>按链名称、链代码、网络类型与状态快速收敛结果。</p>
            </div>

            <ChainSearchForm
              onSearch={handleSearch}
              onReset={() => setSearchParams({ page: 1, pageSize: 20 })}
              loading={isLoading}
            />
          </section>
        </div>

        <div className="chain-main-column">
          {error && (
            <Alert
              className="chain-alert"
              message="加载失败"
              description={error.message || '获取区块链网络列表失败'}
              type="error"
              showIcon
            />
          )}

          <section className="chain-panel chain-table-panel">
            <div className="chain-panel-header">
              <div>
                <span className="chain-panel-eyebrow">Network Matrix</span>
                <h2>链路列表</h2>
              </div>
              <p>查看扫描高度、确认块数、状态和最近同步进度。</p>
            </div>

            <ChainList
              data={chains}
              loading={isLoading}
              pagination={{
                current: searchParams.page || 1,
                pageSize: searchParams.pageSize || 20,
                total: totalChains,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total: number, range: [number, number]) =>
                  `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              }}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdateScanHeight={handleUpdateScanHeight}
              onPaginationChange={handlePaginationChange}
            />
          </section>
        </div>
      </div>

      {/* 创建模态框 */}
      <ChainCreateModal
        visible={isCreateModalVisible}
        loading={false}
        onCancel={() => setIsCreateModalVisible(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* 编辑模态框 */}
      <ChainEditModal
        visible={isEditModalVisible}
        loading={false}
        chain={selectedChain}
        onCancel={() => {
          setIsEditModalVisible(false)
          setSelectedChain(null)
        }}
        onSubmit={handleEditSubmit}
      />

      {/* 详情模态框 */}
      <ChainDetailModal
        visible={isDetailModalVisible}
        chain={selectedChain}
        onCancel={() => {
          setIsDetailModalVisible(false)
          setSelectedChain(null)
        }}
      />

      {/* 扫描高度模态框 */}
      <ChainScanHeightModal
        visible={isScanHeightModalVisible}
        loading={false}
        chain={selectedChain}
        onCancel={() => {
          setIsScanHeightModalVisible(false)
          setSelectedChain(null)
        }}
        onSubmit={handleScanHeightSubmit}
      />
    </div>
  )
}

export default ChainListPage
