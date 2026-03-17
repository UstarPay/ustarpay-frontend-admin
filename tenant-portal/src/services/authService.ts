import { api } from './api'
import { useAuthStore } from '@/stores/authStore'
import type {
  LoginForm,
  PasswordChangeForm,
  PasswordResetForm,
  Tenant,
  TwoFactorSetupResponse,
  TwoFactorVerifyForm,
  User,
} from '@shared/types'

interface AuthUser extends User {
  displayName?: string
  permissions?: string[]
  refreshToken?: string
  refresh_token?: string
  roles?: string[]
  username?: string
}

interface AuthStatePayload {
  displayName?: string
  email?: string
  permissions?: string[]
  refreshToken?: string
  refresh_token?: string
  roles?: string[]
  token?: string
  user?: AuthUser
  username?: string
  tenantId?: string
}

type AuthProfilePayload = AuthStatePayload | AuthUser
type TenantLoginForm = LoginForm & { email?: string }

const authRequestConfig = { prefix: api.authPrefix }

export class AuthService {
  private getUserFromPayload(payload: AuthProfilePayload | null | undefined): AuthUser | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined
    }

    if ('user' in payload && payload.user) {
      return payload.user
    }

    if ('id' in payload) {
      return payload as AuthUser
    }

    return undefined
  }

  private syncAuthState(payload: AuthProfilePayload | null | undefined) {
    if (!payload) {
      return
    }

    const { setPermissions, setRoles, setTenant, setTokens, setUser } = useAuthStore.getState()
    const user = this.getUserFromPayload(payload)
    const token = 'token' in payload ? payload.token : undefined
    const refreshToken =
      ('refresh_token' in payload ? payload.refresh_token : undefined) ||
      ('refreshToken' in payload ? payload.refreshToken : undefined)
    const permissions =
      ('permissions' in payload ? payload.permissions : undefined) || user?.permissions || []
    const roles = ('roles' in payload ? payload.roles : undefined) || user?.roles || []

    if (user) {
      setUser(user)

      if (user.tenantId) {
        setTenant(
          user.tenantId,
          user.name || user.displayName || user.fullName || user.username || user.userName || user.email
        )
      }
    } else if ('tenantId' in payload && payload.tenantId) {
      setTenant(
        payload.tenantId,
        payload.displayName || payload.username || payload.email || payload.tenantId
      )
    }

    if (token) {
      setTokens(token, refreshToken)
    }

    setPermissions(permissions)
    setRoles(roles)
  }

  async login(credentials: TenantLoginForm) {
    const response = await api.post<AuthStatePayload>(
      '/login',
      {
        ...credentials,
        userType: 'tenant',
      },
      authRequestConfig
    )

    if (response.success && response.data) {
      this.syncAuthState(response.data)
    }

    return response
  }

  async logout() {
    try {
      await api.post('/auth/logout', undefined, authRequestConfig)
    } catch (error) {
      console.warn('Server logout failed:', error)
    } finally {
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  async refreshToken() {
    const { refreshToken } = useAuthStore.getState()

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await api.post<AuthStatePayload>(
        '/refresh',
        { refresh_token: refreshToken },
        authRequestConfig
      )

      if (response.success && response.data) {
        this.syncAuthState(response.data)
      }

      return response
    } catch (error) {
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
      throw error
    }
  }

  async getCurrentUser() {
    const response = await api.get<AuthProfilePayload>('/auth/profile', undefined, authRequestConfig)

    if (response.success && response.data) {
      this.syncAuthState(response.data)
    }

    return response
  }

  async getUserPermissions() {
    const response = await api.get<AuthProfilePayload>('/auth/profile', undefined, authRequestConfig)

    if (response.success && response.data) {
      this.syncAuthState(response.data)
    }

    return response
  }

  async sendPasswordResetEmail(email: string) {
    return api.post('/auth/password/reset-request', { email }, authRequestConfig)
  }

  async resetPassword(data: PasswordResetForm) {
    return api.post('/auth/password/reset', data, authRequestConfig)
  }

  async changePassword(data: PasswordChangeForm) {
    return api.post('/auth/password/change', data, authRequestConfig)
  }

  async setupTwoFactor() {
    return api.post<TwoFactorSetupResponse>('/auth/2fa/setup', undefined, authRequestConfig)
  }

  async verifyTwoFactor(data: TwoFactorVerifyForm) {
    return api.post('/auth/2fa/verify', data, authRequestConfig)
  }

  async disableTwoFactor(password: string) {
    return api.post('/auth/2fa/disable', { password }, authRequestConfig)
  }

  async getBackupCodes() {
    return api.get<{ codes: string[] }>('/auth/2fa/backup-codes', undefined, authRequestConfig)
  }

  async generateBackupCodes() {
    return api.post<{ codes: string[] }>(
      '/auth/2fa/backup-codes/regenerate',
      undefined,
      authRequestConfig
    )
  }

  async verifySession() {
    try {
      const response = await api.get('/auth/profile', undefined, authRequestConfig)
      return response.success
    } catch {
      return false
    }
  }

  async getLoginHistory(params?: {
    page?: number
    pageSize?: number
    startDate?: string
    endDate?: string
  }) {
    return api.getPaginated('/auth/login-history', params, authRequestConfig)
  }

  async getActiveSessions() {
    return api.get('/auth/sessions', undefined, authRequestConfig)
  }

  async terminateSession(sessionId: string) {
    return api.delete(`/auth/sessions/${sessionId}`, authRequestConfig)
  }

  async terminateOtherSessions() {
    return api.post('/auth/sessions/terminate-others', undefined, authRequestConfig)
  }

  async updateProfile(data: Partial<Tenant>) {
    const response = await api.put<Tenant>('/auth/profile', data, authRequestConfig)

    if (response.success && response.data) {
      const { setTenant } = useAuthStore.getState()
      setTenant(response.data.id, response.data.name)
    }

    return response
  }

  async updatePreferences(preferences: Record<string, any>) {
    return api.put('/auth/preferences', preferences, authRequestConfig)
  }

  async checkEmailAvailability(email: string) {
    return api.post('/auth/check-email', { email }, authRequestConfig)
  }

  async checkUsernameAvailability(username: string) {
    return api.post('/auth/check-username', { username }, authRequestConfig)
  }

  async sendEmailVerification() {
    return api.post('/auth/email/send-verification', undefined, authRequestConfig)
  }

  async verifyEmail(code: string) {
    return api.post('/auth/email/verify', { code }, authRequestConfig)
  }

  async getSecuritySettings() {
    return api.get('/auth/security/settings', undefined, authRequestConfig)
  }

  async getLoginSessions() {
    return api.get('/auth/sessions', undefined, authRequestConfig)
  }

  async getSecurityLogs(params?: {
    page?: number
    pageSize?: number
    type?: string
    startDate?: string
    endDate?: string
  }) {
    return api.getPaginated('/auth/security/logs', params, authRequestConfig)
  }

  async enable2FA() {
    return api.post('/auth/2fa/enable', undefined, authRequestConfig)
  }

  async disable2FA() {
    return api.post('/auth/2fa/disable', undefined, authRequestConfig)
  }

  async verify2FASetup(code: string, secret: string) {
    return api.post('/auth/2fa/verify-setup', { code, secret }, authRequestConfig)
  }
}

export const authService = new AuthService()

export default authService
