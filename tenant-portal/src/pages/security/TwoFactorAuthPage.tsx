import React, { useEffect, useState } from 'react'
import { Typography, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { TwoFactorAuthComponent } from './components'
import { TenantInfo, tenantService } from '@/services/tenantService'

const { Title, Text } = Typography
 
const TwoFactorAuthPage: React.FC = () => {
  const [loading, setLoading] = useState(false)

  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null)
   
  useEffect(() => {
    loadTenantInfo()
  }, [])

  const loadTenantInfo = async () => {
    try {
      setLoading(true)
      const response = await tenantService.getTenantInfo()
      const tenant = response.data
      setTenantInfo(tenant)
       
    } catch (error) {
      console.error('加载租户信息失败:', error)
      message.error('加载租户信息失败')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>双因素认证</Title>
          <Text type="secondary">设置和管理您的两步验证</Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={() => window.location.reload()}
        >
          刷新页面
        </Button>
      </div>

      {/* 2FA组件 */}
      <TwoFactorAuthComponent 
        showCard={true}
        showHeader={false}  // 页面已有标题，不需要卡片标题
        showSteps={true}
        showStatusAlerts={true}
        context="security"  // 指定为security上下文
        tenantInfo={tenantInfo}
        loading={loading}
      />
    </div>
  )
}

export default TwoFactorAuthPage 