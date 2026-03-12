import React from 'react'
import { Card, Row, Col, Space, Typography, Tag, Avatar, Badge, theme } from 'antd'
import { UserOutlined, SafetyOutlined, CrownOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { TenantInfo } from '@/services/tenantService'

const { Title, Text } = Typography
const { useToken } = theme

interface UserProfileOverviewProps {
  tenantInfo: TenantInfo
  getStatusColor: (status: number) => 'success' | 'error'
  getStatusText: (status: number) => string
}

const UserProfileOverview: React.FC<UserProfileOverviewProps> = ({ 
  tenantInfo, 
  getStatusColor, 
  getStatusText 
}) => {
  const { token } = useToken()

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
              count={getStatusText(tenantInfo.status)} 
              color={getStatusColor(tenantInfo.status) === 'success' ? '#52c41a' : '#ff4d4f'}
              offset={[-8, 8]}
            >
              <Avatar 
                size={80} 
                icon={<UserOutlined />}
                style={{
                  background: '#1890ff',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff'
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
                {tenantInfo.name}
              </Title>
              <Text 
                style={{ 
                  color: token.colorTextSecondary,
                  fontSize: '14px'
                }}
              >
                {tenantInfo.email}
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
                  color={getStatusColor(tenantInfo.status)}
                  style={{ 
                    borderRadius: '4px',
                    fontWeight: 500,
                    fontSize: '12px'
                  }}
                >
                  {getStatusText(tenantInfo.status)}
                </Tag>
              </div>
              <div className="flex justify-between items-center">
                <Space>
                  <CrownOutlined style={{ color: token.colorTextTertiary, fontSize: '14px' }} />
                  <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>登录次数</Text>
                </Space>
                <Text strong style={{ color: token.colorText, fontSize: '14px' }}>
                  {tenantInfo.loginCount} 次
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Space>
                  <ClockCircleOutlined style={{ color: token.colorTextTertiary, fontSize: '14px' }} />
                  <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>最后登录</Text>
                </Space>
                <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>
                  {tenantInfo.lastLoginAt ? dayjs(tenantInfo.lastLoginAt).format('MM-DD HH:mm') : '从未登录'}
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
                  {dayjs(tenantInfo.createdAt).format('YYYY-MM-DD')}
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>套餐名称</Text>
                <Text strong style={{ color: token.colorText, fontSize: '14px' }}>
                  {tenantInfo.planName || '未设置'}
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Text style={{ color: token.colorTextSecondary, fontSize: '13px' }}>剩余天数</Text>
                <Text strong style={{ color: token.colorText, fontSize: '14px' }}>
                  {tenantInfo.daysRemaining || 0} 天
                </Text>
              </div>
            </Space>
          </div>
        </Col>
      </Row>
    </Card>
  )
}

export default UserProfileOverview 