import { DashboardStats, LoginForm, LoginResponse, UserList } from "@shared/types"
import { apiClient } from "../apiClient"

/**
 * 管理员API
 */
export const adminApi = {
  /**
   * 获取用户列表
   */
  getUsers: async (): Promise<UserList> => {
    try {
      const response = await apiClient.get<UserList>(`/users`)
      return response.data
    } catch (error) {
      console.error('API调用失败:', error)
      return {
        items: [],
        page: 1,
        pageSize: 10,
        total: 0
      }
    }
  },

  /**
   * 获取仪表盘统计数据
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats')
    return response.data
  },

  /**
  * 登录
  */
  login: async (data: LoginForm): Promise<LoginResponse> => {
    const response = await apiClient.post('/login', data, { prefix: apiClient.authPrefix })
    return response.data
  },

}

