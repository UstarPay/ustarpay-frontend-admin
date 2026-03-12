import { api } from './api'
import type { TenantUpdateRequest } from '@shared/types'

// 租户信息类型 - 匹配 TenantFullDetail
export interface TenantInfo {
  id: string
  name: string
  email: string
  status: number
  apiKey: string
  apiSecret: string
  allowedIps: string[]
  webhookUrl: string
  webhookSecret: string
  hasPassword: boolean
  hasSecondaryPassword: boolean
  has2FA: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  lastLoginIP?: string
  
  // 订阅信息
  subscriptionId: string
  subscriptionStart?: string
  subscriptionEnd?: string
  subscriptionStatus?: number
  computedStatus?: string
  daysRemaining?: number
  paymentTxHash?: string
  
  // 套餐信息
  planId?: string
  planName?: string
  planType?: string
  durationMonths?: number
  walletLimit?: number
  currencyLimit?: number
  priceUsdt?: number
  rateLimitPerMinute?: number
  
  overallStatus: string
  createdBy: string
  updatedBy: string
  loginCount: number
}

// 租户相关的 API 服务
export const tenantService = {
  // 获取租户信息
  getTenantInfo: async () => {
    return api.get<TenantInfo>('/tenant')
  },

  // 更新租户信息
  updateTenantInfo: async (data: Partial<TenantInfo>) => {
    return api.put<TenantInfo>('/tenant', data)
  },

  // 更新租户密码
  updatePassword: async (data: {
    id: string
    password: string
    oldPassword?: string
  }) => {
    const requestData: Partial<TenantUpdateRequest> = {
      id: data.id,
      password: data.password,
      oldPassword: data.oldPassword
    }
    return api.put<void>('/tenant/password', requestData)
  },

  // 更新租户二级密码
  updateSecondaryPassword: async (data: {
    id: string
    secondaryPassword: string
    oldSecondaryPassword?: string
  }) => {
    const requestData: Partial<TenantUpdateRequest> = {
      id: data.id,
      secondaryPassword: data.secondaryPassword,
      oldSecondaryPassword: data.oldSecondaryPassword
    }
    return api.put<void>('/tenant/secondary-password', requestData)
  },

  // 获取租户配置
  getTenantConfig: async () => {
    return api.get<{
      ipWhitelist: string[]
      webhookUrl?: string
      notificationEmail?: string
      securitySettings: {
        twoFactorEnabled: boolean
        sessionTimeout: number
        maxLoginAttempts: number
      }
    }>('/tenant/config')
  },

  // 更新租户配置
  updateTenantConfig: async (config: {
    ipWhitelist?: string[]
    webhookUrl?: string
    notificationEmail?: string
    securitySettings?: {
      twoFactorEnabled?: boolean
      sessionTimeout?: number
      maxLoginAttempts?: number
    }
  }) => {
    return api.put<void>('/tenant/config', config)
  },

  // 获取订阅信息
  getSubscription: async () => {
    return api.get<{
      plan: {
        name: string
        level: string
        features: string[]
        limits: {
          wallets: number
          transactions: number
          apiCalls: number
        }
      }
      subscription: {
        startDate: string
        endDate: string
        autoRenew: boolean
        status: 'active' | 'expired' | 'cancelled'
      }
      billing: {
        amount: number
        currency: string
        nextBillingDate: string
        paymentMethod?: string
      }
    }>('/tenant/subscription')
  },

  // 更新订阅
  updateSubscription: async (planId: string) => {
    return api.post<void>('/tenant/subscription', { planId })
  },

  // 取消订阅
  cancelSubscription: async () => {
    return api.post<void>('/tenant/subscription/cancel')
  },

  // 获取KYC信息
  getKycInfo: async () => {
    return api.get<{
      status: 'pending' | 'approved' | 'rejected'
      submittedAt?: string
      approvedAt?: string
      documents: Array<{
        id: string
        type: string
        filename: string
        status: 'pending' | 'approved' | 'rejected'
        uploadedAt: string
      }>
    }>('/tenant/kyc')
  },

  // 提交KYC
  submitKyc: async (data: {
    documents: Array<{
      type: string
      file: File
    }>
    personalInfo: {
      fullName: string
      dateOfBirth: string
      nationality: string
      address: string
    }
  }) => {
    const formData = new FormData()
    formData.append('personalInfo', JSON.stringify(data.personalInfo))
    
    data.documents.forEach((doc, index) => {
      formData.append(`documents[${index}].type`, doc.type)
      formData.append(`documents[${index}].file`, doc.file)
    })

    return api.post<void>('/tenant/kyc', formData, {
      config: {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    })
  }
} 