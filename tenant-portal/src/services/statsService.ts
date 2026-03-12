import { api } from './api'

// 统计数据类型定义
export interface StatItem {
  id: string
  key: string
  name: string
  value: string | number
  type: 'number' | 'currency' | 'percentage' | 'count'
  category: string
  description?: string
  unit?: string
  trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    period: string
  }
  updatedAt: string
}

export interface DashboardStats {
  overview: {
    totalWallets: number
    totalBalance: string
    totalTransactions: number
    activeUsers: number
  }
  transactions: {
    todayTransactions: number
    todayVolume: string
    pendingTransactions: number
    failedTransactions: number
  }
  deposits: {
    todayDeposits: number
    todayDepositAmount: string
    pendingDeposits: number
    totalDeposits: number
  }
  withdrawals: {
    todayWithdrawals: number
    todayWithdrawalAmount: string
    pendingWithdrawals: number
    totalWithdrawals: number
  }
  revenue: {
    todayRevenue: string
    monthlyRevenue: string
    totalRevenue: string
    revenueGrowth: number
  }
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
    fill?: boolean
  }>
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

// 统计数据相关的 API 服务
export const statsService = {
  // 获取统计项列表
  getStats: async (params?: {
    category?: string
    search?: string
  }) => {
    return api.get<StatItem[]>('/stats', {
      config: { params }
    })
  },

  // 获取单个统计项
  getStat: async (id: string) => {
    return api.get<StatItem>(`/stats/${id}`)
  },

  // 更新统计项
  updateStat: async (id: string, data: {
    value: string | number
    description?: string
  }) => {
    return api.put<StatItem>(`/stats/${id}`, data)
  },

  // 删除统计项
  deleteStat: async (id: string) => {
    return api.delete<void>(`/stats/${id}`)
  },

  // 获取仪表盘统计数据
  getDashboardStats: async (params?: {
    period?: 'today' | 'week' | 'month' | 'year'
    timezone?: string
  }) => {
    return api.get<DashboardStats>('/stats/dashboard', {
      config: { params }
    })
  },

  // 获取交易趋势数据
  getTransactionTrend: async (params?: {
    period?: 'day' | 'week' | 'month'
    days?: number
    type?: 'deposit' | 'withdrawal' | 'transfer'
  }) => {
    return api.get<TimeSeriesData[]>('/stats/transaction-trend', {
      config: { params }
    })
  },

  // 获取余额分布数据
  getBalanceDistribution: async (params?: {
    currency?: string
    top?: number
  }) => {
    return api.get<Array<{
      currency: string
      balance: string
      percentage: number
      walletCount: number
    }>>('/stats/balance-distribution', {
      config: { params }
    })
  },

  // 获取用户活跃度数据
  getUserActivity: async (params?: {
    period?: 'day' | 'week' | 'month'
    days?: number
  }) => {
    return api.get<TimeSeriesData[]>('/stats/user-activity', {
      config: { params }
    })
  },

  // 获取收入统计
  getRevenueStats: async (params?: {
    period?: 'day' | 'week' | 'month' | 'year'
    start_date?: string
    end_date?: string
  }) => {
    return api.get<{
      totalRevenue: string
      periodRevenue: string
      growth: number
      breakdown: Array<{
        source: string
        amount: string
        percentage: number
      }>
      trend: TimeSeriesData[]
    }>('/stats/revenue', {
      config: { params }
    })
  },

  // 获取热门货币统计
  getTopCurrencies: async (params?: {
    metric?: 'volume' | 'transactions' | 'users'
    period?: 'day' | 'week' | 'month'
    limit?: number
  }) => {
    return api.get<Array<{
      currency: string
      symbol: string
      volume: string
      transactions: number
      users: number
      change: number
    }>>('/stats/top-currencies', {
      config: { params }
    })
  },

  // 获取地理分布数据
  getGeographicDistribution: async () => {
    return api.get<Array<{
      country: string
      countryCode: string
      users: number
      transactions: number
      volume: string
    }>>('/stats/geographic')
  },

  // 获取性能指标
  getPerformanceMetrics: async (params?: {
    period?: 'hour' | 'day' | 'week'
    hours?: number
  }) => {
    return api.get<{
      apiResponseTime: TimeSeriesData[]
      transactionProcessingTime: TimeSeriesData[]
      systemLoad: TimeSeriesData[]
      errorRate: TimeSeriesData[]
    }>('/stats/performance', {
      config: { params }
    })
  },

  // 导出统计报告
  exportStatsReport: async (params?: {
    type?: 'summary' | 'detailed' | 'custom'
    period?: 'day' | 'week' | 'month' | 'year'
    start_date?: string
    end_date?: string
    format?: 'pdf' | 'excel' | 'csv'
    sections?: string[]
  }) => {
    const filename = `stats-report-${Date.now()}.${params?.format || 'pdf'}`
    return api.download('/stats/export', filename, {
      config: { params }
    })
  },

  // 刷新统计数据
  refreshStats: async (category?: string) => {
    return api.post<{
      refreshed: string[]
      errors: string[]
    }>('/stats/refresh', { category })
  },
}