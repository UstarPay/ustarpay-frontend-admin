import React from 'react'
import { Typography, Space, Button, Card } from 'antd'
import { SafetyCertificateOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons'
import type { TenantFullDetail } from '@shared/types'

const { Text } = Typography

interface SecurityAlertProps {
  tenant: TenantFullDetail
  onNavigate: (url: string) => void
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({ tenant, onNavigate }) => {
  const securityItems = [
    {
      key: 'password',
      title: '主密码',
      status: tenant.hasPassword,
      icon: <LockOutlined />,
      action: '设置主密码',
      url: '/security/password',
      color: '#3498db'
    },
    {
      key: 'secondaryPassword',
      title: '二级密码',
      status: tenant.hasSecondaryPassword,
      icon: <KeyOutlined />,
      action: '设置二级密码',
      url: '/security/secondary-password',
      color: '#9b59b6'
    },
    {
      key: '2fa',
      title: '双因素认证',
      status: tenant.has2FA,
      icon: <SafetyCertificateOutlined />,
      action: '启用2FA',
      url: '/security/2fa',
      color: '#e67e22'
    }
  ]

  const incompleteItems = securityItems.filter(item => !item.status)
  const completionRate = (securityItems.filter(item => item.status).length / securityItems.length) * 100

  if (completionRate === 100) {
    return null
  }

  return (
    <Card
      className="mb-6 security-alert-card"
      style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center mb-2">
            <SafetyCertificateOutlined style={{ 
              color: '#3498db', 
              fontSize: '18px',
              marginRight: '8px'
            }} />
            <Text style={{ 
              color: '#2c3e50', 
              fontSize: '16px',
              fontWeight: 600
            }}>
              安全设置提醒
            </Text>
          </div>
          <Text style={{ 
            color: '#6c757d',
            fontSize: '13px',
            display: 'block'
          }}>
            为了保障您的账户安全，建议完成以下安全设置
          </Text>
        </div>
        
        <div style={{
          background: '#e9ecef',
          padding: '6px 12px',
          borderRadius: '16px',
          color: '#495057',
          fontSize: '12px',
          fontWeight: 600
        }}>
          {Math.round(completionRate)}% 完成
        </div>
      </div>

      <div className="space-y-3">
        {incompleteItems.map(item => (
          <div
            key={item.key}
            className="flex justify-between items-center security-item"
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              background: '#fff',
              border: '1px solid #e9ecef',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = item.color
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e9ecef'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Space>
              <div style={{ 
                color: item.color,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {item.icon}
              </div>
              <div>
                <Text style={{ 
                  color: '#2c3e50',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {item.title}
                </Text>
                <Text style={{ 
                  color: '#e74c3c',
                  fontSize: '12px'
                }}>
                  未设置
                </Text>
              </div>
            </Space>
            
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
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: '1px solid #e9ecef' }}>
        <div className="flex justify-between items-center">
          <Text style={{ 
            color: '#6c757d',
            fontSize: '12px'
          }}>
            完成所有安全设置可获得更高的账户安全等级
          </Text>
          <Button 
            type="primary"
            size="small"
            style={{
              borderRadius: '4px',
              background: '#3498db',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500
            }}
            onClick={() => onNavigate('/security/2fa')}
          >
            立即设置
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default SecurityAlert 