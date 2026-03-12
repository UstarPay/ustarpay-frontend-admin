import React from 'react'
import { Card, Button, Space, Typography } from 'antd'
import { WalletOutlined } from '@ant-design/icons'

const { Title } = Typography

interface PageHeaderCardProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
  showLogo?: boolean
  logoText?: string
  gradientColors?: string[]
}

/**
 * 页面头部卡片组件
 * 包含顶部彩条、标题、副标题、操作按钮和左下角logo
 */
const PageHeaderCard: React.FC<PageHeaderCardProps> = ({
  title,
  subtitle,
  actions,
  className = '',
  showLogo = true,
  logoText = 'NH Wallet',
  gradientColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c']
}) => {
  // 生成渐变背景
  const gradientStyle = {
    background: `linear-gradient(135deg, ${gradientColors.join(', ')})`,
    height: '4px',
    borderRadius: '6px 6px 0 0'
  }

  return (
    <Card 
      className={`relative overflow-hidden ${className}`}
      style={{ borderRadius: '8px' }}
    >
      {/* 顶部彩条 */}
      <div style={gradientStyle} />
      
      <div className="flex justify-between items-center pt-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Title level={2} className="!mb-0 !text-gray-800">
              {title}
            </Title>
            {showLogo && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium rounded-full">
                <WalletOutlined className="text-xs" />
                <span>{logoText}</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-gray-600 text-base mb-0">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="ml-4">
            {actions}
          </div>
        )}
      </div>
      
      {/* 左下角装饰性logo */}
      {showLogo && (
        <div className="absolute bottom-4 left-4 opacity-10">
          <div className="flex items-center gap-2 text-6xl font-bold text-gray-400">
            <WalletOutlined />
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {logoText}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

export default PageHeaderCard
