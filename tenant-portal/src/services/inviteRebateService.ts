import type {
  InviteRebateConfig,
  InviteRebateEvent,
  InviteRebateEventQueryParams,
  InviteRebateProfile,
  InviteRebateProfileQueryParams,
  InviteRebateSettlement,
  InviteRebateSettlementQueryParams,
  InviteRebateSettlementRunResult,
  RunInviteRebateSettlementRequest,
  UpdateInviteRebateConfigRequest,
  UpsertInviteRebateProfileRequest,
} from '@shared/types'
import { api } from './api'

const INVITE_REBATE_BASE = '/transactions/invite-rebates'

export const inviteRebateService = {
  getConfig: async (): Promise<InviteRebateConfig> => {
    const response = await api.get<InviteRebateConfig>(`${INVITE_REBATE_BASE}/config`)
    return response.data
  },

  updateConfig: async (payload: UpdateInviteRebateConfigRequest): Promise<InviteRebateConfig> => {
    const response = await api.put<InviteRebateConfig>(`${INVITE_REBATE_BASE}/config`, payload)
    return response.data
  },

  listProfiles: async (params?: InviteRebateProfileQueryParams) => {
    return api.getPaginated<InviteRebateProfile>(`${INVITE_REBATE_BASE}/profiles`, params)
  },

  getProfile: async (userId: string): Promise<InviteRebateProfile> => {
    const response = await api.get<InviteRebateProfile>(`${INVITE_REBATE_BASE}/profiles/${userId}`)
    return response.data
  },

  upsertProfile: async (userId: string, payload: UpsertInviteRebateProfileRequest): Promise<InviteRebateProfile> => {
    const response = await api.put<InviteRebateProfile>(`${INVITE_REBATE_BASE}/profiles/${userId}`, payload)
    return response.data
  },

  listEvents: async (params?: InviteRebateEventQueryParams) => {
    return api.getPaginated<InviteRebateEvent>(`${INVITE_REBATE_BASE}/events`, params)
  },

  listSettlements: async (params?: InviteRebateSettlementQueryParams) => {
    return api.getPaginated<InviteRebateSettlement>(`${INVITE_REBATE_BASE}/settlements`, params)
  },

  runSettlement: async (payload: RunInviteRebateSettlementRequest): Promise<InviteRebateSettlementRunResult> => {
    const response = await api.post<InviteRebateSettlementRunResult>(`${INVITE_REBATE_BASE}/settlements/run`, payload)
    return response.data
  },
}
