import React from 'react'
import { Row, Col } from 'antd'
import { 
  LinkOutlined, 
  DollarOutlined, 
  WalletOutlined, 
  DatabaseOutlined,
  TeamOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  CrownOutlined
} from '@ant-design/icons'
import StatCard from './StatCard'

interface WalletSummaryStatsProps {
  totalChains: number
  totalCurrencies: number
  activeWallets: number
  totalBalanceRecords: number
  className?: string
}

/**
 * 钱包汇总统计组件
 * 显示钱包相关的统计信息，采用现代化设计
 */
const WalletSummaryStats: React.FC<WalletSummaryStatsProps> = ({
  totalChains,
  totalCurrencies,
  activeWallets,
  totalBalanceRecords,
  className = ''
}) => {
  const statsData = [
    {
      title: '总链数',
      value: totalChains,
      icon: <LinkOutlined />,
      topStripColor: 'bg-green-500',
      iconColor: 'text-green-600',
      decorationIcon: <TeamOutlined />
    },
    {
      title: '总币种数',
      value: totalCurrencies,
      icon: <DollarOutlined />,
      topStripColor: 'bg-blue-500',
      iconColor: 'text-blue-600',
      decorationIcon: <ShoppingOutlined />
    },
    {
      title: '活跃钱包',
      value: activeWallets,
      icon: <WalletOutlined />,
      topStripColor: 'bg-purple-500',
      iconColor: 'text-purple-600',
      decorationIcon: <BarChartOutlined />
    },
    {
      title: '总余额记录',
      value: totalBalanceRecords,
      icon: <DatabaseOutlined />,
      topStripColor: 'bg-orange-500',
      iconColor: 'text-orange-600',
      decorationIcon: <CrownOutlined />
    }
  ]

  return (
    <Row gutter={[20, 20]} className={className}>
      {statsData.map((stat, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <StatCard
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            decorationIcon={stat.decorationIcon}
            topStripColor={stat.topStripColor}
            iconColor={stat.iconColor}
            trend="up"
          />
        </Col>
      ))}
    </Row>
  )
}

export default WalletSummaryStats
