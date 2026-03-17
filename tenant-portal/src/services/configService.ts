import { api } from './api'

// 配置项类型
export interface ConfigItem {
  id: string
  key: string
  value: string
  description?: string
  category: string
  type: 'string' | 'number' | 'boolean' | 'json'
  isReadOnly: boolean
  isRequired: boolean
  createdAt: string
  updatedAt: string
}

// 租户配置类型
export interface TenantConfig {
  // 安全设置
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireLowercase: boolean
      requireNumbers: boolean
      requireSpecialChars: boolean
    }
  }
  
  // 通知设置
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    webhookEnabled: boolean
    pushEnabled: boolean
    notificationTypes: Record<string, boolean>
    quietHours: {
      enabled: boolean
      startTime: string
      endTime: string
    }
  }
  
  // API设置
  api: {
    rateLimit: number
    allowedIPs: string[]
    webhookUrl?: string
    webhookSecret?: string
  }
  
  // 钱包设置
  wallet: {
    defaultCurrency: string
    supportedCurrencies: string[]
    networkTypes: Array<{
      code: string
      name: string
      description: string
      isActive: boolean
    }>
    gasSettings: {
      defaultPriority: 'low' | 'medium' | 'high'
      maxGasPrice: string
      gasLimit: number
    }
  }
  
  // 交易设置
  transaction: {
    minAmount: string
    maxAmount: string
    dailyLimit: string
    requiredConfirmations: number
    autoApproval: boolean
    feeSettings: {
      withdrawalFee: string
      transferFee: string
      gasFee: string
    }
  }
  
  // 归集设置
  collection: {
    enabled: boolean
    minThreshold: string
    maxAmount: string
    schedule: string
    targetWallet: string
  }
  
  // 监控设置
  monitoring: {
    balanceAlerts: boolean
    transactionAlerts: boolean
    systemAlerts: boolean
    alertChannels: string[]
    checkInterval: number
  }
}

export interface UpdateConfigRequest {
  key: string
  value: string
}

// 配置管理相关的 API 服务
export const configService = {
  // 获取完整配置
  getConfig: async () => {
    return api.get<TenantConfig>('/config')
  },

  // 获取配置项列表
  getConfigItems: async (params?: {
    category?: string
    search?: string
  }) => {
    return api.get<ConfigItem[]>('/config/items', {
      config: { params }
    })
  },

  // 获取单个配置项
  getConfigItem: async (key: string) => {
    return api.get<ConfigItem>(`/config/items/${key}`)
  },

  // 更新完整配置
  updateConfig: async (config: Partial<TenantConfig>) => {
    return api.put<TenantConfig>('/config', config)
  },

  // 更新单个配置项
  updateConfigItem: async (id: string, data: UpdateConfigRequest) => {
    return api.put<ConfigItem>(`/config/${id}`, data)
  },

  // 删除配置项
  deleteConfigItem: async (id: string) => {
    return api.delete<void>(`/config/${id}`)
  },

  // 重置配置到默认值
  resetConfig: async (category?: string) => {
    return api.post<TenantConfig>('/config/reset', { category })
  },

  // 导出配置
  exportConfig: async (format: 'json' | 'yaml' = 'json') => {
    const filename = `tenant-config-${Date.now()}.${format}`
    return api.download('/config/export', filename, {
      config: { params: { format } }
    })
  },

  // 导入配置
  importConfig: async (file: File) => {
    return api.upload<{
      imported: number
      updated: number
      errors: string[]
    }>('/config/import', file)
  },

  // 验证配置
  validateConfig: async (config: Partial<TenantConfig>) => {
    return api.post<{
      valid: boolean
      errors: Array<{
        field: string
        message: string
      }>
    }>('/config/validate', config)
  },

  // 获取配置模板
  getConfigTemplate: async (category?: string) => {
    return api.get<ConfigItem[]>('/config/template', {
      config: { params: { category } }
    })
  },

  // 获取配置历史
  getConfigHistory: async (params?: {
    page?: number
    page_size?: number
    key?: string
    start_date?: string
    end_date?: string
  }) => {
    return api.get<{
      items: Array<{
        id: string
        key: string
        oldValue: string
        newValue: string
        changedBy: string
        changedAt: string
        reason?: string
      }>
      total: number
      page: number
      pageSize: number
    }>('/config/history', {
      config: { params }
    })
  }
}