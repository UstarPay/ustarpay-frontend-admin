import React from 'react'
import { Card, Row, Col } from 'antd'
import { SafetyOutlined, SafetyCertificateOutlined, InfoCircleOutlined, CrownOutlined } from '@ant-design/icons'
import type { TenantInfo } from '@/services/tenantService'

interface ProfileStatsCardsProps {
  tenantInfo: TenantInfo
  getStatusColor: (status: number) => 'success' | 'error'
  getStatusText: (status: number) => string
}

const ProfileStatsCards: React.FC<ProfileStatsCardsProps> = ({ 
  tenantInfo, 
  getStatusColor, 
  getStatusText 
}) => {
  const createStatsCard = (
    title: string,
    mainValue: string | number,
    subValue: string,
    iconComponent: React.ReactNode,
    backgroundColor: string,
    iconColor: string,
    topBarColor: string
  ) => (
    <Card
      className="stats-card-minimal"
      style={{
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      {/* 顶部指示条 */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: topBarColor,
          borderRadius: '8px 8px 0 0'
        }}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ 
            fontSize: '14px', 
            color: '#8c8c8c', 
            marginBottom: '8px',
            fontWeight: 400 
          }}>
            {title}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'baseline',
            gap: '4px'
          }}>
            <span style={{ 
              fontSize: '32px', 
              fontWeight: 600, 
              color: '#262626',
              lineHeight: 1
            }}>
              {mainValue}
            </span>
            <span style={{ 
              fontSize: '16px', 
              color: '#8c8c8c',
              fontWeight: 400
            }}>
              {subValue}
            </span>
          </div>
        </div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          backgroundColor: backgroundColor, 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {React.cloneElement(iconComponent as React.ReactElement, {
            style: { fontSize: '20px', color: iconColor }
          })}
        </div>
      </div>
    </Card>
  )

  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={24} sm={12} lg={6}>
        {createStatsCard(
          '安全状态',
          (tenantInfo.hasPassword ? 1 : 0) + (tenantInfo.hasSecondaryPassword ? 1 : 0) + (tenantInfo.has2FA ? 1 : 0),
          '/3',
          <SafetyOutlined />,
          '#f6ffed',
          '#52c41a',
          '#52c41a'
        )}
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        {createStatsCard(
          'IP白名单',
          tenantInfo.allowedIps?.length || 0,
          '个',
          <SafetyCertificateOutlined />,
          '#e6f7ff',
          '#1890ff',
          '#1890ff'
        )}
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        {createStatsCard(
          'Webhook',
          tenantInfo.webhookUrl ? '✓' : '✗',
          tenantInfo.webhookUrl ? '已配置' : '未配置',
          <InfoCircleOutlined />,
          tenantInfo.webhookUrl ? '#f6ffed' : '#fffbe6',
          tenantInfo.webhookUrl ? '#52c41a' : '#faad14',
          tenantInfo.webhookUrl ? '#52c41a' : '#faad14'
        )}
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        {createStatsCard(
          '账户状态',
          getStatusColor(tenantInfo.status) === 'success' ? '✓' : '✗',
          getStatusText(tenantInfo.status),
          <CrownOutlined />,
          getStatusColor(tenantInfo.status) === 'success' ? '#f6ffed' : '#fff2f0',
          getStatusColor(tenantInfo.status) === 'success' ? '#52c41a' : '#ff4d4f',
          getStatusColor(tenantInfo.status) === 'success' ? '#52c41a' : '#ff4d4f'
        )}
      </Col>
    </Row>
  )
}

export default ProfileStatsCards 