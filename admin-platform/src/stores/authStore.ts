import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Permission } from '@shared/types'
import type { User } from '@shared/types/user'

function getPermissionCode(permission: any) {
  if (typeof permission === 'string') {
    return permission
  }

  return permission?.code || permission?.permission_code || permission?.permissionCode || ''
}

export interface AuthState {
  // 状态
  user: User | null
  token: string | null
  permissions: Permission[]
  isAuthenticated: boolean
  isLoading: boolean

  // 操作
  login: (token: string, user: User, permissions: Permission[]) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  updatePermissions: (permissions: Permission[]) => void
  setLoading: (loading: boolean) => void
  
  // 权限检查
  hasPermission: (permissionCode: string) => boolean
  hasAnyPermission: (permissionCodes: string[]) => boolean
  hasAllPermissions: (permissionCodes: string[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,

      // 登录
      login: (token, user, permissions) => {
        set({
          token,
          user,
          permissions,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      // 登出
      logout: () => {
        set({
          user: null,
          token: null,
          permissions: [],
          isAuthenticated: false,
          isLoading: false,
        })
      },

      // 更新用户信息
      updateUser: (userData) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...userData } })
        }
      },

      // 更新权限
      updatePermissions: (permissions) => {
        set({ permissions })
      },

      // 设置加载状态
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      // 检查单个权限
      hasPermission: (permissionCode) => {
        const { permissions } = get()
        return permissions.some((p) => {
          const code = getPermissionCode(p as any)
          return code === permissionCode || code === '*'
        })
      },

      // 检查是否有任一权限
      hasAnyPermission: (permissionCodes) => {
        const { permissions } = get()
        return permissionCodes.some(code => 
          permissions.some((p) => {
            const permissionCode = getPermissionCode(p as any)
            return permissionCode === code || permissionCode === '*'
          })
        )
      },

      // 检查是否有所有权限
      hasAllPermissions: (permissionCodes) => {
        const { permissions } = get()
        return permissionCodes.every(code => 
          permissions.some((p) => {
            const permissionCode = getPermissionCode(p as any)
            return permissionCode === code || permissionCode === '*'
          })
        )
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
