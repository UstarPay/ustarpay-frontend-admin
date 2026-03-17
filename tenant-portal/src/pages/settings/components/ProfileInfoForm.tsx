import React from 'react'
import { Card, Button, Input, Typography, Descriptions, Tag, Row, Col } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import type { TenantInfo } from '@/services/tenantService'

const { Text } = Typography

interface ProfileFormData {
  name: string
  email: string
  allowedIps: string[]
  webhookUrl: string
  webhookSecret: string
}

interface ProfileInfoFormProps {
  profileData: ProfileFormData
  setProfileData: React.Dispatch<React.SetStateAction<ProfileFormData>>
  loading: boolean
  tenantInfo: TenantInfo | null
  onUpdate: () => void
}

const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({
  profileData,
  setProfileData,
  loading,
  tenantInfo,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      {/* 基本信息表单 */}
      <Card 
        title="基本信息" 
        className="border-0 shadow-sm card-bg-white"
        headStyle={{ 
          borderBottom: '1px solid #f0f0f0',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#262626'
        }}
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <div className="space-y-2">
              <Text strong className="text-gray-700">姓名</Text>
              <Input
                size="large"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入您的姓名"
                className="rounded-input"
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="space-y-2">
              <Text strong className="text-gray-700">邮箱</Text>
              <Input
                size="large"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="请输入您的邮箱"
                className="rounded-input"
              />
            </div>
          </Col>
        </Row>

        <Row gutter={[24, 16]} className="mt-4">
          <Col xs={24}>
            <div className="space-y-2">
              <Text strong className="text-gray-700">IP白名单</Text>
              <Input.TextArea
                size="large"
                value={profileData.allowedIps.join('\n')}
                onChange={(e) => setProfileData(prev => ({ 
                  ...prev, 
                  allowedIps: e.target.value.split('\n').filter(ip => ip.trim())
                }))}
                placeholder="请输入允许访问的IP地址，每行一个"
                rows={4}
                className="rounded-input"
              />
              <Text type="secondary" className="text-sm">
                每行输入一个IP地址，留空表示允许所有IP访问
              </Text>
            </div>
          </Col>
        </Row>

        <Row gutter={[24, 16]} className="mt-4">
          <Col xs={24} md={12}>
            <div className="space-y-2">
              <Text strong className="text-gray-700">Webhook URL</Text>
              <Input
                size="large"
                value={profileData.webhookUrl}
                onChange={(e) => setProfileData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="请输入Webhook回调地址"
                className="rounded-input"
              />
              <Text type="secondary" className="text-sm">
                用于接收系统通知和事件回调
              </Text>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="space-y-2">
              <Text strong className="text-gray-700">Webhook Secret</Text>
              <Input.Password
                size="large"
                value={profileData.webhookSecret}
                onChange={(e) => setProfileData(prev => ({ ...prev, webhookSecret: e.target.value }))}
                placeholder="请输入Webhook密钥"
                className="rounded-input"
              />
              <Text type="secondary" className="text-sm">
                用于验证Webhook请求的安全性
              </Text>
            </div>
          </Col>
        </Row>
        
        <div className="mt-6">
          <Button 
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={onUpdate} 
            loading={loading}
            className="primary-button px-8"
          >
            更新个人信息
          </Button>
        </div>
      </Card>

      {/* 账户详细信息 */}
      {tenantInfo && (
        <Card 
          title="账户详情" 
          className="border-0 shadow-sm card-bg-white"
          headStyle={{ 
            borderBottom: '1px solid #f0f0f0',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#262626'
          }}
        >
          <Descriptions 
            bordered 
            size="middle"
            column={{ xs: 1, sm: 2, md: 3 }}
            className="custom-descriptions"
          >
            <Descriptions.Item label="账户ID" span={3}>
              <Text code className="code-block">{tenantInfo.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(tenantInfo.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="最后更新">
              {new Date(tenantInfo.updatedAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="账户状态">
              <Tag color={tenantInfo.status === 1 ? 'success' : 'error'} className="font-medium">
                {tenantInfo.status === 1 ? '正常' : '异常'}
              </Tag>
            </Descriptions.Item>
            {tenantInfo.lastLoginAt && (
              <>
                <Descriptions.Item label="最后登录时间">
                  {new Date(tenantInfo.lastLoginAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="最后登录IP">
                  {tenantInfo.lastLoginIP || '未知'}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="API密钥" span={2}>
              <Text code className="code-block">
                {tenantInfo.apiKey}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Webhook URL">
              {tenantInfo.webhookUrl || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="IP白名单" span={3}>
              {tenantInfo.allowedIps && tenantInfo.allowedIps.length > 0 ? (
                <div>
                  {tenantInfo.allowedIps.map((ip, index) => (
                    <Tag key={index} color="blue" className="mb-1 mr-1">
                      {ip}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Text type="secondary">允许所有IP访问</Text>
              )}
            </Descriptions.Item>
            {tenantInfo.subscriptionStart && (
              <Descriptions.Item label="订阅开始">
                {new Date(tenantInfo.subscriptionStart).toLocaleDateString()}
              </Descriptions.Item>
            )}
            {tenantInfo.subscriptionEnd && (
              <Descriptions.Item label="订阅结束">
                {new Date(tenantInfo.subscriptionEnd).toLocaleDateString()}
              </Descriptions.Item>
            )}
            {tenantInfo.walletLimit && (
              <Descriptions.Item label="钱包限制">
                {tenantInfo.walletLimit}
              </Descriptions.Item>
            )}
            {tenantInfo.currencyLimit && (
              <Descriptions.Item label="货币限制">
                {tenantInfo.currencyLimit}
              </Descriptions.Item>
            )}
            {tenantInfo.rateLimitPerMinute && (
              <Descriptions.Item label="API限制">
                {tenantInfo.rateLimitPerMinute} 次/分钟
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </div>
  )
}

export default ProfileInfoForm 