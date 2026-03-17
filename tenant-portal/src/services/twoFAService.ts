import { api } from './api'
import type { TwoFactorAuth } from '@shared/types'

// 2FA相关的 API 服务
export const twoFAService = {
  // 获取2FA状态
  get2FAStatus: async () => {
    return api.get<TwoFactorAuth>('/2fa')
  },

  // 创建2FA
  create2FA: async (data: {
    enabled: boolean
    secondaryPassword?: string  // 改为二级密码
    secret?: string
    backupCodes?: string[]
    issuer?: string
    accountName?: string
  }) => {
    return api.post<TwoFactorAuth>('/2fa', data)
  },

  // 更新2FA
  update2FA: async (data: {
    enabled?: boolean
    secret?: string
    backupCodes?: string[]
    issuer?: string
    accountName?: string
  }) => {
    return api.put<TwoFactorAuth>('/2fa', data)
  },

  // 删除2FA
  delete2FA: async (data: {
    secondaryPassword: string
    code: string
  }) => {
    return api.put<void>('/2fa/disable', data)
  },

  // 验证2FA TOTP
  verifyTOTP: async (data: {
    code: string
   }) => {
    return api.post<{ success: boolean, message: string }>('/2fa/verify', data)
  }
} 