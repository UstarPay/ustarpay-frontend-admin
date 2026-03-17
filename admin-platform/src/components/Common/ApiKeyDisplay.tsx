import React from 'react'
import { Card, Row, Col, Typography, Tag, Tooltip, Divider } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { 
  validateApiKey, 
  validateApiSecret, 
  extractApiKeyTimestamp, 
  isApiKeyRecentlyCreated 
} from '@shared/utils'
import dayjs from 'dayjs'

const { Text, Title } = Typography

interface ApiKeyDisplayProps {
  apiKey?: string
  apiSecret?: string
  showSecret?: boolean
  title?: string
}

/**
 * API密钥信息展示组件
 */
const ApiKeyDisplay: React.FC<ApiKeyDisplayProps> = ({
  apiKey,
  apiSecret,
  showSecret = false,
  title = 'API密钥信息'
}) => {
  // 验证API Key
  const isApiKeyValid = apiKey ? validateApiKey(apiKey) : false
  const apiKeyTimestamp = apiKey ? extractApiKeyTimestamp(apiKey) : null
  const isRecentKey = apiKey ? isApiKeyRecentlyCreated(apiKey, 7) : false

  // 验证API Secret
  const isApiSecretValid = apiSecret ? validateApiSecret(apiSecret) : false

  // 格式化密钥显示
  const formatSecretDisplay = (secret: string) => {
    if (showSecret) return secret
    return secret.substring(0, 12) + '•'.repeat(secret.length - 16) + secret.substring(secret.length - 4)
  }

  return (
    <Card size="small" title={title} className="api-key-display">
      <Row gutter={16}>
        {/* API Key 信息 */}
        <Col span={12}>
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Text strong>API Key</Text>
              {isApiKeyValid ? (
                <Tag color="green" className="ml-2">
                  <CheckCircleOutlined /> 格式正确
                </Tag>
              ) : (
                <Tag color="red" className="ml-2">
                  <ExclamationCircleOutlined /> 格式错误
                </Tag>
              )}
              {isRecentKey && (
                <Tag color="blue" className="ml-1">
                  <ClockCircleOutlined /> 新密钥
                </Tag>
              )}
            </div>
            
            {apiKey && (
              <>
                <div className="bg-gray-50 p-2 rounded font-mono text-sm break-all">
                  {apiKey}
                </div>
                
                {apiKeyTimestamp && (
                  <div className="mt-2 text-xs text-gray-500">
                    <Tooltip title="密钥创建时间">
                      <span>创建于: {dayjs(apiKeyTimestamp).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </Tooltip>
                    <span className="ml-4">
                      已使用: {dayjs().diff(apiKeyTimestamp, 'day')}天
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </Col>

        {/* API Secret 信息 */}
        <Col span={12}>
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Text strong>API Secret</Text>
              {isApiSecretValid ? (
                <Tag color="green" className="ml-2">
                  <CheckCircleOutlined /> 格式正确
                </Tag>
              ) : (
                <Tag color="red" className="ml-2">
                  <ExclamationCircleOutlined /> 格式错误
                </Tag>
              )}
            </div>
            
            {apiSecret && (
              <div className="bg-gray-50 p-2 rounded font-mono text-sm break-all">
                {formatSecretDisplay(apiSecret)}
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Divider />
      <div className="text-xs text-gray-500">
        <Title level={5} className="text-gray-600">使用说明</Title>
        <ul className="mb-0 pl-4">
          <li>API Key用于标识客户端身份</li>
          <li>API Secret用于签名验证，请妥善保管</li>
          <li>建议定期更换密钥以提高安全性</li>
          <li>密钥格式: API Key以"ak_"开头，API Secret以"sk_"开头</li>
        </ul>
      </div>
    </Card>
  )
}

export default ApiKeyDisplay 