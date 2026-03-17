import { QueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/appStore'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据保持新鲜的时间
      staleTime: 5 * 60 * 1000, // 5分钟
      // 在窗口重新获得焦点时不自动重新获取
      refetchOnWindowFocus: false,
      // 在重新连接时重新获取
      refetchOnReconnect: true,
      // 重试次数
      retry: (failureCount, error: any) => {
        // 认证错误不重试
        if (error?.response?.status === 401) {
          return false
        }
        // 客户端错误不重试
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // 最多重试3次
        return failureCount < 3
      },
      // 重试延迟
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // 突变失败时的重试
      retry: (failureCount, error: any) => {
        // 认证和权限错误不重试
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false
        }
        return failureCount < 1
      },
      // 突变成功时的全局处理
      onSuccess: (data: any) => {
        // 如果响应包含成功消息，显示通知
        if (data?.message) {
          useAppStore.getState().addNotification({
            type: 'success',
            title: '操作成功',
            message: data.message,
          })
        }
      },
      // 突变失败时的全局处理
      onError: (error: any) => {
        // 显示错误通知
        useAppStore.getState().addNotification({
          type: 'error',
          title: '操作失败',
          message: error?.response?.data?.message || error?.message || '操作失败，请重试',
        })
      },
    },
  },
})
