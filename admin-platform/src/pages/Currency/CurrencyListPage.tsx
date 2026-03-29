import React, { useMemo, useState } from 'react'
import { Card, Button, Space, Alert } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import currencyApi from '@/services/apis/currencyApi'
import chainApi from '@/services/apis/chainApi'
import coingeckoApi from '@/services/apis/coingeckoApi'
import type {
  Currency,
  CreateCurrencyRequest,
  UpdateCurrencyRequest,
  CurrencyListParams,
} from '@shared/types/currency'
import type { Chain, ChainListResponse } from '@shared/types/chain'

// Import components
import CurrencyList from './components/CurrencyList'
import CurrencyCreateModal from './components/CurrencyCreateModal'
import CurrencyEditModal from './components/CurrencyEditModal'
import CurrencyDetailModal from './components/CurrencyDetailModal'
import CurrencySearchForm from './components/CurrencySearchForm'
import './CurrencyListPage.css'

/**
 * 代币/币种管理页面
 */
const CurrencyListPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuthStore()
  const { addNotification } = useAppStore()

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null
  )
  const [searchParams, setSearchParams] = useState<CurrencyListParams>({
    page: 1,
    pageSize: 20,
  })

  // 获取活跃的区块链网络列表（用于下拉选择）
  const { data: activeChains, isLoading: chainsLoading } = useQuery({
    queryKey: ['chains', 'active'],
    queryFn: () => chainApi.getActiveChains(),
    enabled: hasPermission('chain:list'),
  })

  const normalizedChains: Chain[] = Array.isArray(activeChains)
    ? (activeChains as Chain[])
    : (activeChains as ChainListResponse | undefined)?.items || []

  // 获取代币列表
  const {
    data: currencyListData,
    isLoading: currenciesLoading,
    error: currenciesError,
    refetch: refetchCurrencies,
  } = useQuery({
    queryKey: ['currencies', searchParams],
    queryFn: () => currencyApi.getCurrencies(searchParams),
    enabled: hasPermission('currency:list'),
  })

  const currencies = currencyListData?.items || []
  const totalCurrencies = currencyListData?.total || 0
  const nativeCount = currencies.filter((currency) => currency.isNative).length
  const tokenCount = currencies.filter((currency) => !currency.isNative).length
  const activeCount = currencies.filter(
    (currency) => currency.status === 1
  ).length
  const disabledCount = Math.max(currencies.length - activeCount, 0)
  const activeChainRegistryCount = normalizedChains.length
  const chainCoverage = new Set(
    currencies
      .map((currency) => currency.chain?.chainName || currency.chainCode)
      .filter(Boolean)
  ).size
  const currencyHighlights = Array.from(
    new Set(currencies.map((currency) => currency.symbol).filter(Boolean))
  ).slice(0, 5)
  const coinGeckoIds = useMemo(
    () =>
      Array.from(
        new Set(
          currencies
            .map((currency) => currency.coingeckoId?.trim())
            .filter((id): id is string => Boolean(id))
        )
      ).sort(),
    [currencies]
  )

  const { data: coinGeckoPriceMap = {}, isLoading: coinGeckoPricesLoading } =
    useQuery({
      queryKey: ['coingecko-simple-price', coinGeckoIds],
      queryFn: () => coingeckoApi.getSimplePrices(coinGeckoIds),
      enabled: coinGeckoIds.length > 0,
      staleTime: 60 * 1000,
      retry: 1,
    })

  // 创建代币
  const createCurrencyMutation = useMutation({
    mutationFn: (data: CreateCurrencyRequest) =>
      currencyApi.createCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      setIsCreateModalVisible(false)
      addNotification({
        type: 'success',
        title: '创建成功',
        message: '代币创建成功',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '创建失败',
        message: error.response?.data?.message || '代币创建失败',
      })
    },
  })

  // 更新代币
  const updateCurrencyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCurrencyRequest }) =>
      currencyApi.updateCurrency(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      setIsEditModalVisible(false)
      addNotification({
        type: 'success',
        title: '更新成功',
        message: '代币更新成功',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '更新失败',
        message: error.response?.data?.message || '代币更新失败',
      })
    },
  })

  // 删除代币
  const deleteCurrencyMutation = useMutation({
    mutationFn: (id: number) => currencyApi.deleteCurrency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      addNotification({
        type: 'success',
        title: '删除成功',
        message: '代币删除成功',
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '删除失败',
        message: error.response?.data?.message || '代币删除失败',
      })
    },
  })

  // 处理创建代币
  const handleCreateCurrency = () => {
    setIsCreateModalVisible(true)
  }

  // 处理编辑代币
  const handleEdit = (currency: Currency) => {
    setSelectedCurrency(currency)
    setIsEditModalVisible(true)
  }

  // 处理查看代币详情
  const handleDetail = (currency: Currency) => {
    setSelectedCurrency(currency)
    setIsDetailModalVisible(true)
  }

  // 处理删除代币
  const handleDelete = (id: number) => {
    deleteCurrencyMutation.mutate(id)
  }

  // 提交创建表单
  const handleSubmitCreate = (values: CreateCurrencyRequest) => {
    createCurrencyMutation.mutate(values)
  }

  // 提交编辑表单
  const handleSubmitEdit = (id: number, values: UpdateCurrencyRequest) => {
    updateCurrencyMutation.mutate({ id, data: values })
  }

  // 处理搜索参数变化
  const handleSearchParamsChange = (params: Partial<CurrencyListParams>) => {
    setSearchParams((prev) => ({ ...prev, ...params, page: 1 }))
  }

  // 处理分页变化
  const handlePageChange = (page: number, pageSize: number) => {
    setSearchParams((prev) => ({ ...prev, page, pageSize }))
  }

  if (!hasPermission('currency:list')) {
    return (
      <>
        <Helmet>
          <title>代币管理 - U卡服务管理系统</title>
        </Helmet>
        <div className="currency-list-page">
          <Card className="currency-permission-card">
            <Alert
              message="权限不足"
              description="您没有权限访问代币管理页面"
              type="error"
              showIcon
            />
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>代币管理 - U卡服务管理系统</title>
      </Helmet>

      <div className="currency-list-page">
        <div className="currency-top-layout">
          <aside className="currency-panel currency-sidebar-panel">
            <div className="currency-panel-header currency-sidebar-header">
              <div>
                <span className="currency-panel-eyebrow">Token Registry Control</span>
              </div>
              <p>新增、校准、筛选和快速巡检集中在左侧控制区完成。</p>
            </div>

            <div className="currency-page-actions currency-sidebar-actions">
              <Space wrap>
                <Button
                  className="currency-ghost-btn"
                  icon={<ReloadOutlined />}
                  onClick={() => refetchCurrencies()}
                >
                  刷新数据
                </Button>
                {hasPermission('currency:create') && (
                  <Button
                    type="primary"
                    className="currency-primary-btn"
                    icon={<PlusOutlined />}
                    onClick={handleCreateCurrency}
                  >
                    添加代币
                  </Button>
                )}
              </Space>
            </div>

            <div className="currency-control-stats">
              <div className="currency-control-stat">
                <span>启用中</span>
                <strong>{activeCount}</strong>
              </div>
              <div className="currency-control-stat">
                <span>已接入链</span>
                <strong>{activeChainRegistryCount}</strong>
              </div>
              <div className="currency-control-stat">
                <span>当前停用</span>
                <strong>{disabledCount}</strong>
              </div>
            </div>

            <div className="currency-filter-block">
              <div className="currency-filter-header">
                <span className="currency-panel-eyebrow">Asset Filters</span>
                <h3>筛选工作台</h3>
                <p>按符号、链路、资产类型与状态快速收敛目标 Token。</p>
              </div>

              <CurrencySearchForm
                onSearch={handleSearchParamsChange}
                onReset={() => setSearchParams({ page: 1, pageSize: 20 })}
                chains={normalizedChains}
                chainsLoading={chainsLoading}
                loading={currenciesLoading}
              />
            </div>
          </aside>

          <div className="currency-main-column">
            <section className="currency-hero-card">
              <div className="currency-hero-orb currency-hero-orb-left" />
              <div className="currency-hero-orb currency-hero-orb-right" />
              <div className="currency-hero-top">
                <div className="currency-page-title currency-hero-story">
                  <span className="currency-page-kicker">Token Registry Overview</span>
                  <h1>Token设置</h1>
                  <p className="currency-hero-description">
                    管理平台支持的原生币与合约代币，统一维护链路映射、状态开关与资产元数据。
                  </p>
                  {currencyHighlights.length > 0 && (
                    <div className="currency-highlight-list">
                      {currencyHighlights.map((symbol) => (
                        <span key={symbol} className="currency-highlight-pill">
                          {symbol}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="currency-metrics-grid">
                <div className="currency-metric-card">
                  <span className="currency-metric-label">资产总数</span>
                  <strong>{totalCurrencies}</strong>
                  <p>当前筛选条件下的币种规模</p>
                </div>
                <div className="currency-metric-card">
                  <span className="currency-metric-label">原生币</span>
                  <strong>{nativeCount}</strong>
                  <p>当前页链原生资产数量</p>
                </div>
                <div className="currency-metric-card">
                  <span className="currency-metric-label">合约代币</span>
                  <strong>{tokenCount}</strong>
                  <p>当前页合约资产覆盖情况</p>
                </div>
                <div className="currency-metric-card">
                  <span className="currency-metric-label">链路覆盖</span>
                  <strong>{chainCoverage}</strong>
                  <p>当前页覆盖 {activeChainRegistryCount} 条已接入链配置</p>
                </div>
              </div>
            </section>

            <section className="currency-panel currency-table-panel">
              <div className="currency-panel-header">
                <div>
                  <span className="currency-panel-eyebrow">Registry Matrix</span>
                  <h2>Token列表</h2>
                </div>
                <p>查看所属链、代币类型、精度、合约地址和启用状态。</p>
              </div>

              <CurrencyList
                currencies={currencies}
                loading={currenciesLoading}
                coinGeckoPriceMap={coinGeckoPriceMap}
                coinGeckoPricesLoading={coinGeckoPricesLoading}
                total={totalCurrencies}
                currentPage={searchParams.page || 1}
                pageSize={searchParams.pageSize || 20}
                onPageChange={handlePageChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDetail={handleDetail}
                hasEditPermission={hasPermission('currency:update')}
                hasDeletePermission={hasPermission('currency:delete')}
              />
            </section>
          </div>
        </div>

        {currenciesError && (
          <Alert
            className="currency-alert"
            message="数据加载失败"
            description="无法加载代币列表"
            type="error"
            showIcon
          />
        )}

        {/* 创建代币模态框 */}
        <CurrencyCreateModal
          visible={isCreateModalVisible}
          onCancel={() => setIsCreateModalVisible(false)}
          onSubmit={handleSubmitCreate}
          loading={createCurrencyMutation.isPending}
          chains={normalizedChains}
          chainsLoading={chainsLoading}
        />

        {/* 编辑代币模态框 */}
        <CurrencyEditModal
          visible={isEditModalVisible}
          currency={selectedCurrency}
          onCancel={() => setIsEditModalVisible(false)}
          onSubmit={handleSubmitEdit}
          loading={updateCurrencyMutation.isPending}
          chains={normalizedChains}
          chainsLoading={chainsLoading}
        />

        {/* 代币详情模态框 */}
        <CurrencyDetailModal
          visible={isDetailModalVisible}
          currency={selectedCurrency}
          onClose={() => setIsDetailModalVisible(false)}
        />
      </div>
    </>
  )
}

export default CurrencyListPage
