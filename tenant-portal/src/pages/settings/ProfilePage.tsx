import { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Tabs, 
  Typography,
  message
} from 'antd'
import { 
  UserOutlined, 
  LockOutlined, 
  SafetyCertificateOutlined,
  ReloadOutlined,
  IdcardOutlined
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
      message.success('账户资料更新成功')
      await loadTenantInfo() // 重新加载信息
    } catch (error) {
      console.error('更新账户资料失败:', error)
      message.error('更新账户资料失败')
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
    <div className="profile-page space-y-6 p-6">
      <Card
        bordered={false}
        className="profile-hero-card overflow-hidden rounded-[30px]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="profile-hero-panel px-6 py-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div>
              <div className="text-[11px] uppercase tracking-[0.34em] text-[#dbeafe]">Tenant Settings Console</div>
              <Title level={2} style={{ margin: '10px 0 0', color: '#ffffff' }}>账户资料</Title>
              <Text className="mt-3 block max-w-2xl text-sm leading-6 !text-[#eff6ff]">
                管理账户资料、安全凭证与账户访问策略，集中维护当前工作区的基础配置。
              </Text>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadTenantInfo}
                  loading={loading}
                  className="h-10 rounded-full border-white/20 bg-white/10 px-5 text-[#eff6ff] shadow-none hover:!border-sky-300 hover:!bg-white/15 hover:!text-white"
                >
                  刷新信息
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '当前标签', value: activeTab === 'profile' ? '资料' : activeTab === 'password' ? '密码' : activeTab === 'secondary-password' ? '二级密码' : '双因素', icon: <IdcardOutlined /> },
                { label: '账户状态', value: tenantInfo ? getStatusText(tenantInfo.status) : '--', icon: <SafetyCertificateOutlined /> },
                { label: '登录次数', value: tenantInfo ? `${tenantInfo.loginCount} 次` : '--', icon: <UserOutlined /> },
                { label: '套餐方案', value: tenantInfo?.planName || '未设置', icon: <LockOutlined /> }
              ].map(item => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.20)_0%,rgba(219,234,254,0.14)_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                >
                  <div className="flex items-center justify-between text-[#dbeafe]">
                    <span className="text-xs uppercase tracking-[0.16em]">{item.label}</span>
                    <span className="text-sm">{item.icon}</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

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
        bordered={false}
        className="profile-tabs-card rounded-[28px]"
        style={{
          background: 'linear-gradient(180deg,#ffffff 0%,#eff6ff 58%,#dbeafe 100%)',
          border: '1px solid rgba(147, 197, 253, 0.5)',
          boxShadow: '0 18px 46px rgba(30, 64, 175, 0.08)'
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
                <span>账户资料</span>
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
