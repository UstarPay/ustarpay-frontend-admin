// 共享工具函数

import dayjs from 'dayjs'

// 导出API密钥生成工具
export * from './apiKeyGenerator'

/**
 * 格式化数字金额
 * @param amount 金额字符串或数字
 * @param decimals 小数位数
 * @returns 格式化后的金额字符串
 */
export const formatAmount = (amount: string | number, decimals: number = 8): string => {
  if (!amount) return '0'
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0'
  
  // 处理科学计数法
  const fixed = num.toFixed(decimals)
  
  // 移除末尾的0
  return parseFloat(fixed).toString()
}

/**
 * 格式化数字，添加千分位分隔符
 * @param num 数字
 * @returns 格式化后的字符串
 */
export const formatNumber = (num: number | string): string => {
  if (!num) return '0'
  
  const number = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(number)) return '0'
  
  return number.toLocaleString('zh-CN')
}

/**
 * 截取字符串，保留前后部分
 * @param str 原字符串
 * @param startLength 开始保留长度
 * @param endLength 结束保留长度
 * @returns 截取后的字符串
 */
export const truncateString = (
  str: string, 
  startLength: number = 6, 
  endLength: number = 6
): string => {
  if (!str || str.length <= startLength + endLength) return str
  
  return `${str.slice(0, startLength)}...${str.slice(-endLength)}`
}

/**
 * 生成随机ID
 * @param length 长度
 * @returns 随机ID字符串
 */
export const generateId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 深拷贝对象
 * @param obj 原对象
 * @returns 深拷贝后的对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  
  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间
 * @returns 防抖后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait) as any
  }
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param wait 等待时间
 * @returns 节流后的函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, wait)
    }
  }
}

/**
 * 下载文件
 * @param url 文件URL
 * @param filename 文件名
 */
export const downloadFile = (url: string, filename?: string): void => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 是否复制成功
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

/**
 * 获取文件大小的可读格式
 * @param bytes 字节数
 * @returns 格式化后的文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证手机号格式（中国大陆）
 * @param phone 手机号
 * @returns 是否有效
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证区块链地址格式
 * @param address 地址
 * @param type 地址类型
 * @returns 是否有效
 */
export const isValidAddress = (address: string, type: 'bitcoin' | 'ethereum' = 'ethereum'): boolean => {
  if (!address) return false
  
  if (type === 'ethereum') {
    // 以太坊地址格式验证
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  } else if (type === 'bitcoin') {
    // 比特币地址格式验证（简化版）
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || 
           /^bc1[a-z0-9]{39,59}$/.test(address)
  }
  
  return false
}

/**
 * 获取随机颜色
 * @param alpha 透明度
 * @returns 颜色字符串
 */
export const getRandomColor = (alpha: number = 1): string => {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 安全的JSON解析
 * @param json JSON字符串
 * @param defaultValue 默认值
 * @returns 解析后的对象或默认值
 */
export const safeJsonParse = <T>(json: string, defaultValue: T): T => {
  try {
    return JSON.parse(json) as T
  } catch (error) {
    return defaultValue
  }
}

/**
 * 检查对象是否为空
 * @param obj 对象
 * @returns 是否为空
 */
export const isEmptyObject = (obj: Record<string, any>): boolean => {
  return Object.keys(obj).length === 0
}

/**
 * 获取对象路径值
 * @param obj 对象
 * @param path 路径字符串
 * @param defaultValue 默认值
 * @returns 值或默认值
 */
export const getObjectPath = <T>(
  obj: Record<string, any>, 
  path: string, 
  defaultValue?: T
): T | undefined => {
  const keys = path.split('.')
  let result = obj
  
  for (const key of keys) {
    if (result === null || result === undefined || !(key in result)) {
      return defaultValue
    }
    result = result[key]
  }
  
  return result as T
}

/**
 * 设置对象路径值
 * @param obj 对象
 * @param path 路径字符串
 * @param value 值
 */
export const setObjectPath = (
  obj: Record<string, any>, 
  path: string, 
  value: any
): void => {
  const keys = path.split('.')
  const lastKey = keys.pop()
  
  if (!lastKey) return
  
  let current = obj
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[lastKey] = value
}

/**
 * 格式化日期时间
 * @param date 日期字符串或Date对象
 * @param format 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串  
 */
export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

// 导出格式化工具
export * from './formatters'

// 导出验证工具
export * from './validators'

// 导出API工具
export * from './api'

export * from './passwordGenerator'
