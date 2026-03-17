/**
 * API密钥生成工具
 * 用于生成安全的API Key和Secret，主要用于接口签名校验
 */

/**
 * 生成随机字符串
 * @param length 字符串长度
 * @param charset 字符集
 * @returns 随机字符串
 */
function generateRandomString(length: number, charset: string): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

/**
 * 生成时间戳（基于当前时间的36进制）
 * @returns 时间戳字符串
 */
function generateTimestamp(): string {
  return Date.now().toString(36)
}

/**
 * 生成API Key
 * 格式: ak_[时间戳]_[随机字符串]
 * 示例: ak_1a2b3c4d_x9yz8w7v6u5t4s3r2q1p0o
 */
export function generateApiKey(): string {
  const timestamp = generateTimestamp()
  const randomPart = generateRandomString(24, 'abcdefghijklmnopqrstuvwxyz0123456789')
  return `ak_${timestamp}_${randomPart}`
}

/**
 * 生成API Secret
 * 格式: sk_[时间戳]_[随机字符串]
 * 使用更复杂的字符集，包含大小写字母、数字和特殊字符
 * 长度更长，安全性更高
 */
export function generateApiSecret(): string {
  const timestamp = generateTimestamp()
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const randomPart = generateRandomString(48, charset)
  return `sk_${timestamp}_${randomPart}`
}

/**
 * 生成API密钥对
 * @returns API Key和Secret对象
 */
export function generateApiKeyPair(): { apiKey: string; apiSecret: string } {
  return {
    apiKey: generateApiKey(),
    apiSecret: generateApiSecret()
  }
}

/**
 * 验证API Key格式
 * @param apiKey API Key
 * @returns 是否有效
 */
export function validateApiKey(apiKey: string): boolean {
  const apiKeyPattern = /^ak_[a-z0-9]+_[a-z0-9]{24}$/
  return apiKeyPattern.test(apiKey)
}

/**
 * 验证API Secret格式
 * @param apiSecret API Secret
 * @returns 是否有效
 */
export function validateApiSecret(apiSecret: string): boolean {
  const apiSecretPattern = /^sk_[a-z0-9]+_[A-Za-z0-9!@#$%^&*]{48}$/
  return apiSecretPattern.test(apiSecret)
}

/**
 * 从API Key中提取创建时间
 * @param apiKey API Key
 * @returns 创建时间（Date对象）或null
 */
export function extractApiKeyTimestamp(apiKey: string): Date | null {
  try {
    const parts = apiKey.split('_')
    if (parts.length >= 3 && parts[0] === 'ak') {
      const timestamp = parseInt(parts[1], 36)
      return new Date(timestamp)
    }
    return null
  } catch {
    return null
  }
}

/**
 * 检查API Key是否在指定天数内创建
 * @param apiKey API Key
 * @param days 天数
 * @returns 是否在指定天数内
 */
export function isApiKeyRecentlyCreated(apiKey: string, days: number): boolean {
  const createdDate = extractApiKeyTimestamp(apiKey)
  if (!createdDate) return false
  
  const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  return daysDiff <= days
} 