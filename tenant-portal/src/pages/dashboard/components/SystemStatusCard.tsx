import React from 'react'
import { Card, Space, Typography, Progress, Tag } from 'antd'


const { Text } = Typography

interface SystemStatusCardProps {
  systemStatus: any
}

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ systemStatus }) => {
  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return '#52c41a'
      case 'warning': return '#faad14'
      case 'error': return '#ff4d4f'
      default: return '#d9d9d9'
    }
  }

  const getSystemHealthText = (health: string) => {
    switch (health) {
      case 'healthy': return '正常'
      case 'warning': return '警告'
      case 'error': return '错误'
      default: return '未知'
    }
  }

  return (
    <Card title="系统状态" className="h-full">
      {systemStatus ? (
        <Space direction="vertical" size="large" className="w-full">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Text>整体状态</Text>
              <Tag color={getSystemHealthColor(systemStatus.overall)}>
                {getSystemHealthText(systemStatus.overall)}
              </Tag>
            </div>
          </div>

          {systemStatus.metrics && (
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Text>CPU使用率</Text>
                  <Text strong>{systemStatus.metrics.cpuUsage}%</Text>
                </div>
                <Progress percent={systemStatus.metrics.cpuUsage} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Text>内存使用率</Text>
                  <Text strong>{systemStatus.metrics.memoryUsage}%</Text>
                </div>
                <Progress percent={systemStatus.metrics.memoryUsage} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Text>磁盘使用率</Text>
                  <Text strong>{systemStatus.metrics.diskUsage}%</Text>
                </div>
                <Progress percent={systemStatus.metrics.diskUsage} />
              </div>
            </>
          )}
        </Space>
      ) : (
        <Text type="secondary">暂无系统状态数据</Text>
      )}
    </Card>
  )
}

export default SystemStatusCard 