import React from 'react'
import { Card, Space, Typography, Progress } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined
} from '@ant-design/icons'
import type { DashboardData } from '@/services'

const { Text } = Typography

interface TransactionStatsCardProps {
  stats: DashboardData
}

const TransactionStatsCard: React.FC<TransactionStatsCardProps> = ({ stats }) => {
  const tx = stats?.transactions ?? {
    totalTransactions: 0,
    successTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0
  }

  // 计算成功率
  const successRate = tx.totalTransactions > 0
    ? ((tx.successTransactions / tx.totalTransactions) * 100).toFixed(1)
    : '0'

  const statsItems = [
    {
      key: 'success',
      title: '成功交易',
      value: tx.successTransactions,
      icon: <CheckCircleOutlined />,
      color: '#2ecc71',
      percent: parseFloat(successRate)
    },
    {
      key: 'pending',
      title: '待处理交易',
      value: tx.pendingTransactions,
      icon: <ClockCircleOutlined />,
      color: '#f39c12',
      percent: tx.totalTransactions > 0
        ? parseFloat(((tx.pendingTransactions / tx.totalTransactions) * 100).toFixed(1))
        : 0
    },
    {
      key: 'failed',
      title: '失败交易',
      value: tx.failedTransactions,
      icon: <CloseCircleOutlined />,
      color: '#e74c3c',
      percent: tx.totalTransactions > 0
        ? parseFloat(((tx.failedTransactions / tx.totalTransactions) * 100).toFixed(1))
        : 0
    }
  ]

  return (
    <Card
      title={
        <Space>
          <RiseOutlined style={{ color: '#3498db' }} />
          <span style={{ fontWeight: 600, color: '#2c3e50' }}>交易统计详情</span>
        </Space>
      }
      className="h-full transaction-stats-card"
      style={{
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e9ecef'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <Space direction="vertical" size="large" className="w-full">
        {statsItems.map(item => (
          <div 
            key={item.key}
            className="transaction-stat-item"
            style={{
              padding: '12px',
              borderRadius: '6px',
              background: '#f8f9fa',
              border: `1px solid #e9ecef`,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(2px)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
              e.currentTarget.style.borderColor = item.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e9ecef'
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <Space>
                <div style={{ 
                  color: item.color,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {item.icon}
                </div>
                <Text strong style={{ fontSize: '13px', color: '#2c3e50' }}>
                  {item.title}
                </Text>
              </Space>
              <div style={{
                background: item.color,
                padding: '4px 8px',
                borderRadius: '4px',
                color: 'white',
                fontWeight: 600,
                fontSize: '12px'
              }}>
                {item.value}
              </div>
            </div>
            <Progress
              percent={item.percent}
              strokeColor={item.color}
              trailColor="#e9ecef"
              strokeWidth={4}
              showInfo={false}
              style={{ marginBottom: 0 }}
            />
            <div className="mt-2 flex justify-between items-center">
              <Text style={{ color: '#6c757d', fontSize: '11px' }}>
                占比 {item.percent.toFixed(1)}%
              </Text>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: item.color
              }} />
            </div>
          </div>
        ))}

        {/* 总计信息 */}
        <div style={{
          background: '#f8f9fa',
          padding: '16px',
          borderRadius: '6px',
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <Text style={{ color: '#495057', fontSize: '13px', display: 'block' }}>
            总交易数
          </Text>
          <Text strong style={{ color: '#2c3e50', fontSize: '20px', display: 'block', margin: '4px 0' }}>
            {tx.totalTransactions}
          </Text>
          <Text style={{ color: '#6c757d', fontSize: '11px' }}>
            成功率 {successRate}%
          </Text>
        </div>
      </Space>
    </Card>
  )
}

export default TransactionStatsCard 