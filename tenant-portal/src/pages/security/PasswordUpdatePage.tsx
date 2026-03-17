import React, { useState } from 'react'
import { Typography, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { tenantService } from '@/services'
import { PasswordSettings } from './components'

const { Title, Text } = Typography

interface PasswordFormData {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const PasswordUpdatePage: React.FC = () => {
  const queryClient = useQueryClient()
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)

  // 获取租户信息
  const { data: tenantInfo } = useQuery({
    queryKey: ['tenant-info'],
    queryFn: () => tenantService.getTenantInfo()
  })

  // 处理密码更新
  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      message.error('新密码和确认密码不一致')
      return
    }

    if (passwordData.newPassword.length < 8) {
      message.error('新密码长度至少8位')
      return
    }

    try {
      setLoading(true)
      await tenantService.updatePassword({
        id: tenantInfo?.data?.id || '',
        password: passwordData.newPassword,
        oldPassword: passwordData.oldPassword
      })
      
      message.success('密码更新成功')
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['tenant-info'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    } catch (error: any) {
      console.error('密码更新失败:', error)
      message.error(error.response?.data?.message || '密码更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>密码设置</Title>
          <Text type="secondary">更新您的登录密码</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => window.location.reload()}
        >
          刷新页面
        </Button>
      </div>

      {/* 密码设置组件 */}
      <PasswordSettings 
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        loading={loading}
        tenantInfo={tenantInfo?.data || null}
        onUpdate={handlePasswordUpdate}
      />
    </div>
  )
}

export default PasswordUpdatePage 