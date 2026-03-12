import React from 'react'
import { Avatar } from 'antd'
import { CRYPTOCURRENCIES } from '../constants'

export interface CryptoIconProps {
  symbol: string
  size?: number | 'small' | 'default' | 'large'
  className?: string
  showSymbol?: boolean
}

// 加密货币图标映射
const CRYPTO_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  USDT: '₮',
  USDC: '$',
  BNB: 'B',
  ADA: '₳',
  DOT: '●',
  MATIC: '◇',
  LINK: '⧫',
  UNI: '🦄',
}

// 默认颜色映射
const DEFAULT_COLORS: Record<string, string> = {
  BTC: '#f7931a',
  ETH: '#627eea',
  USDT: '#26a17b',
  USDC: '#2775ca',
  BNB: '#f3ba2f',
  ADA: '#0033ad',
  DOT: '#e6007a',
  MATIC: '#8247e5',
  LINK: '#375bd2',
  UNI: '#ff007a',
}

export const CryptoIcon: React.FC<CryptoIconProps> = ({
  symbol,
  size = 'default',
  className = '',
  showSymbol = false,
}) => {
  const upperSymbol = symbol.toUpperCase()
  const cryptoInfo = CRYPTOCURRENCIES[upperSymbol as keyof typeof CRYPTOCURRENCIES]
  const icon = CRYPTO_ICONS[upperSymbol] || upperSymbol.charAt(0)
  const color = cryptoInfo?.color || DEFAULT_COLORS[upperSymbol] || '#666'
  
  const sizeMap = {
    small: 24,
    default: 32,
    large: 40,
  }
  
  const actualSize = typeof size === 'number' ? size : sizeMap[size]
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Avatar
        size={actualSize}
        style={{
          backgroundColor: color,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: actualSize * 0.4,
        }}
      >
        {icon}
      </Avatar>
      {showSymbol && (
        <span className="font-medium text-gray-700">
          {upperSymbol}
        </span>
      )}
    </div>
  )
}

// 加密货币徽章组件
export interface CryptoBadgeProps {
  symbol: string
  name?: string
  size?: 'small' | 'default' | 'large'
  className?: string
}

export const CryptoBadge: React.FC<CryptoBadgeProps> = ({
  symbol,
  name,
  size = 'default',
  className = '',
}) => {
  const upperSymbol = symbol.toUpperCase()
  const cryptoInfo = CRYPTOCURRENCIES[upperSymbol as keyof typeof CRYPTOCURRENCIES]
  const displayName = name || cryptoInfo?.name || upperSymbol

  const sizeClasses = {
    small: {
      container: 'px-2 py-1 text-xs',
      icon: 16,
    },
    default: {
      container: 'px-3 py-1.5 text-sm',
      icon: 20,
    },
    large: {
      container: 'px-4 py-2 text-base',
      icon: 24,
    },
  }

  const sizeConfig = sizeClasses[size]

  return (
    <div
      className={`
        inline-flex items-center gap-2 
        bg-gray-100 rounded-full
        ${sizeConfig.container}
        ${className}
      `}
    >
      <CryptoIcon symbol={symbol} size={sizeConfig.icon} />
      <span className="font-medium text-gray-700">
        {displayName}
      </span>
    </div>
  )
}
