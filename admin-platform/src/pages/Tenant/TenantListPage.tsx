import { useState } from 'react'
import {
  Button,
  Card,
  Dropdown,
  Table,
  Tag,
  message,
  Modal,
  Select,
  Input,
  Typography,
  Progress,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import type { TenantFullDetail, PaginatedResponse } from '@shared/types'
import { ListParams } from '@shared/types'
import { tenantApi } from '@/services/apis/tenantApi'

const { Title } = Typography
const { Search } = Input

/**
 * 租户列表页面
 */
const TenantListPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [params, setParams] = useState<ListParams>({
    page: 1,
    pageSize: 10,
  })

  // 获取租户列表
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tenants', params],
    queryFn: async (): Promise<PaginatedResponse<TenantFullDetail>> => {
      const response = await tenantApi.getTenants(params)
      return response
    },
  })

  // 删除租户
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!id) return Promise.reject(new Error('租户ID不能为空'))
      return tenantApi.deleteTenant(id)
    },
    onSuccess: () => {
      message.success('租户删除成功')
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })

  // 状态映射
  const getStatusConfig = (status: number) => {
    switch (status) {
      case 1:
        return { text: '正常', color: 'green' }
      case 0:
        return { text: '暂停', color: 'orange' }
      case -1:
        return { text: '删除', color: 'red' }
      default:
        return { text: '未知', color: 'gray' }
    }
  }

  // 订阅状态映射
  const getSubscriptionStatusConfig = (status?: number) => {
    switch (status) {
      case 1:
        return { text: '活跃', color: 'green' }
      case 0:
        return { text: '暂停', color: 'orange' }
      case -1:
        return { text: '已取消', color: 'red' }
      default:
        return { text: '无订阅', color: 'gray' }
    }
  }

  // 计算剩余天数进度条
  const renderRemainingDays = (daysRemaining?: number, subscriptionEnd?: string) => {
    if (!daysRemaining || !subscriptionEnd) {
      return <span className="text-gray-400">-</span>
    }

    const totalDays = dayjs(subscriptionEnd).diff(dayjs(), 'day', true)
    const startDate = dayjs(subscriptionEnd).subtract(totalDays, 'day')
    const usedDays = dayjs().diff(startDate, 'day')
    const progress = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 100

    let status: 'success' | 'normal' | 'exception' = 'success'
    if (daysRemaining <= 7) {
      status = 'exception'
    } else if (daysRemaining <= 30) {
      status = 'normal'
    }

    return (
      <Tooltip title={`剩余 ${daysRemaining} 天，截止到 ${dayjs(subscriptionEnd).format('YYYY-MM-DD')}`}>
        <Progress
          percent={progress}
          status={status}
          size="small"
          format={() => `${daysRemaining}天`}
        />
      </Tooltip>
    )
  }

  // 表格列定义
  const columns: ColumnsType<TenantFullDetail> = [
    {
      title: '租户信息',
      key: 'tenantInfo',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name}</div>
          <div className="text-xs text-gray-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => {
        const config = getStatusConfig(status)
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '订阅计划',
      key: 'plan',
      width: 180,
      render: (_, record) => (
        <div>
          {record.planName ? (
            <>
              <div className="font-medium">{record.planName}</div>
              <div className="text-xs text-gray-500">
                {record.planType} - ${record.priceUsdt}/{record.durationMonths}月
              </div>
            </>
          ) : (
            <span className="text-gray-400">无计划</span>
          )}
        </div>
      ),
    },
    {
      title: '订阅状态',
      dataIndex: 'subscriptionStatus',
      key: 'subscriptionStatus',
      width: 100,
      render: (status?: number) => {
        const config = getSubscriptionStatusConfig(status)
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '剩余时间',
      key: 'remaining',
      width: 120,
      render: (_, record) => renderRemainingDays(record.daysRemaining, record.subscriptionEnd),
    },
    {
      title: '限制配置',
      key: 'limits',
      width: 150,
      render: (_, record) => (
        <div className="text-xs space-y-1">
          <div>钱包: {record.walletLimit || '无限制'}</div>
          <div>货币: {record.currencyLimit || '无限制'}</div>
          <div>API: {record.rateLimitPerMinute || '无限制'}/分钟</div>
        </div>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 120,
      render: (date) => {
        if (!date) return <span className="text-gray-400">从未登录</span>
        return (
          <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
            <span>{dayjs(date).fromNow()}</span>
          </Tooltip>
        )
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => dayjs(date).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: '查看详情',
            onClick: () => navigate(`/tenants/${record.id}`),
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '编辑',
            onClick: () => navigate(`/tenants/${record.id}/edit`),
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除租户 "${record.name}" 吗？此操作不可恢复。`,
                okText: '确定',
                okType: 'danger',
                cancelText: '取消',
                onOk: () => deleteMutation.mutate(record.id),
              })
            },
          },
        ]

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <>
      <Helmet>
        <title>租户管理 - U卡服务管理系统</title>
      </Helmet>

      <div className="space-y-4">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <Title level={2} className="mb-0">
            租户管理
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/tenants/create')}
          >
            新建租户
          </Button>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <div className="flex flex-wrap gap-4 items-center">
            <Search
              placeholder="搜索租户名称、邮箱"
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => {
                setParams((prev) => ({ ...prev, search: value, page: 1 }))
              }}
            />

            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => {
                setParams((prev) => ({ ...prev, status: value, page: 1 }))
              }}
              options={[
                { label: '正常', value: 1 },
                { label: '暂停', value: 0 },
                { label: '删除', value: -1 },
              ]}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              刷新
            </Button>
          </div>
        </Card>

        {/* 租户列表 */}
        <Card>
          <Table
            dataSource={data?.items}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1400 }}
            pagination={{
              current: params.page,
              pageSize: params.pageSize,
              total: data?.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              onChange: (page, pageSize) => {
                setParams((prev) => ({ ...prev, page, pageSize }))
              },
            }}
          />
        </Card>
      </div>
    </>
  )
}

export default TenantListPage
