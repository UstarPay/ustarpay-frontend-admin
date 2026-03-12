import React from 'react'
import { Card, Space, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined } from '@ant-design/icons'
import type { DashboardData } from '@/services'

const { Text } = Typography

// 格式化数字，避免科学计数法
function formatVolume(value: string | undefined): string {
  if (!value || value === '0') return '0'
  const num = parseFloat(value)
  if (isNaN(num)) return '0'
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

interface VolumeStatsCardProps {
  stats: DashboardData
}

const VolumeStatsCard: React.FC<VolumeStatsCardProps> = ({ stats }) => {
  const volumeStats = stats.transactions?.volumeStats
  const depositVolume = volumeStats?.depositVolume ?? '0'
  const withdrawVolume = volumeStats?.withdrawVolume ?? '0'
  const totalVolume = volumeStats?.totalVolume ?? '0'

  const volumeItems = [
    {
      key: 'deposit',
      title: '充值量',
      value: formatVolume(depositVolume),
      rawValue: depositVolume,
      icon: <ArrowUpOutlined />,
      color: '#2ecc71'
    },
    {
      key: 'withdraw',
      title: '提现量',
      value: formatVolume(withdrawVolume),
      rawValue: withdrawVolume,
      icon: <ArrowDownOutlined />,
      color: '#e74c3c'
    },
    {
      key: 'total',
      title: '总交易量',
      value: formatVolume(totalVolume),
      rawValue: totalVolume,
      icon: <DollarOutlined />,
      color: '#3498db'
    }
  ]

  return (
    <Card 
      title={
        <Space>
          <DollarOutlined style={{ color: '#3498db' }} />
          <span style={{ fontWeight: 600, color: '#2c3e50' }}>交易量统计</span>
        </Space>
      }
      className="h-full volume-stats-card"
      style={{
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e9ecef'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <Space direction="vertical" size="large" className="w-full">
        {volumeItems.map(item => (
          <div 
            key={item.key}
            className="volume-stat-item"
            style={{
              padding: '16px',
              borderRadius: '6px',
              background: '#f8f9fa',
              border: `1px solid #e9ecef`,
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
              e.currentTarget.style.borderColor = item.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e9ecef'
            }}
          >
            <div className="flex justify-between items-center">
              <Space size="middle">
                <div style={{ 
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  background: item.color,
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  {item.icon}
                </div>
                <div>
                  <Text style={{ 
                    fontSize: '12px', 
                    color: '#6c757d',
                    display: 'block',
                    marginBottom: '2px'
                  }}>
                    {item.title}
                  </Text>
                  <Text strong style={{ 
                    fontSize: '16px',
                    color: '#2c3e50',
                    display: 'block'
                  }}>
                    {item.value}
                  </Text>
                </div>
              </Space>
            </div>
          </div>
        ))}

        {/* 总计卡片 - 使用总交易量，避免重复计算 */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '6px',
          border: '1px solid #e9ecef',
          textAlign: 'center',
          position: 'relative'
        }}>
          <Text style={{ color: '#495057', fontSize: '13px', display: 'block' }}>
            本月总交易量
          </Text>
          <Text strong style={{ 
            color: '#2c3e50', 
            fontSize: '24px', 
            display: 'block',
            margin: '8px 0',
            fontWeight: 600
          }}>
            {formatVolume(totalVolume)}
          </Text>
          <Text style={{ color: '#6c757d', fontSize: '11px' }}>
            充值与提现（成功交易）
          </Text>
        </div>
      </Space>
    </Card>
  )
}

export default VolumeStatsCard 