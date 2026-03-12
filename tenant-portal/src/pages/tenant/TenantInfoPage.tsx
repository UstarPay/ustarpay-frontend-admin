import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Descriptions, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Divider,
  Alert,
  Progress,
  Statistic
} from 'antd'
import { 
  UserOutlined, 
  CalendarOutlined, 
  SettingOutlined,
  CrownOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import { tenantService } from '@/services'

const { Title, Text } = Typography

interface TenantInfo {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive' | 'suspended'
  plan: {
    name: string
    level: string
    features: string[]
    limits: {
      wallets: number
      transactions: number
      apiCalls: number
    }
  }
  subscription: {
    startDate: string
    endDate: string
    autoRenew: boolean
    status: 'active' | 'expired' | 'cancelled'
  }
  config: {
    ipWhitelist: string[]
    webhookUrl?: string
    notificationEmail?: string
  }
  kyc: {
    status: 'pending' | 'approved' | 'rejected'
    submittedAt?: string
    approvedAt?: string
  }
}

const TenantInfoPage: React.FC = () => {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTenantInfo()
  }, [])

  const loadTenantInfo = async () => {
    try {
      setLoading(true)
      const data = await tenantService.getTenantInfo()
      setTenantInfo(data.data)
    } catch (error) {
      console.error('加载租户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'suspended': return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '正常'
      case 'inactive': return '未激活'
      case 'suspended': return '已暂停'
      default: return status
    }
  }

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'pending': return 'processing'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getKycStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '已通过'
      case 'pending': return '审核中'
      case 'rejected': return '已拒绝'
      default: return status
    }
  }

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'expired': return 'error'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getSubscriptionStatusText = (status: string) => {
    switch (status) {
      case 'active': return '有效'
      case 'expired': return '已过期'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (!tenantInfo) {
    return <Alert message="无法加载租户信息" type="error" />
  }

  const daysUntilExpiry = Math.ceil(
    (new Date(tenantInfo.subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="p-6">
      <Title level={2}>租户信息</Title>

      {/* 基本信息 */}
      <Card title="基本信息" className="mb-6">
        <Descriptions column={2}>
          <Descriptions.Item label="租户名称">
            <Text strong>{tenantInfo.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            {tenantInfo.email}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(tenantInfo.status)}>
              {getStatusText(tenantInfo.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="租户ID">
            {tenantInfo.id}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 套餐信息 */}
      <Card 
        title={
          <Space>
            <CrownOutlined />
            <span>当前套餐</span>
          </Space>
        }
        className="mb-6"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Descriptions column={1}>
              <Descriptions.Item label="套餐名称">
                <Text strong>{tenantInfo.plan.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="套餐等级">
                <Tag color="blue">{tenantInfo.plan.level}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="功能特性">
                <Space wrap>
                  {tenantInfo.plan.features.map((feature, index) => (
                    <Tag key={index} color="green">{feature}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Title level={4}>使用限制</Title>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="钱包数量"
                  value={tenantInfo.plan.limits.wallets}
                  suffix="个"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="交易数量"
                  value={tenantInfo.plan.limits.transactions}
                  suffix="笔/月"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="API调用"
                  value={tenantInfo.plan.limits.apiCalls}
                  suffix="次/月"
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 订阅信息 */}
      <Card 
        title={
          <Space>
            <CalendarOutlined />
            <span>订阅信息</span>
          </Space>
        }
        className="mb-6"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Descriptions column={1}>
              <Descriptions.Item label="订阅状态">
                <Tag color={getSubscriptionStatusColor(tenantInfo.subscription.status)}>
                  {getSubscriptionStatusText(tenantInfo.subscription.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {new Date(tenantInfo.subscription.startDate).toLocaleDateString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {new Date(tenantInfo.subscription.endDate).toLocaleDateString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="自动续费">
                <Tag color={tenantInfo.subscription.autoRenew ? 'success' : 'default'}>
                  {tenantInfo.subscription.autoRenew ? '开启' : '关闭'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            {daysUntilExpiry > 0 && (
              <div>
                <Text>距离到期还有 {daysUntilExpiry} 天</Text>
                <Progress 
                  percent={Math.max(0, 100 - (daysUntilExpiry / 30) * 100)} 
                  status={daysUntilExpiry < 7 ? 'exception' : 'active'}
                  strokeColor={daysUntilExpiry < 7 ? '#ff4d4f' : '#1890ff'}
                />
                {daysUntilExpiry < 7 && (
                  <Alert 
                    message="套餐即将到期，请及时续费" 
                    type="warning" 
                    showIcon 
                    className="mt-2"
                  />
                )}
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* KYC信息 */}
      <Card 
        title={
          <Space>
            <SafetyCertificateOutlined />
            <span>KYC认证</span>
          </Space>
        }
        className="mb-6"
      >
        <Descriptions column={2}>
          <Descriptions.Item label="认证状态">
            <Tag color={getKycStatusColor(tenantInfo.kyc.status)}>
              {getKycStatusText(tenantInfo.kyc.status)}
            </Tag>
          </Descriptions.Item>
          {tenantInfo.kyc.submittedAt && (
            <Descriptions.Item label="提交时间">
              {new Date(tenantInfo.kyc.submittedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          )}
          {tenantInfo.kyc.approvedAt && (
            <Descriptions.Item label="通过时间">
              {new Date(tenantInfo.kyc.approvedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 配置信息 */}
      <Card 
        title={
          <Space>
            <SettingOutlined />
            <span>系统配置</span>
          </Space>
        }
      >
        <Descriptions column={1}>
          <Descriptions.Item label="IP白名单">
            {tenantInfo.config.ipWhitelist.length > 0 ? (
              <Space wrap>
                {tenantInfo.config.ipWhitelist.map((ip, index) => (
                  <Tag key={index}>{ip}</Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">未设置</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Webhook地址">
            {tenantInfo.config.webhookUrl || (
              <Text type="secondary">未设置</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="通知邮箱">
            {tenantInfo.config.notificationEmail || (
              <Text type="secondary">未设置</Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default TenantInfoPage 