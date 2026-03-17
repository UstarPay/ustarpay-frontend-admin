import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@shared/types'

// 认证状态接口
export interface AuthState {
  // 状态
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // 权限相关
  permissions: string[]
  roles: string[]
  
  // 租户信息
  tenantId: string | null
  tenantName: string | null
  
  // 动作
  setUser: (user: User) => void
  setTokens: (token: string, refreshToken?: string) => void
  setPermissions: (permissions: string[]) => void
  setRoles: (roles: string[]) => void
  setTenant: (tenantId: string, tenantName: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  
  // 权限检查方法
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
}

// 创建认证状态管理
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],
      roles: [],
      tenantId: null,
      tenantName: null,

      // 设置用户信息
      setUser: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true,
          tenantId: user.tenantId || null
        })
      },

      // 设置令牌
      setTokens: (token: string, refreshToken?: string) => {
        set({ 
          token, 
          refreshToken: refreshToken || get().refreshToken,
          isAuthenticated: true 
        })
      },

      // 设置权限
      setPermissions: (permissions: string[]) => {
        set({ permissions })
      },

      // 设置角色
      setRoles: (roles: string[]) => {
        set({ roles })
      },

      // 设置租户信息
      setTenant: (tenantId: string, tenantName: string) => {
        set({ tenantId, tenantName })
      },

      // 清除认证信息
      clearAuth: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          permissions: [],
          roles: [],
          tenantId: null,
          tenantName: null,
          isLoading: false,
        })
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // 检查是否有特定权限
      hasPermission: (permission: string) => {
        const { permissions } = get()
        return permissions.includes(permission)
      },

      // 检查是否有任一权限
      hasAnyPermission: (permissions: string[]) => {
        const { permissions: userPermissions } = get()
        return permissions.some(permission => userPermissions.includes(permission))
      },

      // 检查是否有特定角色
      hasRole: (role: string) => {
        const { roles } = get()
        return roles.includes(role)
      },

      // 检查是否有任一角色
      hasAnyRole: (roles: string[]) => {
        const { roles: userRoles } = get()
        return roles.some(role => userRoles.includes(role))
      },
    }),
    {
      name: 'tenant-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        roles: state.roles,
        tenantId: state.tenantId,
        tenantName: state.tenantName,
      }),
    }
  )
)

// 选择器函数
export const selectUser = (state: AuthState) => state.user
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated
export const selectToken = (state: AuthState) => state.token
export const selectPermissions = (state: AuthState) => state.permissions
export const selectRoles = (state: AuthState) => state.roles
export const selectTenantInfo = (state: AuthState) => ({
  tenantId: state.tenantId,
  tenantName: state.tenantName,
})

// 权限检查 Hook
export const usePermissions = () => {
  const hasPermission = useAuthStore(state => state.hasPermission)
  const hasAnyPermission = useAuthStore(state => state.hasAnyPermission)
  const hasRole = useAuthStore(state => state.hasRole)
  const hasAnyRole = useAuthStore(state => state.hasAnyRole)
  const permissions = useAuthStore(selectPermissions)
  const roles = useAuthStore(selectRoles)

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    permissions,
    roles,
  }
}
