import React from 'react'
import { Card, Button, Input, Alert, Space, Typography, Tag, Row, Col } from 'antd'
import { LockOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { TenantInfo } from '@/services/tenantService'

const { Text } = Typography

interface PasswordFormData {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

interface PasswordSettingsProps {
  passwordData: PasswordFormData
  setPasswordData: React.Dispatch<React.SetStateAction<PasswordFormData>>
  loading: boolean
  tenantInfo: TenantInfo | null
  onUpdate: () => void
}

const PasswordSettings: React.FC<PasswordSettingsProps> = ({
  passwordData,
  setPasswordData,
  loading,
  tenantInfo,
  onUpdate
}) => {
  return (
    <Card 
      title="密码管理" 
      className="border-0 shadow-sm card-bg-white"
      headStyle={{ 
        borderBottom: '1px solid #f0f0f0',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#262626'
      }}
    >
      <div className="space-y-6">
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <div className="space-y-2">
              <Text strong className="text-gray-700">当前密码</Text>
              <Input.Password
                size="large"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                placeholder="请输入当前密码"
                className="rounded-input"
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="space-y-2">
              <Text strong className="text-gray-700">新密码</Text>
              <Input.Password
                size="large"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="请输入新密码（至少8位）"
                className="rounded-input"
              />
            </div>
          </Col>
        </Row>
        
        <div className="space-y-2">
          <Text strong className="text-gray-700">确认新密码</Text>
          <Input.Password
            size="large"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="请再次输入新密码"
            className="rounded-input"
          />
        </div>

        {tenantInfo && (
          <Alert
            message="密码状态"
            description={
              <Space>
                <span>主密码: </span>
                <Tag 
                  color={tenantInfo.hasPassword ? 'green' : 'red'}
                  icon={tenantInfo.hasPassword ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                >
                  {tenantInfo.hasPassword ? '已设置' : '未设置'}
                </Tag>
              </Space>
            }
            type="info"
            showIcon
            className="rounded-lg"
          />
        )}

        <Alert
          message="密码要求"
          description="至少8位字符，建议包含字母、数字和特殊字符"
          type="info"
          showIcon
          className="rounded-lg"
        />

        <div>
          <Button 
            type="primary"
            size="large"
            icon={<LockOutlined />}
            onClick={onUpdate} 
            loading={loading}
            className="primary-button px-8"
          >
            更新密码
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default PasswordSettings 