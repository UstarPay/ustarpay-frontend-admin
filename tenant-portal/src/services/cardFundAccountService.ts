import type { CardFundAccount, CardFundAccountQueryParams, CardFundAccountStats } from '@shared/types'
import { api } from './api'

export const cardFundAccountService = {
  getCardFundAccounts: async (params?: CardFundAccountQueryParams) => {
    return api.getPaginated<CardFundAccount>('/wallets/card-fund-accounts', params)
  },

  getCardFundAccountStats: async () => {
    return api.get<CardFundAccountStats>('/wallets/card-fund-accounts/stats')
  }
}
