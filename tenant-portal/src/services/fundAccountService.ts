import type { FundAccount, FundAccountQueryParams, FundAccountStats } from '@shared/types'
import { api } from './api'

export const fundAccountService = {
  getFundAccounts: async (params?: FundAccountQueryParams) => {
    return api.getPaginated<FundAccount>('/wallets/fund-accounts', params)
  },

  getFundAccountStats: async () => {
    return api.get<FundAccountStats>('/wallets/fund-accounts/stats')
  }
}
