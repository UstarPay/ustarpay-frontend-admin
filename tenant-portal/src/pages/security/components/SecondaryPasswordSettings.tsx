import React from 'react'
import { Card, Button, Input, Alert, Space, Typography, Tag, Row, Col } from 'antd'
import { SafetyCertificateOutlined, CheckCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import type { TenantInfo } from '@/services/tenantService'

const { Text } = Typography

interface SecondaryPasswordFormData {
  oldSecondaryPassword: string
  newSecondaryPassword: string
  confirmSecondaryPassword: string
}

interface SecondaryPasswordSettingsProps {
  secondaryPasswordData: SecondaryPasswordFormData
  setSecondaryPasswordData: React.Dispatch<React.SetStateAction<SecondaryPasswordFormData>>
  loading: boolean
  tenantInfo: TenantInfo | null
  onUpdate: () => void
}

const SecondaryPasswordSettings: React.FC<SecondaryPasswordSettingsProps> = ({
  secondaryPasswordData,
  setSecondaryPasswordData,
  loading,
  tenantInfo,
  onUpdate
}) => {
  return (
    <Card
      title="二级密码管理"
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
          {tenantInfo?.hasSecondaryPassword && (
            <Col xs={24} md={12}>
              <div className="space-y-2">
                <Text strong className="text-gray-700">当前二级密码</Text>
                <Input.Password
                  size="large"
                  value={secondaryPasswordData.oldSecondaryPassword}
                  onChange={(e) => setSecondaryPasswordData(prev => ({ ...prev, oldSecondaryPassword: e.target.value }))}
                  placeholder="请输入当前二级密码"
                  className="rounded-input"
                />
              </div>
            </Col>
          )}
          <Col xs={24} md={12}>
            <div className="space-y-2">
              <Text strong className="text-gray-700">
                {tenantInfo?.hasSecondaryPassword ? '新二级密码' : '二级密码'}
              </Text>
              <Input.Password
                size="large"
                value={secondaryPasswordData.newSecondaryPassword}
                onChange={(e) => setSecondaryPasswordData(prev => ({ ...prev, newSecondaryPassword: e.target.value }))}
                placeholder={tenantInfo?.hasSecondaryPassword ? '请输入新二级密码（至少6位）' : '请输入二级密码（至少6位）'}
                className="rounded-input"
              />
            </div>
          </Col>
        </Row>

        <div className="space-y-2">
          <Text strong className="text-gray-700">
            {tenantInfo?.hasSecondaryPassword ? '确认新二级密码' : '确认二级密码'}
          </Text>
          <Input.Password
            size="large"
            value={secondaryPasswordData.confirmSecondaryPassword}
            onChange={(e) => setSecondaryPasswordData(prev => ({ ...prev, confirmSecondaryPassword: e.target.value }))}
            placeholder={tenantInfo?.hasSecondaryPassword ? '请再次输入新二级密码' : '请再次输入二级密码'}
            className="rounded-input"
          />
        </div>

        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>

            {tenantInfo && (
              <Alert
                message="安全状态"
                description={
                  <Space direction="vertical" size="small">
                    <div>
                      <span>二级密码: </span>
                      <Tag
                        color={tenantInfo.hasSecondaryPassword ? 'green' : 'red'}
                        icon={tenantInfo.hasSecondaryPassword ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                      >
                        {tenantInfo.hasSecondaryPassword ? '已设置' : '未设置'}
                      </Tag>
                      {!tenantInfo.hasSecondaryPassword && (
                        <Text type="secondary" className="ml-2 text-sm">
                          建议设置二级密码以提高账户安全性
                        </Text>
                      )}
                    </div>
                    <div>
                      <span>两步验证: </span>
                      <Tag
                        color={tenantInfo.has2FA ? 'green' : 'orange'}
                        icon={tenantInfo.has2FA ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
                      >
                        {tenantInfo.has2FA ? '已启用' : '未启用'}
                      </Tag>
                      {!tenantInfo.has2FA && (
                        <Text type="secondary" className="ml-2 text-sm">
                          建议启用两步验证以增强账户安全
                        </Text>
                      )}
                    </div>
                  </Space>
                }
                type="info"
                showIcon
                className="rounded-lg"
              />
            )}
          </Col>
          <Col xs={24} md={12}>
            <Alert
              message={tenantInfo?.hasSecondaryPassword ? '二级密码说明' : '设置二级密码'}
              description={
                <Space direction="vertical" size="small">
                  <div>
                    <span>建议设置二级密码以提高账户安全性: </span> 
                  </div>
                  <div>
                    <span>二级密码规则: </span>
                    <Text type="secondary" className="ml-2 text-sm">
                      密码规则：8-12位，包含大小写字母、数字、特殊字符
                    </Text>

                  </div>
                </Space>

              }
              type="info"
              showIcon
              className="rounded-lg"
            />
          </Col>
        </Row>
        <div>
          <Button
            type="primary"
            size="large"
            icon={<SafetyCertificateOutlined />}
            onClick={onUpdate}
            loading={loading}
            className="primary-button px-8"
          >
            更新二级密码
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default SecondaryPasswordSettings 