import React from 'react'
import { Card, Row, Col, Space, Typography, Tag, Avatar, Badge } from 'antd'
import { UserOutlined, SafetyOutlined, CrownOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { TenantInfo } from '@/services/tenantService'

const { Title, Text } = Typography

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
  return (
    <Card 
      className="mb-6 user-info-card"
      style={{
        background: 'linear-gradient(130deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 64, 175, 0.95) 38%, rgba(8, 47, 73, 0.94) 100%)',
        border: '1px solid rgba(30, 64, 175, 0.10)',
        borderRadius: '28px',
        boxShadow: '0 24px 70px rgba(30, 64, 175, 0.18)',
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
                  background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
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
                  color: '#ffffff',
                  fontWeight: 600
                }}
              >
                {tenantInfo.name}
              </Title>
              <Text 
                style={{ 
                  color: '#dbeafe',
                  fontSize: '14px'
                }}
              >
                {tenantInfo.email}
              </Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ color: '#ffffff' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div className="flex justify-between items-center">
                <Space>
                  <SafetyOutlined style={{ color: '#dbeafe', fontSize: '14px' }} />
                  <Text style={{ color: '#dbeafe', fontSize: '13px' }}>账户状态</Text>
                </Space>
                <Tag 
                  color={getStatusColor(tenantInfo.status)}
                  style={{ 
                    borderRadius: '999px',
                    fontWeight: 500,
                    fontSize: '12px'
                  }}
                >
                  {getStatusText(tenantInfo.status)}
                </Tag>
              </div>
              <div className="flex justify-between items-center">
                <Space>
                  <CrownOutlined style={{ color: '#dbeafe', fontSize: '14px' }} />
                  <Text style={{ color: '#dbeafe', fontSize: '13px' }}>登录次数</Text>
                </Space>
                <Text strong style={{ color: '#ffffff', fontSize: '14px' }}>
                  {tenantInfo.loginCount} 次
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Space>
                  <ClockCircleOutlined style={{ color: '#dbeafe', fontSize: '14px' }} />
                  <Text style={{ color: '#dbeafe', fontSize: '13px' }}>最后登录</Text>
                </Space>
                <Text style={{ color: '#eff6ff', fontSize: '13px' }}>
                  {tenantInfo.lastLoginAt ? dayjs(tenantInfo.lastLoginAt).format('MM-DD HH:mm') : '从未登录'}
                </Text>
              </div>
            </Space>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{ color: '#ffffff' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div className="flex justify-between items-center">
                <Text style={{ color: '#dbeafe', fontSize: '13px' }}>创建时间</Text>
                <Text style={{ color: '#eff6ff', fontSize: '13px' }}>
                  {dayjs(tenantInfo.createdAt).format('YYYY-MM-DD')}
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Text style={{ color: '#dbeafe', fontSize: '13px' }}>套餐名称</Text>
                <Text strong style={{ color: '#ffffff', fontSize: '14px' }}>
                  {tenantInfo.planName || '未设置'}
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Text style={{ color: '#dbeafe', fontSize: '13px' }}>剩余天数</Text>
                <Text strong style={{ color: '#ffffff', fontSize: '14px' }}>
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
