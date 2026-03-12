import React from 'react'
import { Card, Space, Typography, Progress, Divider, Button } from 'antd'
import { LockOutlined, KeyOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { TenantFullDetail } from '@shared/types'

const { Text } = Typography

interface SecurityStatusCardProps {
  tenant: TenantFullDetail
  onNavigate: (url: string) => void
}

const SecurityStatusCard: React.FC<SecurityStatusCardProps> = ({ tenant, onNavigate }) => {
  const securityItems = [
    {
      key: 'password',
      title: '主密码',
      status: tenant.hasPassword,
      icon: <LockOutlined />,
      color: tenant.hasPassword ? '#2ecc71' : '#e74c3c',
      description: tenant.hasPassword ? '已设置' : '未设置',
      action: '设置主密码',
      url: '/security/password'
    },
    {
      key: 'secondaryPassword',
      title: '二级密码',
      status: tenant.hasSecondaryPassword,
      icon: <KeyOutlined />,
      color: tenant.hasSecondaryPassword ? '#2ecc71' : '#e74c3c',
      description: tenant.hasSecondaryPassword ? '已设置' : '未设置',
      action: '设置二级密码',
      url: '/security/secondary-password'
    },
    {
      key: '2fa',
      title: '双因素认证',
      status: tenant.has2FA,
      icon: <SafetyCertificateOutlined />,
      color: tenant.has2FA ? '#2ecc71' : '#e74c3c',
      description: tenant.has2FA ? '已启用' : '未启用',
      action: '启用2FA',
      url: '/security/2fa'
    }
  ]

  const completedCount = securityItems.filter(item => item.status).length
  const totalCount = securityItems.length
  const completionRate = (completedCount / totalCount) * 100

  return (
    <Card 
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#3498db' }} />
          <span style={{ fontWeight: 600, color: '#2c3e50' }}>安全设置状态</span>
        </Space>
      }
      className="h-full security-status-card"
      style={{
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e9ecef'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* 完成度进度条 */}
        <div style={{ 
          background: '#f8f9fa',
          padding: '16px',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <div className="flex justify-between items-center mb-3">
            <Text style={{ color: '#495057', fontWeight: 500, fontSize: '14px' }}>安全完成度</Text>
            <Text strong style={{ color: '#2c3e50', fontSize: '16px' }}>
              {completedCount}/{totalCount}
            </Text>
          </div>
          <Progress
            percent={completionRate}
            status={completionRate === 100 ? 'success' : 'active'}
            strokeColor={completionRate === 100 ? '#2ecc71' : '#3498db'}
            trailColor="#e9ecef"
            strokeWidth={6}
            showInfo={false}
          />
          <div className="mt-2">
            <Text style={{ color: '#6c757d', fontSize: '12px' }}>
              {completionRate === 100 ? '安全设置已完成！' : '请完成剩余的安全设置'}
            </Text>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 安全项目列表 */}
        {securityItems.map(item => (
          <div 
            key={item.key} 
            className="flex justify-between items-center security-item"
            style={{
              padding: '12px',
              borderRadius: '6px',
              background: item.status ? '#f8f9fa' : '#fff5f5',
              border: `1px solid ${item.status ? '#d4edda' : '#f5c6cb'}`,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(2px)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Space size="middle">
              <div style={{ 
                color: item.color,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {item.status ? <CheckCircleOutlined /> : item.icon}
              </div>
              <div>
                <Text strong style={{ fontSize: '14px', display: 'block', color: '#2c3e50' }}>
                  {item.title}
                </Text>
                <Text 
                  style={{ 
                    fontSize: '12px',
                    color: item.status ? '#2ecc71' : '#e74c3c'
                  }}
                >
                  {item.description}
                </Text>
              </div>
            </Space>
            {!item.status && (
              <Button 
                type="primary"
                size="small"
                style={{
                  borderRadius: '4px',
                  background: item.color,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 500
                }}
                onClick={() => onNavigate(item.url)}
              >
                {item.action}
              </Button>
            )}
          </div>
        ))}
      </Space>
    </Card>
  )
}

export default SecurityStatusCard 