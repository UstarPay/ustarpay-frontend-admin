import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// 主题类型
export type Theme = 'light' | 'dark' | 'auto'

// 语言类型
export type Language = 'zh-CN' | 'en-US'

// 侧边栏状态
export interface SidebarState {
  collapsed: boolean
  mobile: boolean
}

// 通知设置
export interface NotificationSettings {
  desktop: boolean
  email: boolean
  sms: boolean
  transactionAlerts: boolean
  securityAlerts: boolean
  systemAlerts: boolean
}

// 应用状态接口
export interface AppState {
  // 主题和界面
  theme: Theme
  language: Language
  sidebar: SidebarState
  
  // 通知设置
  notifications: NotificationSettings
  
  // 用户偏好
  preferences: {
    currency: string
    dateFormat: string
    timeFormat: '12h' | '24h'
    timezone: string
    tablePageSize: number
  }
  
  // 系统状态
  isOnline: boolean
  lastActivity: number
  
  // 动作
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarMobile: (mobile: boolean) => void
  setNotifications: (notifications: Partial<NotificationSettings>) => void
  setPreferences: (preferences: Partial<AppState['preferences']>) => void
  setOnlineStatus: (isOnline: boolean) => void
  updateActivity: () => void
  
  // 主题切换
  toggleTheme: () => void
  toggleSidebar: () => void
}

// 默认通知设置
const defaultNotifications: NotificationSettings = {
  desktop: true,
  email: true,
  sms: false,
  transactionAlerts: true,
  securityAlerts: true,
  systemAlerts: true,
}

// 默认用户偏好
const defaultPreferences: AppState['preferences'] = {
  currency: 'USD',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  timezone: 'Asia/Shanghai',
  tablePageSize: 20,
}

// 创建应用状态管理
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      theme: 'light',
      language: 'zh-CN',
      sidebar: {
        collapsed: false,
        mobile: false,
      },
      notifications: defaultNotifications,
      preferences: defaultPreferences,
      isOnline: navigator.onLine,
      lastActivity: Date.now(),

      // 设置主题
      setTheme: (theme: Theme) => {
        set({ theme })
        
        // 应用到 HTML 元素
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          // auto 主题根据系统偏好设置
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          if (mediaQuery.matches) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },

      // 设置语言
      setLanguage: (language: Language) => {
        set({ language })
        document.documentElement.lang = language
      },

      // 设置侧边栏折叠状态
      setSidebarCollapsed: (collapsed: boolean) => {
        set(state => ({
          sidebar: { ...state.sidebar, collapsed }
        }))
      },

      // 设置移动端侧边栏状态
      setSidebarMobile: (mobile: boolean) => {
        set(state => ({
          sidebar: { ...state.sidebar, mobile }
        }))
      },

      // 设置通知设置
      setNotifications: (notifications: Partial<NotificationSettings>) => {
        set(state => ({
          notifications: { ...state.notifications, ...notifications }
        }))
      },

      // 设置用户偏好
      setPreferences: (preferences: Partial<AppState['preferences']>) => {
        set(state => ({
          preferences: { ...state.preferences, ...preferences }
        }))
      },

      // 设置在线状态
      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline })
      },

      // 更新活动时间
      updateActivity: () => {
        set({ lastActivity: Date.now() })
      },

      // 切换主题
      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },

      // 切换侧边栏
      toggleSidebar: () => {
        const { sidebar } = get()
        get().setSidebarCollapsed(!sidebar.collapsed)
      },
    }),
    {
      name: 'tenant-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebar: state.sidebar,
        notifications: state.notifications,
        preferences: state.preferences,
      }),
    }
  )
)

// 选择器函数
export const selectTheme = (state: AppState) => state.theme
export const selectLanguage = (state: AppState) => state.language
export const selectSidebar = (state: AppState) => state.sidebar
export const selectNotifications = (state: AppState) => state.notifications
export const selectPreferences = (state: AppState) => state.preferences
export const selectIsOnline = (state: AppState) => state.isOnline

// 初始化应用设置
export const initializeApp = () => {
  const { theme, setOnlineStatus, updateActivity } = useAppStore.getState()
  
  // 初始化主题
  useAppStore.getState().setTheme(theme)
  
  // 监听在线状态
  const handleOnline = () => setOnlineStatus(true)
  const handleOffline = () => setOnlineStatus(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 监听用户活动
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
  const handleActivity = () => updateActivity()
  
  activityEvents.forEach(event => {
    document.addEventListener(event, handleActivity, true)
  })
  
  // 监听系统主题变化（auto 模式下）
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleThemeChange = () => {
    const { theme } = useAppStore.getState()
    if (theme === 'auto') {
      useAppStore.getState().setTheme('auto')
    }
  }
  
  mediaQuery.addEventListener('change', handleThemeChange)
  
  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    mediaQuery.removeEventListener('change', handleThemeChange)
    
    activityEvents.forEach(event => {
      document.removeEventListener(event, handleActivity, true)
    })
  }
}
