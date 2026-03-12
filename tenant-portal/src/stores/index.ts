// 导出所有状态管理
export * from './authStore'
export * from './appStore'

// 导出组合使用的 hooks
export { useAuthStore, usePermissions } from './authStore'
export { useAppStore, initializeApp } from './appStore'
