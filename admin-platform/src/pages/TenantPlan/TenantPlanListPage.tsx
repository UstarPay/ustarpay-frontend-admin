import React, { useState } from 'react'
import { Card, Typography, Alert, Table, Tag, Space, Button, Input, Select, Modal, message } from 'antd'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  SearchOutlined, 
  ReloadOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons'
import tenantPlanService from '@/services/apis/tenantPlanApi'
import { useAuthStore } from '@/stores/authStore'
import { 
  TenantPlan,
  TenantPlanListParams,
  TENANT_PLAN_TYPES,
  TENANT_PLAN_STATUS_OPTIONS
} from '@shared/types/tenantPlan'
import TenantPlanModal from './components/TenantPlanModal'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

/**
 * 租户计划管理页面
 */
const TenantPlanListPage: React.FC = () => {
  const { hasPermission } = useAuthStore()
  const queryClient = useQueryClient()
  
  // 查询参数状态
  const [queryParams, setQueryParams] = useState<TenantPlanListParams>({
    page: 1,
    pageSize: 10
  })
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan | undefined>()

  // 获取租户计划列表
  const {
    data: plansResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tenant-plans', queryParams],
    queryFn: () => tenantPlanService.plan.getTenantPlans(queryParams),
    enabled: hasPermission('tenant:plans:list')
  })

  const plans = plansResponse?.items || []
  const total = plansResponse?.total || 0

  // 删除租户计划mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => tenantPlanService.plan.deleteTenantPlan(id),
    onSuccess: () => {
      message.success('租户计划删除成功')
      queryClient.invalidateQueries({ queryKey: ['tenant-plans'] })
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.message}`)
    }
  })

  // 权限检查
  if (!hasPermission('tenant:plans:list')) {
    return (
      <>
        <Helmet>
          <title>租户计划管理 - U卡服务管理系统</title>
        </Helmet>
        <Alert
          message="权限不足"
          description="您没有权限查看租户计划信息"
          type="warning"
          showIcon
        />
      </>
    )
  }

  // 错误处理
  if (error) {
    return (
      <>
        <Helmet>
          <title>租户计划管理 - U卡服务管理系统</title>
        </Helmet>
        <Alert
          message="加载失败"
          description="无法加载租户计划信息，请检查网络连接或联系管理员。"
          type="error"
          showIcon
        />
      </>
    )
  }

  // 操作处理函数
  const handleCreate = () => {
    setModalMode('create')
    setSelectedPlan(undefined)
    setModalVisible(true)
  }

  const handleEdit = (plan: TenantPlan) => {
    setModalMode('edit')
    setSelectedPlan(plan)
    setModalVisible(true)
  }

  const handleDelete = (plan: TenantPlan) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除租户计划 "${plan.name}" 吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        deletePlanMutation.mutate(plan.id)
      }
    })
  }

  const handleModalClose = () => {
    setModalVisible(false)
    setSelectedPlan(undefined)
  }

  const handleRefresh = () => {
    refetch()
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    setQueryParams(prev => ({ ...prev, search: value, page: 1 }))
  }

  // 类型筛选
  const handleTypeFilter = (type: string | undefined) => {
    setQueryParams(prev => ({ ...prev, type, page: 1 }))
  }

  // 状态筛选
  const handleStatusFilter = (status: number | undefined) => {
    setQueryParams(prev => ({ ...prev, status, page: 1 }))
  }

  // 分页处理
  const handleTableChange = (page: number, pageSize?: number) => {
    setQueryParams(prev => ({ ...prev, page, pageSize: pageSize || prev.pageSize }))
  }

  // 格式化价格显示
  const formatPrice = (price: string) => {
    return `${price} USDT`
  }

  // 格式化限制显示
  const formatLimit = (limit?: number, unit: string = '') => {
    return limit ? `${limit}${unit}` : '无限制'
  }

  // 表格列定义
  const columns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left' as const
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeOption = TENANT_PLAN_TYPES.find(t => t.value === type)
        return <Tag color="blue">{typeOption?.label || type}</Tag>
      }
    },
    {
      title: '持续时间',
      dataIndex: 'durationMonths',
      key: 'durationMonths',
      width: 120,
      render: (months: number) => `${months}个月`
    },
    {
      title: '钱包限制',
      dataIndex: 'walletLimit',
      key: 'walletLimit',
      width: 120,
      render: (limit?: number) => formatLimit(limit, '个')
    },
    {
      title: '货币限制',
      dataIndex: 'currencyLimit',
      key: 'currencyLimit',
      width: 120,
      render: (limit?: number) => formatLimit(limit, '种')
    },
    {
      title: '速率限制',
      dataIndex: 'rateLimitPerMinute',
      key: 'rateLimitPerMinute',
      width: 120,
      render: (limit?: number) => formatLimit(limit, '次/分钟')
    },
    {
      title: '价格',
      dataIndex: 'priceUSDT',
      key: 'priceUSDT',
      width: 120,
      render: (price: string) => formatPrice(price)
    },
    {
      title: '活跃订阅',
      dataIndex: 'activeSubscriptions',
      key: 'activeSubscriptions',
      width: 120,
      render: (count?: number) => count || 0
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status?: number) => {
        const statusOption = TENANT_PLAN_STATUS_OPTIONS.find(s => s.value === status)
        return statusOption ? (
          <Tag color={statusOption.color}>{statusOption.label}</Tag>
        ) : (
          <Tag>未知</Tag>
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'operations',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: TenantPlan) => (
        <Space size="small">
          {hasPermission('tenant:plans:detail') && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              title="查看详情"
            />
          )}
          {hasPermission('tenant:plans:update') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              title="编辑"
            />
          )}
          {hasPermission('tenant:plans:delete') && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              title="删除"
            />
          )}
        </Space>
      )
    }
  ]

  return (
    <>
      <Helmet>
        <title>租户计划管理 - U卡服务管理系统</title>
      </Helmet>

      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <Title level={2}>租户计划管理</Title>
          <Space>
            {hasPermission('tenant:plans:create') && (
              <Button 
                type="primary"
                icon={<PlusOutlined />} 
                onClick={handleCreate}
              >
                创建计划
              </Button>
            )}
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={isLoading}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 筛选工具栏 */}
        <Card size="small">
          <Space wrap>
            <Search
              placeholder="搜索计划名称"
              allowClear
              style={{ width: 250 }}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
            />
            <Select
              placeholder="计划类型"
              allowClear
              style={{ width: 150 }}
              value={queryParams.type}
              onChange={handleTypeFilter}
            >
              {TENANT_PLAN_TYPES.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              value={queryParams.status}
              onChange={handleStatusFilter}
            >
              {TENANT_PLAN_STATUS_OPTIONS.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </Space>
        </Card>

        {/* 租户计划表格 */}
        <Card>
          <Table
            dataSource={plans}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1400 }}
            pagination={{
              current: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              onChange: handleTableChange,
              onShowSizeChange: handleTableChange
            }}
          />
        </Card>
      </div>

      {/* 租户计划模态框 */}
      <TenantPlanModal
        visible={modalVisible}
        onCancel={handleModalClose}
        plan={selectedPlan}
        mode={modalMode}
      />
    </>
  )
}

export default TenantPlanListPage 
