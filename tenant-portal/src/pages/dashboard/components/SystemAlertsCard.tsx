import React from 'react'
import { Card, Table, Button, Tag, Typography, Tooltip, Badge, Space } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography

interface SystemAlert {
  id: string
  type: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
  severity: number
}

interface SystemAlertsCardProps {
  alerts: SystemAlert[]
  onNavigate: (url: string) => void
}

const SystemAlertsCard: React.FC<SystemAlertsCardProps> = ({ alerts, onNavigate }) => {
  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'red'
      case 'warning': return 'orange'
      case 'info': return 'blue'
      case 'success': return 'green'
      default: return 'default'
    }
  }

  const alertColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getAlertTypeColor(type)}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => <Text strong>{title}</Text>
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      render: (message: string) => (
        <Tooltip title={message}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {message}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    }
  ]

  return (
    <Card
      title={
        <Space>
          <span>系统警报</span>
          {alerts.length > 0 && (
            <Badge count={alerts.length} style={{ backgroundColor: '#ff4d4f' }} />
          )}
        </Space>
      }
      extra={null}
    >
      {alerts.length > 0 ? (
        <Table
          columns={alertColumns}
          dataSource={alerts}
          rowKey="id"
          pagination={false}
          size="small"
          className="compact-table"
        />
      ) : (
        <div className="text-center py-8">
          <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
          <Paragraph className="mt-4" type="secondary">
            暂无系统警报
          </Paragraph>
        </div>
      )}
    </Card>
  )
}

export default SystemAlertsCard 