import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppState {
  // 界面状态
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
  locale: string
  
  // 全局加载状态
  globalLoading: boolean
  
  // 通知和消息
  notifications: Notification[]
  
  // 操作
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLocale: (locale: string) => void
  setGlobalLoading: (loading: boolean) => void
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export interface Notification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message?: string
  duration?: number
  createdAt: string
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      sidebarCollapsed: false,
      theme: 'light',
      locale: 'zh-CN',
      globalLoading: false,
      notifications: [],

      // 切换侧边栏
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      // 设置侧边栏状态
      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed })
      },

      // 设置主题
      setTheme: (theme) => {
        set({ theme })
        // 更新HTML元素的类名
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      // 设置语言
      setLocale: (locale) => {
        set({ locale })
      },

      // 设置全局加载状态
      setGlobalLoading: (loading) => {
        set({ globalLoading: loading })
      },

      // 添加通知
      addNotification: (notification) => {
        const id = Date.now().toString()
        const newNotification: Notification = {
          id,
          createdAt: new Date().toISOString(),
          duration: 4500,
          ...notification,
        }
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }))

        // 自动移除通知
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, newNotification.duration)
        }
      },

      // 移除通知
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }))
      },

      // 清空所有通知
      clearNotifications: () => {
        set({ notifications: [] })
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        locale: state.locale,
      }),
    }
  )
)
