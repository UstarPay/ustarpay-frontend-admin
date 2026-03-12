import React from 'react'
import { Typography, Tag } from 'antd'
import { formatAmount, formatNumber } from '../utils'

const { Text } = Typography

interface AmountDisplayProps {
  amount: string | number
  symbol: string
  decimals?: number
  showSymbol?: boolean
  showFormatted?: boolean
  size?: 'small' | 'default' | 'large'
  type?: 'default' | 'success' | 'warning' | 'danger' | 'secondary'
  prefix?: string
  suffix?: string
  className?: string
}

/**
 * 金额显示组件
 * 支持格式化、符号显示等功能
 */
export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  symbol,
  decimals = 8,
  showSymbol = true,
  showFormatted = true,
  size = 'default',
  type = 'default',
  prefix,
  suffix,
  className,
}) => {
  const formattedAmount = formatAmount(amount, decimals)
  const displayAmount = showFormatted ? formatNumber(formattedAmount) : formattedAmount

  const getTextType = () => {
    switch (type) {
      case 'success':
        return 'success'
      case 'warning':
        return 'warning'
      case 'danger':
        return 'danger'
      case 'secondary':
        return 'secondary'
      default:
        return undefined
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'text-sm'
      case 'large':
        return 'text-lg'
      default:
        return 'text-base'
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {prefix && (
        <Text type="secondary" className="text-xs">
          {prefix}
        </Text>
      )}
      
      <Text 
        type={getTextType()}
        className={`font-mono ${getSizeClass()}`}
        title={`${formattedAmount} ${symbol}`}
      >
        {displayAmount}
      </Text>
      
      {showSymbol && (
        <Tag 
          className="text-xs font-medium" 
          color={type === 'success' ? 'green' : type === 'warning' ? 'orange' : type === 'danger' ? 'red' : 'blue'}
        >
          {symbol}
        </Tag>
      )}
      
      {suffix && (
        <Text type="secondary" className="text-xs">
          {suffix}
        </Text>
      )}
    </div>
  )
}

export default AmountDisplay
