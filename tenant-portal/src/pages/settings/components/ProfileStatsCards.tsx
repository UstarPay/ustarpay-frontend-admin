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
        background: 'linear-gradient(180deg,#ffffff 0%,#eff6ff 72%,#dbeafe 100%)',
        border: '1px solid rgba(147, 197, 253, 0.45)',
        borderRadius: '22px',
        boxShadow: '0 16px 36px rgba(30, 64, 175, 0.08)',
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
            color: '#64748b', 
            marginBottom: '8px',
            fontWeight: 500 
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
              color: '#0f172a',
              lineHeight: 1
            }}>
              {mainValue}
            </span>
            <span style={{ 
              fontSize: '16px', 
              color: '#475569',
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
          borderRadius: '12px',
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
          '#ecfeff',
          '#0891b2',
          'linear-gradient(90deg,#1e3a8a 0%,#2563eb 100%)'
        )}
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        {createStatsCard(
          'IP白名单',
          tenantInfo.allowedIps?.length || 0,
          '个',
          <SafetyCertificateOutlined />,
          '#eff6ff',
          '#2563eb',
          'linear-gradient(90deg,#2563eb 0%,#38bdf8 100%)'
        )}
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        {createStatsCard(
          'Webhook',
          tenantInfo.webhookUrl ? '✓' : '✗',
          tenantInfo.webhookUrl ? '已配置' : '未配置',
          <InfoCircleOutlined />,
          tenantInfo.webhookUrl ? '#eff6ff' : '#e0f2fe',
          tenantInfo.webhookUrl ? '#2563eb' : '#0284c7',
          tenantInfo.webhookUrl ? 'linear-gradient(90deg,#1d4ed8 0%,#38bdf8 100%)' : 'linear-gradient(90deg,#0f766e 0%,#0ea5e9 100%)'
        )}
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        {createStatsCard(
          '账户状态',
          getStatusColor(tenantInfo.status) === 'success' ? '✓' : '✗',
          getStatusText(tenantInfo.status),
          <CrownOutlined />,
          getStatusColor(tenantInfo.status) === 'success' ? '#dbeafe' : '#e0f2fe',
          getStatusColor(tenantInfo.status) === 'success' ? '#1d4ed8' : '#0284c7',
          getStatusColor(tenantInfo.status) === 'success' ? 'linear-gradient(90deg,#1e40af 0%,#38bdf8 100%)' : 'linear-gradient(90deg,#0f766e 0%,#06b6d4 100%)'
        )}
      </Col>
    </Row>
  )
}

export default ProfileStatsCards 
