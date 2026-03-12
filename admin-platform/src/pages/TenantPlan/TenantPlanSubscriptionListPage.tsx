import React, { useState } from 'react'
import { Card, Typography, Alert, Table, Tag, Space, Button, Input, Select, Modal, message, DatePicker } from 'antd'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { 
  SearchOutlined, 
  ReloadOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  StopOutlined
} from '@ant-design/icons'
import tenantPlanService from '@/services/apis/tenantPlanApi'
import { tenantApi } from '@/services/apis/tenantApi'
import { useAuthStore } from '@/stores/authStore'
import { 
  TenantPlanSubscription,
  TenantPlanSubscriptionListParams,
  SUBSCRIPTION_STATUS_OPTIONS,
  TENANT_PLAN_TYPES
} from '@shared/types/tenantPlan'
import TenantPlanSubscriptionModal from './components/TenantPlanSubscriptionModal'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

/**
 * 租户计划订阅管理页面
 */
const TenantPlanSubscriptionListPage: React.FC = () => {
  const { hasPermission } = useAuthStore()
  const queryClient = useQueryClient()
  
  // 查询参数状态
  const [queryParams, setQueryParams] = useState<TenantPlanSubscriptionListParams>({
    page: 1,
    pageSize: 10,
    withTenant: true,
    withPlan: true
  })
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedSubscription, setSelectedSubscription] = useState<TenantPlanSubscription | undefined>()

  // 获取租户计划订阅列表
  const {
    data: subscriptionsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tenant-plan-subscriptions', queryParams],
    queryFn: () => tenantPlanService.subscription.getTenantPlanSubscriptions(queryParams),
    enabled: hasPermission('tenant:plans:subscription:list')
  })

  const subscriptions = subscriptionsResponse?.items || []
  const total = subscriptionsResponse?.total || 0

  // 获取租户列表（用于筛选）
  const { data: tenantsResponse } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getTenants({ page: 1, pageSize: 1000 }),
    enabled: hasPermission('tenant:plans:subscription:list')
  })

  const tenants = tenantsResponse?.items || []

  // 获取租户计划列表（用于筛选）
  const { data: plansResponse } = useQuery({
    queryKey: ['tenant-plans'],
    queryFn: () => tenantPlanService.plan.getTenantPlans({ page: 1, pageSize: 1000 }),
    enabled: hasPermission('tenant:plans:subscription:list')
  })

  const plans = plansResponse?.items || []

  // 取消订阅mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: (id: string) => tenantPlanService.subscription.cancelTenantPlanSubscription(id),
    onSuccess: () => {
      message.success('订阅取消成功')
      queryClient.invalidateQueries({ queryKey: ['tenant-plan-subscriptions'] })
    },
    onError: (error: any) => {
      message.error(`取消失败: ${error.message}`)
    }
  })

  // 删除订阅mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: (id: string) => tenantPlanService.subscription.deleteTenantPlanSubscription(id),
    onSuccess: () => {
      message.success('订阅删除成功')
      queryClient.invalidateQueries({ queryKey: ['tenant-plan-subscriptions'] })
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.message}`)
    }
  })

  // 权限检查
  if (!hasPermission('tenant:plans:subscription:list')) {
    return (
      <>
        <Helmet>
          <title>租户计划订阅管理 - NH资产钱包托管系统</title>
        </Helmet>
        <Alert
          message="权限不足"
          description="您没有权限查看租户计划订阅信息"
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
          <title>租户计划订阅管理 - NH资产钱包托管系统</title>
        </Helmet>
        <Alert
          message="加载失败"
          description="无法加载租户计划订阅信息，请检查网络连接或联系管理员。"
          type="error"
          showIcon
        />
      </>
    )
  }

  // 操作处理函数
  const handleCreate = () => {
    setModalMode('create')
    setSelectedSubscription(undefined)
    setModalVisible(true)
  }

  const handleEdit = (subscription: TenantPlanSubscription) => {
    setModalMode('edit')
    setSelectedSubscription(subscription)
    setModalVisible(true)
  }

  const handleCancel = (subscription: TenantPlanSubscription) => {
    Modal.confirm({
      title: '确认取消订阅',
      content: `确定要取消 "${subscription.tenant?.name}" 的订阅吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        cancelSubscriptionMutation.mutate(subscription.id)
      }
    })
  }

  const handleDelete = (subscription: TenantPlanSubscription) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${subscription.tenant?.name}" 的订阅记录吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        deleteSubscriptionMutation.mutate(subscription.id)
      }
    })
  }

  const handleModalClose = () => {
    setModalVisible(false)
    setSelectedSubscription(undefined)
  }

  const handleRefresh = () => {
    refetch()
  }

  // 租户筛选
  const handleTenantFilter = (tenantId: string | undefined) => {
    setQueryParams(prev => ({ ...prev, tenantId, page: 1 }))
  }

  // 计划筛选
  const handlePlanFilter = (planId: string | undefined) => {
    setQueryParams(prev => ({ ...prev, planId, page: 1 }))
  }

  // 状态筛选
  const handleStatusFilter = (status: number | undefined) => {
    setQueryParams(prev => ({ ...prev, status, page: 1 }))
  }

  // 日期范围筛选
  const handleDateRangeFilter = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    const [startDate, endDate] = dates || [null, null]
    setQueryParams(prev => ({
      ...prev,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      page: 1
    }))
  }

  // 分页处理
  const handleTableChange = (page: number, pageSize?: number) => {
    setQueryParams(prev => ({ ...prev, page, pageSize: pageSize || prev.pageSize }))
  }

  // 计算剩余天数
  const calculateRemainingDays = (endAt: string) => {
    const endDate = dayjs(endAt)
    const now = dayjs()
    const days = endDate.diff(now, 'day')
    return days > 0 ? days : 0
  }

  // 表格列定义
  const columns = [
    {
      title: '租户',
      key: 'tenant',
      width: 200,
      fixed: 'left' as const,
             render: (_: any, record: TenantPlanSubscription) => (
         <div>
           <div>{record.tenant?.name}</div>
           <div className="text-gray-500 text-sm">ID: {record.tenant?.id}</div>
         </div>
       )
    },
    {
      title: '计划',
      key: 'plan',
      width: 200,
      render: (_: any, record: TenantPlanSubscription) => (
        <div>
          <div>{record.plan?.name}</div>
          <div className="text-gray-500 text-sm">
            {TENANT_PLAN_TYPES.find(t => t.value === record.plan?.type)?.label} - {record.plan?.priceUSDT} USDT
          </div>
        </div>
      )
    },
    {
      title: '开始时间',
      dataIndex: 'startAt',
      key: 'startAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '结束时间',
      dataIndex: 'endAt',
      key: 'endAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '剩余天数',
      dataIndex: 'endAt',
      key: 'remainingDays',
      width: 120,
      render: (endAt: string) => {
        const days = calculateRemainingDays(endAt)
        let color = 'green'
        if (days === 0) color = 'red'
        else if (days <= 7) color = 'orange'
        else if (days <= 30) color = 'gold'
        
        return <Tag color={color}>{days}天</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status?: number) => {
        const statusOption = SUBSCRIPTION_STATUS_OPTIONS.find(s => s.value === status)
        return statusOption ? (
          <Tag color={statusOption.color}>{statusOption.label}</Tag>
        ) : (
          <Tag>未知</Tag>
        )
      }
    },
    {
      title: '支付交易',
      dataIndex: 'paymentTxHash',
      key: 'paymentTxHash',
      width: 120,
      render: (hash?: string) => hash ? (
        <span className="font-mono text-sm">{hash.slice(0, 10)}...</span>
      ) : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'operations',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: TenantPlanSubscription) => (
        <Space size="small">
          {hasPermission('tenant:plans:subscription:detail') && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              title="查看详情"
            />
          )}
          {hasPermission('tenant:plans:subscription:update') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              title="编辑"
            />
          )}
          {hasPermission('tenant:plans:subscription:cancel') && record.status === 1 && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleCancel(record)}
              title="取消订阅"
            />
          )}
          {hasPermission('tenant:plans:subscription:delete') && (
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
        <title>租户计划订阅管理 - NH资产钱包托管系统</title>
      </Helmet>

      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <Title level={2}>租户计划订阅管理</Title>
          <Space>
            {hasPermission('tenant:plans:subscription:create') && (
              <Button 
                type="primary"
                icon={<PlusOutlined />} 
                onClick={handleCreate}
              >
                创建订阅
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
            <Select
              placeholder="选择租户"
              allowClear
              style={{ width: 200 }}
              value={queryParams.tenantId}
              onChange={handleTenantFilter}
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
                             {tenants.map(tenant => (
                 <Option key={tenant.id} value={tenant.id}>
                   {tenant.name}
                 </Option>
               ))}
            </Select>
            <Select
              placeholder="选择计划"
              allowClear
              style={{ width: 200 }}
              value={queryParams.planId}
              onChange={handlePlanFilter}
            >
              {plans.map(plan => (
                <Option key={plan.id} value={plan.id}>
                  {plan.name}
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
              {SUBSCRIPTION_STATUS_OPTIONS.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: 250 }}
              onChange={handleDateRangeFilter}
            />
          </Space>
        </Card>

        {/* 订阅表格 */}
        <Card>
          <Table
            dataSource={subscriptions}
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

      {/* 订阅模态框 */}
      <TenantPlanSubscriptionModal
        visible={modalVisible}
        onCancel={handleModalClose}
        subscription={selectedSubscription}
        mode={modalMode}
      />
    </>
  )
}

export default TenantPlanSubscriptionListPage 