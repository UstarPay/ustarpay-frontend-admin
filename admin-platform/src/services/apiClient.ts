import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import type { ApiResponse } from '@shared/types'
import { Modal } from 'antd'

class ApiClient {
  private client: AxiosInstance
  private requestInterceptorId: number | null = null
  private responseInterceptorId: number | null = null
  public authPrefix: string | undefined = undefined
  public adminPrefix: string | undefined = undefined

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    this.authPrefix = import.meta.env.VITE_AUTH_PREFIX || '/auth/v1'
    this.adminPrefix = import.meta.env.VITE_ADMIN_PREFIX || '/admin/v1'

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器
    this.requestInterceptorId = this.client.interceptors.request.use(
      (config) => {
        // 添加认证Token
        const { token } = useAuthStore.getState()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求ID用于追踪
        config.headers['X-Request-ID'] =
          `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // 显示全局加载状态
        useAppStore.getState().setGlobalLoading(true)

        return config
      },
      (error) => {
        useAppStore.getState().setGlobalLoading(false)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.responseInterceptorId = this.client.interceptors.response.use(
      (response) => {
        useAppStore.getState().setGlobalLoading(false)
        return response
      },
      (error) => {
        useAppStore.getState().setGlobalLoading(false)

        // 处理认证错误 - 统一的401处理逻辑
        if (error.response?.status === 401) {
          console.log('401 Unauthorized - 用户认证失败')
          
          const errorMessage =
            error.response?.data?.error ||
            error.response?.data?.message ||
            '登录已过期，请重新登录'

          // 清除认证状态
          useAuthStore.getState().logout()

          // 显示登录过期确认框
          Modal.confirm({
            title: '提示',
            content: errorMessage,
            okText: '重新登录',
            cancelText: '稍后',
            onOk: () => {
              window.location.href = '/login'
            },
            onCancel: () => {
              // 用户选择稍后，但仍然需要清除状态
              console.log('用户选择稍后登录')
            }
          })

          // 如果用户没有操作，5秒后自动跳转
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
          }, 5000)

          return Promise.reject(error)
        }

        // 处理权限错误
        if (error.response?.status === 403) {
          useAppStore.getState().addNotification({
            type: 'error',
            title: '权限不足',
            message: '您没有权限进行此操作',
          })
        }

        // 处理服务器错误
        if (error.response?.status >= 500) {
          useAppStore.getState().addNotification({
            type: 'error',
            title: '服务器错误',
            message:
              error.response?.data?.message || '服务器内部错误，请稍后重试',
          })
        }

        // 处理网络错误
        if (!error.response) {
          useAppStore.getState().addNotification({
            type: 'error',
            title: '网络错误',
            message: '请检查网络连接',
          })
        }

        return Promise.reject(error)
      }
    )
  }

  // 清理拦截器
  public destroy() {
    if (this.requestInterceptorId !== null) {
      this.client.interceptors.request.eject(this.requestInterceptorId)
    }
    if (this.responseInterceptorId !== null) {
      this.client.interceptors.response.eject(this.responseInterceptorId)
    }
  }

  // GET 请求
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
    prefix?: string
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(
      `${prefix || this.adminPrefix}${url}`,
      config
    )
    return response.data
  }

  // POST 请求
  async post<T = any>(
    url: string,
    data?: any,
    confg?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(
      `${confg?.prefix || this.adminPrefix}${url}`,
      data,
      confg?.config
    )
    return response.data
  }

  // PUT 请求
  async put<T = any>(
    url: string,
    data?: any,
    confg?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(
      `${confg?.prefix || this.adminPrefix}${url}`,
      data,
      confg?.config
    )
    return response.data
  }

  // PATCH 请求
  async patch<T = any>(
    url: string,
    data?: any,
    confg?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(
      `${confg?.prefix || this.adminPrefix}${url}`,
      data,
      confg?.config
    )
    return response.data
  }

  // DELETE 请求
  async delete<T = any>(
    url: string,
    confg?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(
      `${confg?.prefix || this.adminPrefix}${url}`,
      confg?.config
    )
    return response.data
  }

  // 上传文件
  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    confg?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(
      `${confg?.prefix || this.adminPrefix}${url}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(progress)
          }
        },
      }
    )

    return response.data
  }

  // 下载文件
  async download(
    url: string,
    filename?: string,
    confg?: { prefix?: string }
  ): Promise<void> {
    const response = await this.client.get(
      `${confg?.prefix || this.adminPrefix}${url}`,
      {
        responseType: 'blob',
      }
    )

    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }

  // 获取原始 axios 实例（用于特殊需求）
  getAxiosInstance(): AxiosInstance {
    return this.client
  }
}

// 创建全局实例
export const apiClient = new ApiClient()

// 导出类型
export type { AxiosRequestConfig, AxiosResponse }
