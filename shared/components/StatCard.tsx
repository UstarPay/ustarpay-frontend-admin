import React from 'react'
import { Card } from 'antd'

interface StatCardProps {
  /** 统计项标题 */
  title: string
  /** 统计项数值 */
  value: number | string
  /** 主图标组件（数值旁边） */
  icon: React.ReactNode
  /** 装饰图标组件（右下角） */
  decorationIcon?: React.ReactNode
  /** 顶部条带颜色类名 */
  topStripColor?: string
  /** 主图标颜色类名 */
  iconColor?: string
  /** 数值颜色类名 */
  valueColor?: string
  /** 卡片背景色类名 */
  bgColor?: string
  /** 自定义类名 */
  className?: string
  /** 是否显示千分位分隔符 */
  showThousandsSeparator?: boolean
  /** 数值后缀 */
  suffix?: string
  /** 数值前缀 */
  prefix?: string
  /** 趋势指示器 */
  trend?: 'up' | 'down' | 'neutral'
}

/**
 * 通用统计卡片组件
 * 用于显示各种统计信息，采用现代化设计
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  decorationIcon,
  topStripColor = 'bg-blue-500',
  iconColor = 'text-blue-600',
  valueColor = 'text-gray-800',
  bgColor = 'bg-white',
  className = '',
  showThousandsSeparator = true,
  suffix = '',
  prefix = '',
  trend
}) => {
  // 格式化数值
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return showThousandsSeparator ? val.toLocaleString() : val.toString()
    }
    return val
  }

  // 趋势图标
  const getTrendIcon = () => {
    if (trend === 'up') {
      return <span className="text-green-500 text-sm">↗</span>
    } else if (trend === 'down') {
      return <span className="text-red-500 text-sm">↘</span>
    }
    return null
  }

  return (
    <Card 
      className={`${bgColor} border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${className}`}
      style={{ borderRadius: '12px' }}
    >
      {/* 顶部彩色条带 */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${topStripColor}`}></div>
      
      <div className="relative">
        {/* 标题 */}
        <div className="text-sm font-medium text-gray-600 mb-3">
          {title}
        </div>
        
        {/* 数值和图标区域 */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`text-lg ${iconColor}`}>
            {icon}
          </div>
          <div className={`text-2xl font-bold ${valueColor}`}>
            {prefix}{formatValue(value)}{suffix}
          </div>
          {getTrendIcon()}
        </div>
        
        {/* 右下角装饰图标 */}
        {decorationIcon && (
          <div className="absolute bottom-0 right-0 text-gray-300 text-2xl opacity-30">
            {decorationIcon}
          </div>
        )}
      </div>
    </Card>
  )
}

export default StatCard
