import React, { useState } from 'react'
import { Typography, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { tenantService } from '@/services'
import { SecondaryPasswordSettings } from './components'

const { Title, Text } = Typography

interface SecondaryPasswordFormData {
  oldSecondaryPassword: string
  newSecondaryPassword: string
  confirmSecondaryPassword: string
}

const SecondaryPasswordUpdatePage: React.FC = () => {
  const queryClient = useQueryClient()
  const [secondaryPasswordData, setSecondaryPasswordData] = useState<SecondaryPasswordFormData>({
    oldSecondaryPassword: '',
    newSecondaryPassword: '',
    confirmSecondaryPassword: ''
  })
  const [loading, setLoading] = useState(false)

  // 获取租户信息
  const { data: tenantInfo } = useQuery({
    queryKey: ['tenant-info'],
    queryFn: () => tenantService.getTenantInfo()
  })

  // 处理二级密码更新
  const handleSecondaryPasswordUpdate = async () => {
    if (secondaryPasswordData.newSecondaryPassword !== secondaryPasswordData.confirmSecondaryPassword) {
      message.error('新二级密码和确认密码不一致')
      return
    }

    if (secondaryPasswordData.newSecondaryPassword.length < 6) {
      message.error('二级密码长度至少6位')
      return
    }

    try {
      setLoading(true)
      
      // 判断是否需要旧密码
      const requestData: any = {
        id: tenantInfo?.data?.id || '',
        secondaryPassword: secondaryPasswordData.newSecondaryPassword
      }

      if (tenantInfo?.data?.hasSecondaryPassword) {
        requestData.oldSecondaryPassword = secondaryPasswordData.oldSecondaryPassword
      }

      await tenantService.updateSecondaryPassword(requestData)
      
      message.success('二级密码更新成功')
      setSecondaryPasswordData({
        oldSecondaryPassword: '',
        newSecondaryPassword: '',
        confirmSecondaryPassword: ''
      })
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['tenant-info'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    } catch (error: any) {
      console.error('二级密码更新失败:', error)
      message.error(error.response?.data?.message || '二级密码更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ margin: 0 }}>二级密码设置</Title>
          <Text type="secondary">设置和管理您的二级密码</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => window.location.reload()}
        >
          刷新页面
        </Button>
      </div>

      {/* 二级密码设置组件 */}
      <SecondaryPasswordSettings 
        secondaryPasswordData={secondaryPasswordData}
        setSecondaryPasswordData={setSecondaryPasswordData}
        loading={loading}
        tenantInfo={tenantInfo?.data || null}
        onUpdate={handleSecondaryPasswordUpdate}
      />
    </div>
  )
}

export default SecondaryPasswordUpdatePage 