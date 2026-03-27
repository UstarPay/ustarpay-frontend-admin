import React, { useState } from 'react'
import { Card, Button, Space, Typography, Alert } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import currencyApi from '@/services/apis/currencyApi'
import chainApi from '@/services/apis/chainApi'
import type { Currency, CreateCurrencyRequest, UpdateCurrencyRequest, CurrencyListParams } from '@shared/types/currency'
import type { Chain, ChainListResponse } from '@shared/types/chain'

// Import components
import CurrencyList from './components/CurrencyList'
import CurrencyCreateModal from './components/CurrencyCreateModal'
import CurrencyEditModal from './components/CurrencyEditModal'
import CurrencyDetailModal from './components/CurrencyDetailModal'
import CurrencySearchForm from './components/CurrencySearchForm'

const { Title } = Typography

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
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)
  const [searchParams, setSearchParams] = useState<CurrencyListParams>({
    page: 1,
    pageSize: 20
  })

  // 获取活跃的区块链网络列表（用于下拉选择）
  const {
    data: activeChains,
    isLoading: chainsLoading
  } = useQuery({
    queryKey: ['chains', 'active'],
    queryFn: () => chainApi.getActiveChains(),
    enabled: hasPermission('chain:list')
  })

  const normalizedChains: Chain[] = Array.isArray(activeChains)
    ? (activeChains as Chain[])
    : ((activeChains as ChainListResponse | undefined)?.items || [])

  // 获取代币列表
  const {
    data: currencyListData,
    isLoading: currenciesLoading,    error: currenciesError
  } = useQuery({
    queryKey: ['currencies', searchParams],
    queryFn: () => currencyApi.getCurrencies(searchParams),
    enabled: hasPermission('currency:list')
  })

  // 创建代币
  const createCurrencyMutation = useMutation({
    mutationFn: (data: CreateCurrencyRequest) => currencyApi.createCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      setIsCreateModalVisible(false)
      addNotification({
        type: 'success',
        title: '创建成功',
        message: '代币创建成功'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '创建失败',
        message: error.response?.data?.message || '代币创建失败'
      })
    }
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
        message: '代币更新成功'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '更新失败',
        message: error.response?.data?.message || '代币更新失败'
      })
    }
  })

  // 删除代币
  const deleteCurrencyMutation = useMutation({
    mutationFn: (id: number) => currencyApi.deleteCurrency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
      addNotification({
        type: 'success',
        title: '删除成功',
        message: '代币删除成功'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '删除失败',
        message: error.response?.data?.message || '代币删除失败'
      })
    }
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
    setSearchParams(prev => ({ ...prev, ...params, page: 1 }))
  }

  // 处理分页变化
  const handlePageChange = (page: number, pageSize: number) => {
    setSearchParams(prev => ({ ...prev, page, pageSize }))
  }

  return (
    <>
      <Helmet>
        <title>代币管理 - U卡服务管理系统</title>
      </Helmet>

      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space size={16} style={{ width: '100%', justifyContent: 'space-between' }}>
              <Title level={4} style={{ margin: 0 }}>
                代币管理
              </Title>
              {hasPermission('currency:create') && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateCurrency}
                >
                  添加代币
                </Button>
              )}
            </Space>
          </div>

          {/* 搜索表单 */}
          <CurrencySearchForm
            onSearch={handleSearchParamsChange}
            onReset={() => setSearchParams({ page: 1, pageSize: 20 })}
            chains={normalizedChains}
            chainsLoading={chainsLoading}
          />

          {currenciesError && (
            <Alert
              message="数据加载失败"
              description="无法加载代币列表"
              type="error"
              style={{ marginBottom: 16 }}
            />
          )}

          {/* 代币列表 */}
          <CurrencyList
            currencies={currencyListData?.items || []}
            loading={currenciesLoading}
            total={currencyListData?.total || 0}
            currentPage={searchParams.page || 1}
            pageSize={searchParams.pageSize || 20}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDetail={handleDetail}
            hasEditPermission={hasPermission('currency:update')}
            hasDeletePermission={hasPermission('currency:delete')}
          />

        </Card>

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
