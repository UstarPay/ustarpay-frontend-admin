import { api } from './api'

export interface FundFlowRecord {
  id: string
  userId: string
  accountId?: string
  symbol: string
  changeType: string
  bizType: string
  direction: number
  amount: string
  balanceBefore: string
  balanceAfter: string
  frozenBefore: string
  frozenAfter: string
  referenceId: string
  referenceType: string
  businessId?: string
  orderNo?: string
  remark?: string
  status: number
  occurredAt: string
  createdAt: string
  updatedAt: string
}

export interface FundFlowStats {
  totalRecords: number
  incomeCount: number
  expenseCount: number
  reversedCount: number
  todayRecords: number
  incomeAmount: string
  expenseAmount: string
  netAmount: string
  latestOccurredAt: string
  distinctUsersCount: number
}

export interface FundFlowQuery {
  page?: number
  pageSize?: number
  search?: string
  symbol?: string
  changeType?: string
  bizType?: string
  direction?: string
  status?: string
  userId?: string
  referenceId?: string
  businessId?: string
  orderNo?: string
  startDate?: string
  endDate?: string
}

export const fundFlowService = {
  getFundFlows: async (params?: FundFlowQuery) => {
    return api.get<{
      items: FundFlowRecord[]
      pagination: { page: number; pageSize: number; total: number; totalPages: number }
    }>('/fund-flows', params)
  },

  getFundFlowStats: async (params?: Omit<FundFlowQuery, 'page' | 'pageSize'>) => {
    return api.get<FundFlowStats>('/fund-flows/stats', params)
  },
}
