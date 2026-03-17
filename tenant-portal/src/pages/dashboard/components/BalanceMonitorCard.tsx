import React from 'react'
import { Card, Statistic, Row, Col, Tag, Button, Space } from 'antd'
import { WarningOutlined, CheckCircleOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

interface BalanceMonitorCardProps {
  stats?: {
    totalMonitors: number
    activeMonitors: number
    triggeredAlerts: number
    lastAlertTime?: string
  }
}

const BalanceMonitorCard: React.FC<BalanceMonitorCardProps> = ({ stats }) => {
  const navigate = useNavigate()

  const defaultStats = {
    totalMonitors: 0,
    activeMonitors: 0,
    triggeredAlerts: 0,
    lastAlertTime: undefined
  }

  const monitorStats = stats || defaultStats

  return (
    <Card
      title={
        <Space>
          <BellOutlined />
          <span>余额监控</span>
        </Space>
      }
      extra={
        <Button
          type="link"
          size="small"
          onClick={() => navigate('/wallets/monitor')}
        >
          查看详情
        </Button>
      }
    >
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="监控规则"
            value={monitorStats.totalMonitors}
            suffix="个"
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="启用中"
            value={monitorStats.activeMonitors}
            suffix="个"
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="已触发"
            value={monitorStats.triggeredAlerts}
            suffix="次"
            prefix={monitorStats.triggeredAlerts > 0 ? <WarningOutlined /> : undefined}
            valueStyle={{ color: monitorStats.triggeredAlerts > 0 ? '#ff4d4f' : '#8c8c8c' }}
          />
        </Col>
      </Row>
      {monitorStats.lastAlertTime && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space>
            <Tag color="warning">最近预警</Tag>
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>
              {monitorStats.lastAlertTime}
            </span>
          </Space>
        </div>
      )}
    </Card>
  )
}

export default BalanceMonitorCard
