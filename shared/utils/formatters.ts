import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { CRYPTOCURRENCIES, DATE_FORMATS } from '../constants'

dayjs.extend(relativeTime)

// 数字格式化工具
export const formatters = {
  // 格式化金额
  amount: (
    amount: number | string,
    options: {
      decimals?: number
      symbol?: string
      prefix?: string
      suffix?: string
      thousandsSeparator?: boolean
    } = {}
  ): string => {
    const {
      decimals = 8,
      symbol = '',
      prefix = '',
      suffix = '',
      thousandsSeparator = true,
    } = options

    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return '0'

    // 格式化数字
    let formatted = num.toFixed(decimals)
    
    // 移除尾随的零
    formatted = formatted.replace(/\.?0+$/, '')
    
    // 添加千分位分隔符
    if (thousandsSeparator) {
      const parts = formatted.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      formatted = parts.join('.')
    }

    return `${prefix}${formatted} ${symbol}${suffix}`.trim()
  },

  // 格式化加密货币金额
  crypto: (
    amount: number | string,
    symbol: string,
    options: {
      showFullDecimals?: boolean
      showSymbol?: boolean
    } = {}
  ): string => {
    const { showFullDecimals = false, showSymbol = true } = options
    const upperSymbol = symbol.toUpperCase()
    const cryptoInfo = CRYPTOCURRENCIES[upperSymbol as keyof typeof CRYPTOCURRENCIES]
    const decimals = showFullDecimals ? (cryptoInfo?.decimals || 8) : 8

    return formatters.amount(amount, {
      decimals,
      symbol: showSymbol ? upperSymbol : '',
    })
  },

  // 格式化法币金额
  fiat: (
    amount: number | string,
    currency = 'USD',
    locale = 'en-US'
  ): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return '$0.00'

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    } catch {
      return `${currency} ${num.toFixed(2)}`
    }
  },

  // 格式化百分比
  percentage: (
    value: number | string,
    decimals = 2,
    showSign = true
  ): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0%'

    const sign = num > 0 && showSign ? '+' : ''
    return `${sign}${num.toFixed(decimals)}%`
  },

  // 格式化大数字（K, M, B）
  compact: (
    value: number | string,
    decimals = 1
  ): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0'

    const absNum = Math.abs(num)
    const sign = num < 0 ? '-' : ''

    if (absNum >= 1e9) {
      return `${sign}${(absNum / 1e9).toFixed(decimals)}B`
    } else if (absNum >= 1e6) {
      return `${sign}${(absNum / 1e6).toFixed(decimals)}M`
    } else if (absNum >= 1e3) {
      return `${sign}${(absNum / 1e3).toFixed(decimals)}K`
    }

    return num.toString()
  },

  // 格式化文件大小
  fileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  },

  // 格式化时间
  time: {
    // 相对时间（多久前）
    relative: (date: string | Date | dayjs.Dayjs): string => {
      return dayjs(date).fromNow()
    },

    // 格式化日期时间
    dateTime: (
      date: string | Date | dayjs.Dayjs,
      format = DATE_FORMATS.FULL
    ): string => {
      return dayjs(date).format(format)
    },

    // 只显示日期
    date: (date: string | Date | dayjs.Dayjs): string => {
      return dayjs(date).format(DATE_FORMATS.DATE)
    },

    // 只显示时间
    timeOnly: (date: string | Date | dayjs.Dayjs): string => {
      return dayjs(date).format(DATE_FORMATS.TIME)
    },

    // 智能时间显示（今天显示时间，其他显示日期）
    smart: (date: string | Date | dayjs.Dayjs): string => {
      const target = dayjs(date)
      const now = dayjs()

      if (target.isSame(now, 'day')) {
        return target.format(DATE_FORMATS.TIME)
      } else if (target.isSame(now, 'year')) {
        return target.format('MM-DD HH:mm')
      } else {
        return target.format(DATE_FORMATS.FULL)
      }
    },

    // 持续时间（秒转换为可读格式）
    duration: (seconds: number): string => {
      if (seconds < 60) {
        return `${seconds}秒`
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600)
        const remainingMinutes = Math.floor((seconds % 3600) / 60)
        return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
      } else {
        const days = Math.floor(seconds / 86400)
        const remainingHours = Math.floor((seconds % 86400) / 3600)
        return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`
      }
    },
  },

  // 格式化地址（区块链地址）
  address: (
    address: string,
    options: {
      start?: number
      end?: number
      separator?: string
    } = {}
  ): string => {
    const { start = 6, end = 4, separator = '...' } = options
    
    if (!address || address.length <= start + end) {
      return address
    }

    return `${address.slice(0, start)}${separator}${address.slice(-end)}`
  },

  // 格式化哈希值
  hash: (hash: string, length = 8): string => {
    if (!hash || hash.length <= length * 2) {
      return hash
    }
    return `${hash.slice(0, length)}...${hash.slice(-length)}`
  },

  // 格式化电话号码
  phone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // 中国手机号码格式
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
    } else if (cleaned.length === 10) {
      // 美国电话号码格式
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
    }
    
    return phone
  },

  // 格式化身份证号
  idCard: (idCard: string): string => {
    if (idCard.length === 18) {
      return idCard.replace(/(\d{6})(\d{8})(\d{4})/, '$1 $2 $3')
    } else if (idCard.length === 15) {
      return idCard.replace(/(\d{6})(\d{6})(\d{3})/, '$1 $2 $3')
    }
    return idCard
  },

  // 格式化银行卡号
  bankCard: (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\D/g, '')
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
  },
}

// 导出单独的格式化函数以便直接使用
export const {
  amount: formatAmount,
  crypto: formatCrypto,
  fiat: formatFiat,
  percentage: formatPercentage,
  compact: formatCompact,
  fileSize: formatFileSize,
  time: formatTime,
  address: formatAddress,
  hash: formatHash,
  phone: formatPhone,
  idCard: formatIdCard,
  bankCard: formatBankCard,
} = formatters
