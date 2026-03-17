import { api } from './api'
import { useAuthStore } from '@/stores/authStore'
import type { 
  Tenant, 
  LoginForm, 
  RegisterForm, 
  PasswordResetForm,
  PasswordChangeForm,
  TwoFactorSetupResponse,
  TwoFactorVerifyForm 
} from '@shared/types'

// 认证相关的 API 服务
export class AuthService {
  // 用户登录
  async login(credentials: LoginForm) {
    credentials.userType = 'tenant'
    const response = await api.post('/login', credentials, { prefix: api.authPrefix })
    
    if (response.success && response.data) {
      // 存储用户信息和 token
      const { setUser, setTokens, setPermissions, setRoles, setTenant } = useAuthStore.getState()
      
      setUser(response.data)
      setTokens(response.data.token, response.data.refreshToken)
      
      // 存储租户信息
      if (response.data.tenantId) {
        setTenant(response.data.tenantId, response.data.displayName || response.data.username)
      }
      
      setPermissions(response.data.permissions || [])
      setRoles(response.data.roles || [])
    }
    
    return response
  }

  // // 用户注册（如果支持）
  // async register(userData: RegisterForm) {
  //   const response = await api.post('/auth/register', userData)
  //   return response
  // }

  // 用户登出
  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // 即使服务器端登出失败，也要清除本地状态
      console.warn('Server logout failed:', error)
    } finally {
      // 清除本地认证状态
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
    }
  }

  // 刷新令牌
  async refreshToken() {
    const { refreshToken } = useAuthStore.getState()
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await api.post('/auth/refresh', { refreshToken })
      
      if (response.success && response.data) {
        const { token, refreshToken: newRefreshToken } = response.data
        const { setTokens } = useAuthStore.getState()
        setTokens(token, newRefreshToken)
      }
      
      return response
    } catch (error) {
      // 刷新失败，清除认证状态
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
      throw error
    }
  }

  // 获取当前用户信息
  async getCurrentUser() {
    const response = await api.get<Tenant>('/me')
    
    if (response.success && response.data) {
      const { setTenant } = useAuthStore.getState()
      
      if (response.data.id) {
        setTenant(response.data.id, response.data.name)
      }
    }
    
    return response
  }

  // 获取用户权限
  async getUserPermissions() {
    const response = await api.get<{ permissions: string[], roles: string[] }>('/auth/permissions')
    
    if (response.success && response.data) {
      const { setPermissions, setRoles } = useAuthStore.getState()
      setPermissions(response.data.permissions || [])
      setRoles(response.data.roles || [])
    }
    
    return response
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(email: string) {
    const response = await api.post('/auth/password/reset-request', { email })
    return response
  }

  // 重置密码
  async resetPassword(data: PasswordResetForm) {
    const response = await api.post('/auth/password/reset', data)
    return response
  }

  // 修改密码
  async changePassword(data: PasswordChangeForm) {
    const response = await api.post('/auth/password/change', data)
    return response
  }

  // 启用两步验证
  async setupTwoFactor() {
    const response = await api.post<TwoFactorSetupResponse>('/auth/2fa/setup')
    return response
  }

  // 验证两步验证
  async verifyTwoFactor(data: TwoFactorVerifyForm) {
    const response = await api.post('/auth/2fa/verify', data)
    return response
  }

  // 禁用两步验证
  async disableTwoFactor(password: string) {
    const response = await api.post('/auth/2fa/disable', { password })
    return response
  }

  // 获取备用代码
  async getBackupCodes() {
    const response = await api.get<{ codes: string[] }>('/auth/2fa/backup-codes')
    return response
  }

  // 生成新的备用代码
  async generateBackupCodes() {
    const response = await api.post<{ codes: string[] }>('/auth/2fa/backup-codes/regenerate')
    return response
  }

  // 验证会话
  async verifySession() {
    try {
      const response = await api.get('/auth/verify')
      return response.success
    } catch {
      return false
    }
  }

  // 获取登录历史
  async getLoginHistory(params?: {
    page?: number
    pageSize?: number
    startDate?: string
    endDate?: string
  }) {
    const response = await api.getPaginated('/auth/login-history', params)
    return response
  }

  // 获取活动会话
  async getActiveSessions() {
    const response = await api.get('/auth/sessions')
    return response
  }

  // 终止指定会话
  async terminateSession(sessionId: string) {
    const response = await api.delete(`/auth/sessions/${sessionId}`)
    return response
  }

  // 终止所有其他会话
  async terminateOtherSessions() {
    const response = await api.post('/auth/sessions/terminate-others')
    return response
  }

  // 更新用户资料
  async updateProfile(data: Partial<Tenant>) {
    const response = await api.put<Tenant>('/auth/profile', data)
    
    if (response.success && response.data) {
      const { setTenant } = useAuthStore.getState()
      setTenant(response.data.id, response.data.name)
    }
    
    return response
  }

  // 更新用户偏好设置
  async updatePreferences(preferences: Record<string, any>) {
    const response = await api.put('/auth/preferences', preferences)
    return response
  }

  // 检查邮箱是否可用
  async checkEmailAvailability(email: string) {
    const response = await api.post('/auth/check-email', { email })
    return response
  }

  // 检查用户名是否可用
  async checkUsernameAvailability(username: string) {
    const response = await api.post('/auth/check-username', { username })
    return response
  }

  // 发送邮箱验证码
  async sendEmailVerification() {
    const response = await api.post('/auth/email/send-verification')
    return response
  }

  // 验证邮箱
  async verifyEmail(code: string) {
    const response = await api.post('/auth/email/verify', { code })
    return response
  }

  // 获取安全设置
  async getSecuritySettings() {
    const response = await api.get('/auth/security/settings')
    return response
  }

  // 获取登录会话
  async getLoginSessions() {
    const response = await api.get('/auth/sessions')
    return response
  }

  // 获取安全日志
  async getSecurityLogs(params?: {
    page?: number
    pageSize?: number
    type?: string
    startDate?: string
    endDate?: string
  }) {
    const response = await api.getPaginated('/auth/security/logs', params)
    return response
  }

  // 启用两步验证
  async enable2FA() {
    const response = await api.post('/auth/2fa/enable')
    return response
  }

  // 禁用两步验证
  async disable2FA() {
    const response = await api.post('/auth/2fa/disable')
    return response
  }

  // 验证两步验证设置
  async verify2FASetup(code: string, secret: string) {
    const response = await api.post('/auth/2fa/verify-setup', { code, secret })
    return response
  }
}

// 创建认证服务实例
export const authService = new AuthService()

// 导出默认实例
export default authService
