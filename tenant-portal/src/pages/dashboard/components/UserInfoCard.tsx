import React from 'react'
import { Card, Row, Col, Space, Typography, Tag, Avatar, Badge, theme } from 'antd'
import { UserOutlined, CrownOutlined, ClockCircleOutlined, SafetyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { TenantFullDetail } from '@shared/types'

const { Title, Text } = Typography
const { useToken } = theme

interface UserInfoCardProps {
  tenant: TenantFullDetail
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ tenant }) => {
  const { token } = useToken()
  
  const getStatusColor = (status: number) => {
    return status === 1 ? 'success' : 'error'
  }

  const getSubscriptionColor = (status?: number) => {
    return status === 1 ? 'success' : 'warning'
  }

  return (
    <Card 
      className="mb-6 user-info-card"
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} sm={8}>
          <Space size="large">
            <Badge 
              count={tenant.status === 1 ? '在线' : '离线'} 
              color={tenant.status === 1 ? '#52c41a' : '#ff4d4f'}
              offset={[-8, 8]}
            >
              <Avatar 
                size={80} 
                icon={<UserOutlined />}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: '#ecf0f1'
                }}
              />
            </Badge>
            <div>
              <Title 
                level={3} 
                style={{ 
                  margin: 0, 
                  color: token.colorText,
                  fontWeight: 600
                }}
              >
                {tenant.name}
              </Title>
              <Text 
                style={{ 
                  color: token.colorTextSecondary,
                  fontSize: '14px'
                }}
              >
                {tenant.email}
              </Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ color: token.colorText }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div className="flex justify-between items-center">
                <Space>
                  <SafetyOutlined style={{ color: token.colorTextTertiary, fontSize: '14px' }} />
                  <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>账户状态</Text>
                </Space>
                <Tag 
                  color={getStatusColor(tenant.status)}
                  style={{ 
                    borderRadius: '4px',
                    fontWeight: 500,
                    fontSize: '12px'
                  }}
                >
                  {tenant.status === 1 ? '正常' : '异常'}
                </Tag>
              </div>
              <div className="flex justify-between items-center">
                <Space>
                  <CrownOutlined style={{ color: token.colorTextTertiary, fontSize: '14px' }} />
                  <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>登录次数</Text>
                </Space>
                <Text strong style={{ color: token.colorText, fontSize: '14px' }}>
                  {tenant.loginCount} 次
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Space>
                  <ClockCircleOutlined style={{ color: token.colorTextTertiary, fontSize: '14px' }} />
                  <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>最后登录</Text>
                </Space>
                <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>
                  {tenant.lastLoginAt ? dayjs(tenant.lastLoginAt).format('MM-DD HH:mm') : '从未登录'}
                </Text>
              </div>
            </Space>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ color: token.colorText }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div className="flex justify-between items-center">
                <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>创建时间</Text>
                <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>
                  {dayjs(tenant.createdAt).format('YYYY-MM-DD')}
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>订阅状态</Text>
                <Tag 
                  color={getSubscriptionColor(tenant.subscriptionStatus)}
                  style={{ 
                    borderRadius: '4px',
                    fontWeight: 500,
                    fontSize: '12px'
                  }}
                >
                  {tenant.computedStatus || '未知'}
                </Tag>
              </div>
              <div className="flex justify-between items-center">
                <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>剩余天数</Text>
                <Text strong style={{ color: token.colorText, fontSize: '14px' }}>
                  {tenant.daysRemaining || 0} 天
                </Text>
              </div>
            </Space>
          </div>
        </Col>
      </Row>
    </Card>
  )
}

export default UserInfoCard 