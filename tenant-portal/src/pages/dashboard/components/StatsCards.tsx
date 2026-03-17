import React from 'react'
import { Row, Col, Card, Statistic } from 'antd'
import {
  WalletOutlined,
  UserOutlined,
  TransactionOutlined,
  DollarOutlined
} from '@ant-design/icons'
import type { DashboardData } from '@/services'

// 格式化大数字
function formatVolume(value: string | number | undefined): string {
  if (value === undefined || value === null) return '0'
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (isNaN(num)) return '0'
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toLocaleString()
}

interface StatsCardsProps {
  stats: DashboardData
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const wallets = stats?.wallets ?? { totalWallets: 0, activeWallets: 0 }
  const transactions = stats?.transactions ?? {
    totalTransactions: 0,
    volumeStats: { totalVolume: '0', depositVolume: '0', withdrawVolume: '0' }
  }

  const cards = [
    {
      title: '总钱包数',
      value: Number(wallets.totalWallets ?? 0),
      suffix: '个',
      prefix: <WalletOutlined />,
      color: '#2ecc71',
      bgColor: '#f8f9fa',
      borderColor: '#e9ecef',
      icon: '💼'
    },
    {
      title: '活跃钱包',
      value: Number(wallets.activeWallets ?? 0),
      suffix: '个',
      prefix: <UserOutlined />,
      color: '#3498db',
      bgColor: '#f8f9fa',
      borderColor: '#e9ecef',
      icon: '👥'
    },
    {
      title: '总交易数',
      value: Number(transactions.totalTransactions ?? 0),
      suffix: '笔',
      prefix: <TransactionOutlined />,
      color: '#9b59b6',
      bgColor: '#f8f9fa',
      borderColor: '#e9ecef',
      icon: '📊'
    },
    {
      title: '总交易量',
      value: formatVolume(transactions.volumeStats?.totalVolume ?? '0'),
      suffix: '',
      prefix: <DollarOutlined />,
      color: '#e67e22',
      bgColor: '#f8f9fa',
      borderColor: '#e9ecef',
      icon: '💎'
    }
  ]

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {cards.map((card, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card
            className="stats-card"
            style={{
              background: card.bgColor,
              border: `1px solid ${card.borderColor}`,
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            bodyStyle={{ 
              padding: '20px',
              position: 'relative',
              zIndex: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.borderColor = card.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)'
              e.currentTarget.style.borderColor = card.borderColor
            }}
          >
            {/* 顶部装饰条 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: card.color,
                borderRadius: '8px 8px 0 0'
              }}
            />
            
            <Statistic
              title={
                <span style={{ 
                  color: '#495057', 
                  fontSize: '13px',
                  fontWeight: 500
                }}>
                  {card.title}
                </span>
              }
              value={card.value}
              prefix={
                <span style={{ 
                  color: card.color,
                  marginRight: '8px',
                  fontSize: '16px'
                }}>
                  {card.prefix}
                </span>
              }
              valueStyle={{ 
                color: '#2c3e50',
                fontSize: '24px',
                fontWeight: 600
              }}
              suffix={
                card.suffix ? (
                  <span style={{ 
                    color: '#6c757d',
                    fontSize: '12px',
                    marginLeft: '4px',
                    fontWeight: 500
                  }}>
                    {card.suffix}
                  </span>
                ) : undefined
              }
            />
            
            {/* 底部装饰 */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `${card.color}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                opacity: 0.6
              }}
            >
              {card.icon}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default StatsCards 