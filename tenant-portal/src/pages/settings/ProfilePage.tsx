import { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Tabs, 
  Typography,
  message,
  theme
} from 'antd'
import { 
  UserOutlined, 
  LockOutlined, 
  SafetyCertificateOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { tenantService } from '@/services/tenantService'
import type { TenantInfo } from '@/services/tenantService'
import {
  UserProfileOverview,
  ProfileStatsCards,
  ProfileInfoForm,
  PasswordSettings,
  SecondaryPasswordSettings,
  TwoFactorAuthSettings
} from './components'
import './ProfilePage.css'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { useToken } = theme

interface ProfileFormData {
  name: string
  email: string
  allowedIps: string[]
  webhookUrl: string
  webhookSecret: string
}

interface PasswordFormData {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

interface SecondaryPasswordFormData {
  oldSecondaryPassword: string
  newSecondaryPassword: string
  confirmSecondaryPassword: string
}

export default function ProfilePage() {
  const { token } = useToken()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')  // 当前活跃的标签页
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: '',
    email: '',
    allowedIps: [],
    webhookUrl: '',
    webhookSecret: ''
  })
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [secondaryPasswordData, setSecondaryPasswordData] = useState<SecondaryPasswordFormData>({
    oldSecondaryPassword: '',
    newSecondaryPassword: '',
    confirmSecondaryPassword: ''
  })
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
      
      // 设置表单初始值
      setProfileData({
        name: tenant.name || '',
        email: tenant.email || '',
        allowedIps: tenant.allowedIps || [],
        webhookUrl: tenant.webhookUrl || '',
        webhookSecret: tenant.webhookSecret || ''
      })
    } catch (error) {
      console.error('加载租户信息失败:', error)
      message.error('加载租户信息失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: number): 'success' | 'error' => {
    return status === 1 ? 'success' : 'error'
  }

  const getStatusText = (status: number): string => {
    return status === 1 ? '正常' : '异常'
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateIP = (ip: string): boolean => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) return false
    const parts = ip.split('.')
    return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255)
  }

  const validateURL = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleProfileUpdate = async () => {
    // 验证邮箱格式
    if (profileData.email && !validateEmail(profileData.email)) {
      message.error('请输入有效的邮箱地址')
      return
    }

    // 验证IP地址格式
    for (const ip of profileData.allowedIps) {
      if (ip && !validateIP(ip)) {
        message.error(`IP地址格式不正确: ${ip}`)
        return
      }
    }

    // 验证Webhook URL格式
    if (profileData.webhookUrl && !validateURL(profileData.webhookUrl)) {
      message.error('请输入有效的Webhook URL')
      return
    }

    try {
      setLoading(true)
      await tenantService.updateTenantInfo(profileData)
      message.success('个人信息更新成功')
      await loadTenantInfo() // 重新加载信息
    } catch (error) {
      console.error('更新个人信息失败:', error)
      message.error('更新个人信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      message.error('请填写所有密码字段')
      return
    }

    if (passwordData.newPassword.length < 8) {
      message.error('新密码至少需要8位字符')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message.error('新密码和确认密码不匹配')
      return
    }

    try {
      setLoading(true)
      await tenantService.updatePassword({
        id: tenantInfo?.id || '',
        password: passwordData.newPassword,
        oldPassword: passwordData.oldPassword
      })
      message.success('密码更新成功')
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('更新密码失败:', error)
      message.error('更新密码失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSecondaryPasswordUpdate = async () => {
    // 检查是否填写了新密码和确认密码
    if (!secondaryPasswordData.newSecondaryPassword || !secondaryPasswordData.confirmSecondaryPassword) {
      message.error('请填写新二级密码和确认密码')
      return
    }

    // 如果二级密码已设置，则需要旧密码
    if (tenantInfo?.hasSecondaryPassword && !secondaryPasswordData.oldSecondaryPassword) {
      message.error('请输入当前二级密码')
      return
    }

    if (secondaryPasswordData.newSecondaryPassword.length < 6) {
      message.error('二级密码至少需要6位字符')
      return
    }

    if (secondaryPasswordData.newSecondaryPassword !== secondaryPasswordData.confirmSecondaryPassword) {
      message.error('新二级密码和确认密码不匹配')
      return
    }

    try {
      console.log(tenantInfo)
      setLoading(true)
      await tenantService.updateSecondaryPassword({
        id: tenantInfo?.id || '',
        secondaryPassword: secondaryPasswordData.newSecondaryPassword,
        oldSecondaryPassword: tenantInfo?.hasSecondaryPassword ? secondaryPasswordData.oldSecondaryPassword : undefined
      })
      message.success('二级密码更新成功')
      setSecondaryPasswordData({ 
        oldSecondaryPassword: '', 
        newSecondaryPassword: '', 
        confirmSecondaryPassword: '' 
      })
      await loadTenantInfo() // 重新加载信息以更新状态
    } catch (error) {
      console.error('更新二级密码失败:', error)
      message.error('更新二级密码失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ margin: 0, color: token.colorText }}>个人设置</Title>
          <Text type="secondary">管理您的个人信息、密码和安全设置</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadTenantInfo}
          loading={loading}
        >
          刷新信息
        </Button>
      </div>

      {/* 用户信息概览卡片 */}
      {tenantInfo && (
        <UserProfileOverview 
          tenantInfo={tenantInfo}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      )}

      {/* 快速统计卡片 */}
      {tenantInfo && (
        <ProfileStatsCards 
          tenantInfo={tenantInfo}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      )}

      {/* 主要内容区域 */}
      <Card 
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          className="settings-tabs"
          tabBarStyle={{ 
            borderBottom: '1px solid #f0f0f0',
            marginBottom: '24px'
          }}
        >
          <TabPane 
            tab={
              <span className="flex items-center space-x-2">
                <UserOutlined className="status-info" />
                <span>个人信息</span>
              </span>
            } 
            key="profile"
          >
            <ProfileInfoForm 
              profileData={profileData}
              setProfileData={setProfileData}
              loading={loading}
              tenantInfo={tenantInfo}
              onUpdate={handleProfileUpdate}
            />
          </TabPane>

          <TabPane 
            tab={
              <span className="flex items-center space-x-2">
                <LockOutlined className="status-success" />
                <span>密码设置</span>
              </span>
            } 
            key="password"
          >
            <PasswordSettings 
              passwordData={passwordData}
              setPasswordData={setPasswordData}
              loading={loading}
              tenantInfo={tenantInfo}
              onUpdate={handlePasswordUpdate}
            />
          </TabPane>

          <TabPane 
            tab={
              <span className="flex items-center space-x-2">
                <SafetyCertificateOutlined className="status-warning" />
                <span>二级密码</span>
              </span>
            } 
            key="secondary-password"
          >
            <SecondaryPasswordSettings 
              secondaryPasswordData={secondaryPasswordData}
              setSecondaryPasswordData={setSecondaryPasswordData}
              loading={loading}
              tenantInfo={tenantInfo}
              onUpdate={handleSecondaryPasswordUpdate}
            />
          </TabPane>

          <TabPane 
            tab={
              <span className="flex items-center space-x-2">
                <SafetyCertificateOutlined className="status-success" />
                <span>双因素认证</span>
              </span>
            } 
            key="two-factor-auth"
          >
            <TwoFactorAuthSettings 
              tenantInfo={tenantInfo}
              loading={loading}
              onUpdate={loadTenantInfo}
              context="settings"
              onTabChange={setActiveTab}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
} 