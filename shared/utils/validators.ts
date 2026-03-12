import { VALIDATION_RULES } from '../constants'

// 验证结果接口
export interface ValidationResult {
  isValid: boolean
  message?: string
}

// 基础验证函数
export const validators = {
  // 必填验证
  required: (value: any, message = '此字段为必填项'): ValidationResult => {
    const isValid = value !== null && value !== undefined && value !== '' && 
                   (!Array.isArray(value) || value.length > 0)
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // 字符串长度验证
  length: (
    value: string,
    options: { min?: number; max?: number; exact?: number },
    message?: string
  ): ValidationResult => {
    if (!value) return { isValid: true }

    const { min, max, exact } = options
    const length = value.length

    if (exact !== undefined) {
      const isValid = length === exact
      return {
        isValid,
        message: isValid ? undefined : message || `长度必须为 ${exact} 个字符`,
      }
    }

    if (min !== undefined && length < min) {
      return {
        isValid: false,
        message: message || `最少需要 ${min} 个字符`,
      }
    }

    if (max !== undefined && length > max) {
      return {
        isValid: false,
        message: message || `最多允许 ${max} 个字符`,
      }
    }

    return { isValid: true }
  },

  // 数字范围验证
  range: (
    value: number,
    options: { min?: number; max?: number },
    message?: string
  ): ValidationResult => {
    if (value === null || value === undefined || isNaN(value)) {
      return { isValid: true }
    }

    const { min, max } = options

    if (min !== undefined && value < min) {
      return {
        isValid: false,
        message: message || `数值不能小于 ${min}`,
      }
    }

    if (max !== undefined && value > max) {
      return {
        isValid: false,
        message: message || `数值不能大于 ${max}`,
      }
    }

    return { isValid: true }
  },

  // 邮箱验证
  email: (value: string, message = '请输入有效的邮箱地址'): ValidationResult => {
    if (!value) return { isValid: true }

    const isValid = VALIDATION_RULES.EMAIL.test(value)
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // 手机号验证
  phone: (value: string, message = '请输入有效的手机号码'): ValidationResult => {
    if (!value) return { isValid: true }

    const isValid = VALIDATION_RULES.PHONE.test(value)
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // 密码验证
  password: (
    value: string,
    options: {
      minLength?: number
      maxLength?: number
      requireUppercase?: boolean
      requireLowercase?: boolean
      requireNumbers?: boolean
      requireSpecialChars?: boolean
    } = {},
    message?: string
  ): ValidationResult => {
    if (!value) return { isValid: true }

    const {
      minLength = VALIDATION_RULES.PASSWORD.MIN_LENGTH,
      maxLength = VALIDATION_RULES.PASSWORD.MAX_LENGTH,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
    } = options

    // 长度检查
    if (value.length < minLength) {
      return {
        isValid: false,
        message: message || `密码长度至少 ${minLength} 位`,
      }
    }

    if (value.length > maxLength) {
      return {
        isValid: false,
        message: message || `密码长度不能超过 ${maxLength} 位`,
      }
    }

    // 复杂度检查
    const checks = []
    if (requireUppercase && !/[A-Z]/.test(value)) {
      checks.push('大写字母')
    }
    if (requireLowercase && !/[a-z]/.test(value)) {
      checks.push('小写字母')
    }
    if (requireNumbers && !/\d/.test(value)) {
      checks.push('数字')
    }
    if (requireSpecialChars && !/[@$!%*?&]/.test(value)) {
      checks.push('特殊字符(@$!%*?&)')
    }

    if (checks.length > 0) {
      return {
        isValid: false,
        message: message || `密码必须包含：${checks.join('、')}`,
      }
    }

    return { isValid: true }
  },

  // 确认密码验证
  confirmPassword: (
    value: string,
    originalPassword: string,
    message = '两次输入的密码不一致'
  ): ValidationResult => {
    if (!value) return { isValid: true }

    const isValid = value === originalPassword
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // URL 验证
  url: (value: string, message = '请输入有效的URL地址'): ValidationResult => {
    if (!value) return { isValid: true }

    try {
      new URL(value)
      return { isValid: true }
    } catch {
      return {
        isValid: false,
        message,
      }
    }
  },

  // 比特币地址验证
  bitcoinAddress: (
    value: string,
    message = '请输入有效的比特币地址'
  ): ValidationResult => {
    if (!value) return { isValid: true }

    const isValid = VALIDATION_RULES.BITCOIN_ADDRESS.test(value)
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // 以太坊地址验证
  ethereumAddress: (
    value: string,
    message = '请输入有效的以太坊地址'
  ): ValidationResult => {
    if (!value) return { isValid: true }

    const isValid = VALIDATION_RULES.ETHEREUM_ADDRESS.test(value)
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // 身份证号验证
  idCard: (value: string, message = '请输入有效的身份证号码'): ValidationResult => {
    if (!value) return { isValid: true }

    // 18位身份证号码验证
    const id18 = /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
    // 15位身份证号码验证
    const id15 = /^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}$/

    const isValid = id18.test(value) || id15.test(value)
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // 银行卡号验证（简单的Luhn算法）
  bankCard: (value: string, message = '请输入有效的银行卡号'): ValidationResult => {
    if (!value) return { isValid: true }

    const cardNumber = value.replace(/\D/g, '')
    
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return {
        isValid: false,
        message,
      }
    }

    // Luhn算法验证
    let sum = 0
    let shouldDouble = false

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i))

      if (shouldDouble) {
        if ((digit *= 2) > 9) {
          digit -= 9
        }
      }

      sum += digit
      shouldDouble = !shouldDouble
    }

    const isValid = sum % 10 === 0
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // JSON格式验证
  json: (value: string, message = '请输入有效的JSON格式'): ValidationResult => {
    if (!value) return { isValid: true }

    try {
      JSON.parse(value)
      return { isValid: true }
    } catch {
      return {
        isValid: false,
        message,
      }
    }
  },

  // 数字验证
  number: (value: any, message = '请输入有效的数字'): ValidationResult => {
    if (value === null || value === undefined || value === '') {
      return { isValid: true }
    }

    const isValid = !isNaN(Number(value))
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // 整数验证
  integer: (value: any, message = '请输入有效的整数'): ValidationResult => {
    if (value === null || value === undefined || value === '') {
      return { isValid: true }
    }

    const num = Number(value)
    const isValid = !isNaN(num) && Number.isInteger(num)
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // 正数验证
  positive: (value: number, message = '数值必须大于0'): ValidationResult => {
    if (value === null || value === undefined || isNaN(value)) {
      return { isValid: true }
    }

    const isValid = value > 0
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // 日期验证
  date: (value: string, message = '请输入有效的日期'): ValidationResult => {
    if (!value) return { isValid: true }

    const date = new Date(value)
    const isValid = !isNaN(date.getTime())
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },

  // 自定义正则表达式验证
  pattern: (
    value: string,
    pattern: RegExp,
    message = '输入格式不正确'
  ): ValidationResult => {
    if (!value) return { isValid: true }

    const isValid = pattern.test(value)
    return {
      isValid,
      message: isValid ? undefined : message,
    }
  },
}

// 组合验证器 - 同时运行多个验证
export const combineValidators = (
  value: any,
  validatorFns: Array<() => ValidationResult>
): ValidationResult => {
  for (const validatorFn of validatorFns) {
    const result = validatorFn()
    if (!result.isValid) {
      return result
    }
  }
  return { isValid: true }
}

// 异步验证器（用于需要服务器验证的情况）
export const asyncValidator = async (
  value: any,
  validatorFn: (value: any) => Promise<ValidationResult>
): Promise<ValidationResult> => {
  try {
    return await validatorFn(value)
  } catch (error) {
    return {
      isValid: false,
      message: '验证过程中出现错误',
    }
  }
}

// Ant Design 表单验证规则适配器
export const createAntdRule = (
  validatorFn: (value: any) => ValidationResult,
  required = false
) => {
  return {
    required,
    validator: (_: any, value: any) => {
      const result = validatorFn(value)
      if (result.isValid) {
        return Promise.resolve()
      } else {
        return Promise.reject(new Error(result.message))
      }
    },
  }
}

// 常用的Ant Design验证规则
export const antdRules = {
  required: { required: true, message: '此字段为必填项' },
  email: createAntdRule(validators.email, false),
  phone: createAntdRule(validators.phone, false),
  url: createAntdRule(validators.url, false),
  bitcoinAddress: createAntdRule(validators.bitcoinAddress, false),
  ethereumAddress: createAntdRule(validators.ethereumAddress, false),
  idCard: createAntdRule(validators.idCard, false),
  bankCard: createAntdRule(validators.bankCard, false),
  json: createAntdRule(validators.json, false),
  number: createAntdRule(validators.number, false),
  integer: createAntdRule(validators.integer, false),
  positive: createAntdRule(validators.positive, false),
  date: createAntdRule(validators.date, false),
}
