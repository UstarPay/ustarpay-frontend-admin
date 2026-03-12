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
  const [isScanHeightModalVisible, setIsScanHeightModalVisible] = useState(false)
  const [searchParams, setSearchParams] = useState<ChainListParams>({
    page: 1,
    pageSize: 20
  })

  // 获取区块链网络列表
  const {
    data: chainListResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['chains', searchParams],
    queryFn: () => chainApi.getChains(searchParams),
    enabled: hasPermission('chain:list')
  })

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
        message: '区块链网络创建成功' 
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
        message: '区块链网络删除成功' 
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
        message: '区块链网络信息更新成功' 
      })
    } catch (error: any) {
      handleError(error, '更新失败')
    }
  }



  const handleScanHeightSubmit = async (chainCode: string, scanHeight: number) => {
    try {
      await chainApi.updateScanHeight(chainCode, scanHeight)
      queryClient.invalidateQueries({ queryKey: ['chains'] })
      setIsScanHeightModalVisible(false)
      setSelectedChain(null)
      addNotification({ 
        type: 'success', 
        title: '更新成功', 
        message: '扫描高度更新成功' 
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
      <Card>
        <Alert
          message="权限不足"
          description="您没有权限访问区块链网络管理页面"
          type="error"
          showIcon
        />
      </Card>
    )
  }

  return (
    <div className="chain-list-page">
      <div className="page-header">
        <div className="page-title">
          <h1>区块链网络管理</h1>
          <p>管理和配置区块链网络信息</p>
        </div>
        <div className="page-actions">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
            {hasPermission('chain:create') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalVisible(true)}
              >
                创建区块链网络
              </Button>
            )}
          </Space>
        </div>
      </div>

      <Card>
        {/* 搜索表单 */}
        <ChainSearchForm 
          onSearch={handleSearch} 
          onReset={() => setSearchParams({ page: 1, pageSize: 20 })}
          loading={isLoading}
        />

        {/* 错误提示 */}
        {error && (
          <Alert
            message="加载失败"
            description={error.message || '获取区块链网络列表失败'}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 区块链网络列表 */}
        <ChainList
          data={chainListResponse?.items || []}
          loading={isLoading}
          pagination={{
            current: searchParams.page || 1,
            pageSize: searchParams.pageSize || 20,
            total: chainListResponse?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateScanHeight={handleUpdateScanHeight}
          onPaginationChange={handlePaginationChange}
        />
      </Card>

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
