import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Button,
  Row,
  Col,
  Statistic,
  Table,
  Space,
  Tag,
  Tabs,
  Alert,
  Typography,
  message,
  Divider,
  Avatar,
  Progress,
  Badge,
  Tooltip,
  Empty,
  Modal,
  Form,
  Input,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  StopOutlined,
  PlayCircleOutlined,
  WalletOutlined,
  UserOutlined,
  TransactionOutlined,
  SettingOutlined,
  TrophyOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { StatusBadge, AddressDisplay, AmountDisplay } from '@shared/components'
import { ApiKeyDisplay } from '@/components/Common'
import { Status, TENANT_PLAN_TYPES, TenantFullDetail, TenantStats, Wallet } from '@shared/types'
import dayjs from 'dayjs'
import { tenantApi } from '@/services/apis/tenantApi'
import './TenantDetailPage.css'

const { Title, Text, Paragraph } = Typography

/**
 * 租户详情页面
 */
const TenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuthStore()
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [passwordForm] = Form.useForm()

  // 获取租户详情
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      if (!id) return null
      const response = await tenantApi.getTenant(id)
      return response
    },
    enabled: !!id,
  })

  // 获取租户统计
  const { data: stats = {} as TenantStats } = useQuery({
    queryKey: ['tenantId', id, 'stats'],
    queryFn: () => {
      if (!id) return {} as TenantStats
      return tenantApi.getStats(id)
    },
    enabled: !!id,
  })

  // 重新生成API密钥
  const regenerateApiCredentialsMutation = useMutation({
    mutationFn: () => tenantApi.regenerateAPICredentials(id!),
    onSuccess: (data) => {
      message.success('API密钥已重新生成')
      // 刷新租户数据
      queryClient.invalidateQueries({ queryKey: ['tenant', id] })
    },
    onError: (error: any) => {
      message.error(error.message || '重新生成API密钥失败，请重试')
    },
  })

  // 更新密码
  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      return tenantApi.updatePassword(id!, password)
    },
    onSuccess: () => {
      message.success('密码更新成功')
      setPasswordModalVisible(false)
      passwordForm.resetFields()
    },
    onError: (error: any) => {
      message.error(error.message || '密码更新失败，请重试')
    },
  })

  const handleRegenerateApiCredentials = () => {
    regenerateApiCredentialsMutation.mutate()
  }

  const handleUpdatePassword = async (values: any) => {
    if (!tenant) return
    await tenantApi.updateTenant(tenant.id, {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      allowedIps: tenant.allowedIps || [],
      webhookUrl: tenant.webhookUrl || null,
      webhookSecret: tenant.webhookSecret || null,
      status: tenant.status,
      password: values.password,
    })
    message.success('密码更新成功')
    setPasswordModalVisible(false)
    passwordForm.resetFields()
    queryClient.invalidateQueries({ queryKey: ['tenant', tenant.id] })
  }

  // 获取租户钱包列表
  const { data: wallets = [] } = useQuery({
    queryKey: ['tenantId', id, 'wallets'],
    queryFn: () => {
      if (!id) return []
      return tenantApi.getWallets(id)
    },
    enabled: !!id,
  })

  // 获取租户用户列表
  const { data: users } = useQuery({
    queryKey: ['tenantId', id, 'users'],
    queryFn: () => {
      if (!id) return []
      return tenantApi.getUsers(id)
    },
    enabled: !!id,
  })

  // 更新租户状态
  const updateStatusMutation = useMutation({
    mutationFn: (status: number) => {
      if (!id) return Promise.reject(new Error('租户ID不能为空'))
      return tenantApi.updateStatus(id, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', id] })
      message.success('租户状态更新成功')
    },
  })

  const handleBack = () => {
    navigate('/tenants')
  }

  const handleEdit = () => {
    navigate(`/tenants/${id}/edit`)
  }

  const handleStatusChange = (status: number) => {
    updateStatusMutation.mutate(status)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex justify-center items-center h-64">
        <Empty description="租户不存在" />
      </div>
    )
  }

  // 钱包表格列配置
  const walletColumns = [
    {
      title: '钱包地址',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => (
        <div className="flex items-center space-x-2">
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            W
          </Avatar>
          <AddressDisplay address={address} />
        </div>
      ),
    },
    {
      title: '币种',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string) => (
        <Tag color="processing" className="font-medium">
          {symbol}
        </Tag>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: string, record: Wallet) => (
        <div className="font-medium text-green-600">
          <AmountDisplay amount={balance} symbol={record.coinType} />
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Text type="secondary">
          {dayjs(date).format('YYYY-MM-DD HH:mm:ss')}
        </Text>
      ),
    },
  ]

  // 用户表格列配置
  const userColumns = [
    {
      title: '用户信息',
      dataIndex: 'userName',
      key: 'userName',
      render: (userName: string, record: any) => (
        <div className="flex items-center space-x-2">
          <Avatar size="small" style={{ backgroundColor: '#52c41a' }}>
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color="blue" className="font-medium">
          {role}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => (
        <Text type="secondary">
          {date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '从未登录'}
        </Text>
      ),
    },
  ]

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.ACTIVE:
        return 'green'
      case Status.INACTIVE:
        return 'red'
      default:
        return 'default'
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="shadow-sm"
            >
              返回列表
            </Button>
            <div>
              <Title level={2} className="mb-1">
                {tenant.name}
              </Title>
              <div className="flex items-center space-x-2">
                <StatusBadge status={tenant.status} />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <Space size="middle">
            {hasPermission('tenant:update') && (
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={handleEdit}
                className="shadow-sm"
              >
                编辑租户
              </Button>
            )}

            {hasPermission('tenant:update') && (
              <Button 
                icon={<KeyOutlined />} 
                onClick={() => setPasswordModalVisible(true)}
                className="shadow-sm"
              >
                修改密码
              </Button>
            )}

            {hasPermission('tenant:manage_status') && (
              <>
                {tenant.status === Status.ACTIVE ? (
                  <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={() => handleStatusChange(Status.INACTIVE)}
                    loading={updateStatusMutation.isPending}
                    className="shadow-sm"
                  >
                    暂停租户
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleStatusChange(Status.ACTIVE)}
                    loading={updateStatusMutation.isPending}
                    className="shadow-sm bg-green-500 border-green-500 hover:bg-green-600"
                  >
                    激活租户
                  </Button>
                )}
              </>
            )}
          </Space>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <Row gutter={[24, 24]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-sm border-0 hover:shadow-md transition-shadow duration-300">
                <Statistic
                  title={
                    <div className="flex items-center space-x-2 text-gray-600">
                      <WalletOutlined className="text-blue-500" />
                      <span>钱包数量</span>
                    </div>
                  }
                  value={stats.totalWallets}
                  valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-sm border-0 hover:shadow-md transition-shadow duration-300">
                <Statistic
                  title={
                    <div className="flex items-center space-x-2 text-gray-600">
                      <DollarOutlined className="text-green-500" />
                      <span>总交易量</span>
                    </div>
                  }
                  value={stats.totalVolume}
                  valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                  precision={2}
                  prefix="$"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-sm border-0 hover:shadow-md transition-shadow duration-300">
                <Statistic
                  title={
                    <div className="flex items-center space-x-2 text-gray-600">
                      <RiseOutlined className="text-orange-500" />
                      <span>今日交易量</span>
                    </div>
                  }
                  value={stats.dailyVolume}
                  valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
                  precision={2}
                  prefix="$"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="shadow-sm border-0 hover:shadow-md transition-shadow duration-300">
                <Statistic
                  title={
                    <div className="flex items-center space-x-2 text-gray-600">
                      <TransactionOutlined className="text-purple-500" />
                      <span>总交易数</span>
                    </div>
                  }
                  value={stats.totalTransactions}
                  valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 详细信息 */}
        <Card className="shadow-sm border-0 overflow-hidden" bodyStyle={{ padding: 0 }}>
          <Tabs 
            defaultActiveKey="basic"
            size="large"
            className="tenant-detail-tabs"
            items={[
              {
                key: 'basic',
                label: (
                  <div className="flex items-center space-x-2">
                    <SettingOutlined />
                    <span>基本信息</span>
                  </div>
                ),
                children: (
                  <div className="p-4">
                    <Descriptions 
                      bordered 
                      column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
                      className="tenant-descriptions"
                      size="middle"
                      labelStyle={{ 
                        backgroundColor: '#fafafa', 
                        fontWeight: 'bold',
                        width: '140px',
                        minWidth: '140px',
                        whiteSpace: 'nowrap'
                      }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        padding: '12px 16px'
                      }}
                    >
                      <Descriptions.Item label="租户名称">
                        <Text strong className="text-lg" style={{ fontSize: '16px' }}>
                          {tenant.name}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="租户ID">
                        <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded inline-block">
                          <Text code className="text-xs" style={{ fontSize: '12px' }}>
                            {tenant.id}
                          </Text>
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="状态">
                        <StatusBadge status={tenant.status} />
                      </Descriptions.Item>
                      <Descriptions.Item label="订阅计划">
                        {tenant.planName ? (
                          <div className="space-y-2">
                            <div>
                              <Tag 
                                color={tenant.subscriptionStatus === 1 ? 'green' : tenant.subscriptionStatus === 0 ? 'orange' : 'red'} 
                                icon={<TrophyOutlined />}
                                className="px-3 py-1"
                              >
                                {tenant.planName}
                              </Tag>
                              {tenant.planType && (
                                <Tag color="blue" className="ml-2">
                                  {TENANT_PLAN_TYPES.find(item => item.value === tenant.planType)?.label}
                                </Tag>
                              )}
                            </div>
                            {tenant.subscriptionStatus !== undefined && (
                              <div className="text-sm text-gray-600">
                                状态: <span className={`font-medium ${
                                  tenant.subscriptionStatus === 1 ? 'text-green-600' : 
                                  tenant.subscriptionStatus === 0 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  {tenant.subscriptionStatus === 1 ? '激活' : 
                                   tenant.subscriptionStatus === 0 ? '暂停' : '已删除'}
                                </span>
                                {tenant.daysRemaining !== undefined && tenant.daysRemaining >= 0 && (
                                  <span className="ml-2">
                                    剩余 {tenant.daysRemaining} 天
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Text type="secondary">未订阅计划</Text>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="邮箱地址">
                        <Text copyable>{tenant.email}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="登录次数">
                        <Text>{tenant.loginCount ?? 0} 次</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="最后登录">
                        <Text type="secondary">
                          {tenant.lastLoginAt ? dayjs(tenant.lastLoginAt).format('YYYY-MM-DD HH:mm:ss') : '从未登录'}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="最后登录IP">
                        <Text type="secondary">
                          {tenant.lastLoginIP || '未知'}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="IP白名单" span={2}>
                        {tenant.allowedIps && tenant.allowedIps.length > 0 ? (
                          <div className="space-y-1">
                            {tenant.allowedIps.map((ip, index) => (
                              <Tag key={index} color="blue" className="mb-1">
                                {ip}
                              </Tag>
                            ))}
                          </div>
                        ) : (
                          <Text type="secondary">无限制</Text>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="API密钥" span={2}>
                        {tenant.apiKey && (
                          <div className="space-y-2">
                            <div>
                              <div className="text-sm text-gray-600 mb-1">API Key:</div>
                              <div className="bg-gray-50 p-2 rounded">
                                <Text code copyable className="text-sm">
                                  {tenant.apiKey}
                                </Text>
                              </div>
                            </div>
                            {tenant.apiSecret && (
                              <div>
                                <div className="text-sm text-gray-600 mb-1">API Secret:</div>
                                <div className="bg-gray-50 p-2 rounded">
                                  <Text code copyable className="text-sm">
                                    {tenant.apiSecret}
                                  </Text>
                                </div>
                              </div>
                            )}
                            <div className="mt-2">
                              <Button 
                                type="primary"
                                size="small"
                                onClick={handleRegenerateApiCredentials}
                                loading={regenerateApiCredentialsMutation.isPending}
                                disabled={!hasPermission('tenant:update')}
                              >
                                生成密钥
                              </Button>
                            </div>
                          </div>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="回调URL" span={2}>
                        {tenant.webhookUrl ? (
                          <div className="bg-gray-50 p-2 rounded">
                            <Text code copyable className="text-sm">
                              {tenant.webhookUrl}
                            </Text>
                          </div>
                        ) : (
                          <Text type="secondary">未设置</Text>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="创建时间">
                        <Text type="secondary">
                          {dayjs(tenant.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="更新时间">
                        <Text type="secondary">
                          {dayjs(tenant.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                ),
              },
              {
                key: 'wallets',
                label: (
                  <div className="flex items-center space-x-2">
                    <WalletOutlined />
                    <span>钱包管理</span>
                    <Badge count={wallets?.length || 0} showZero color="#1890ff" />
                  </div>
                ),
                children: (
                  <div className="p-4">
                    {tenant.status !== Status.ACTIVE && (
                      <Alert
                        message="租户状态异常"
                        description="当前租户未激活，钱包功能可能受限"
                        type="warning"
                        showIcon
                        className="mb-6 rounded-lg"
                      />
                    )}
                    <Table
                      columns={walletColumns}
                      dataSource={wallets || []}
                      rowKey="id"
                      pagination={{ 
                        pageSize: 10,
                        showTotal: (total) => `共 ${total} 个钱包`,
                        showSizeChanger: true,
                      }}
                      className="wallet-table"
                      scroll={{ x: 800 }}
                      locale={{ emptyText: <Empty description="暂无钱包数据" /> }}
                    />
                  </div>
                ),
              },
              {
                key: 'users',
                label: (
                  <div className="flex items-center space-x-2">
                    <TeamOutlined />
                    <span>用户管理</span>
                    <Badge count={users?.length || 0} showZero color="#52c41a" />
                  </div>
                ),
                children: (
                  <div className="p-4">
                    <Table
                      columns={userColumns}
                      dataSource={users || []}
                      rowKey="id"
                      pagination={{ 
                        pageSize: 10,
                        showTotal: (total) => `共 ${total} 个用户`,
                        showSizeChanger: true,
                      }}
                      className="user-table"
                      scroll={{ x: 800 }}
                      locale={{ emptyText: <Empty description="暂无用户数据" /> }}
                    />
                  </div>
                ),
              },
              {
                key: 'transactions',
                label: (
                  <div className="flex items-center space-x-2">
                    <TransactionOutlined />
                    <span>交易记录</span>
                  </div>
                ),
                children: (
                  <div className="p-4">
                    <div className="text-center py-16">
                      <TransactionOutlined className="text-6xl text-gray-300 mb-4" />
                      <Title level={4} type="secondary">
                        交易记录功能开发中
                      </Title>
                      <Paragraph type="secondary">
                        该功能正在开发中，敬请期待...
                      </Paragraph>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {/* 密码修改模态框 */}
      <Modal
        title="修改租户密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false)
          passwordForm.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleUpdatePassword}
        >
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <div className="flex justify-end space-x-4">
            <Button onClick={() => {
              setPasswordModalVisible(false)
              passwordForm.resetFields()
            }}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatePasswordMutation.isPending}
            >
              确认修改
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  )
}

export default TenantDetailPage 