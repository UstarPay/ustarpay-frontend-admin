export interface InviteRebateConfig {
  enabled: boolean
  currency: string
  consumeSettleDays: number
  openCardDirectRate: string
  openCardIndirectRate: string
  consumeDirectRate: string
  consumeIndirectRate: string
}

export interface UpdateInviteRebateConfigRequest {
  enabled: boolean
  currency: string
  consumeSettleDays: number
  openCardDirectRate: string
  openCardIndirectRate: string
  consumeDirectRate: string
  consumeIndirectRate: string
}

export interface InviteRebateProfile {
  id?: string
  tenantId?: string
  userId: string
  userName?: string
  userEmail?: string
  profileType: string
  status: number
  openCardDirectRate?: string
  openCardIndirectRate?: string
  consumeDirectRate?: string
  consumeIndirectRate?: string
  consumeSettleDays?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface InviteRebateProfileQueryParams {
  page?: number
  pageSize?: number
  search?: string
  userId?: string
  status?: string
  profileType?: string
}

export interface UpsertInviteRebateProfileRequest {
  profileType?: string
  status?: number
  openCardDirectRate?: string
  openCardIndirectRate?: string
  consumeDirectRate?: string
  consumeIndirectRate?: string
  consumeSettleDays?: number
  remark?: string
}

export interface InviteRebateEvent {
  id: string
  rebateType: string
  sourceEventKey: string
  sourceUserId: string
  sourceUserName?: string
  sourceUserEmail?: string
  beneficiaryUserId: string
  beneficiaryUserName?: string
  beneficiaryUserEmail?: string
  relationLevel: number
  sourceAmount: string
  sourceCurrency: string
  rebateRate: string
  rebateAmount: string
  currency: string
  settleMode: string
  settleDays: number
  settleAt: string
  settledAt?: string
  status: string
  cardRecordId?: string
  cardTransactionId?: string
  remark?: string
  createdAt: string
}

export interface InviteRebateEventQueryParams {
  page?: number
  pageSize?: number
  search?: string
  rebateType?: string
  status?: string
  settleMode?: string
  relationLevel?: string
  sourceUserId?: string
  beneficiaryUserId?: string
  startDate?: string
  endDate?: string
}

export interface InviteRebateSettlement {
  id: string
  eventId: string
  rebateType?: string
  sourceEventKey?: string
  beneficiaryUserId: string
  beneficiaryUserName?: string
  beneficiaryUserEmail?: string
  accountId?: string
  symbol: string
  amount: string
  status: string
  fundFlowRecordId?: string
  settledAt: string
  createdAt: string
}

export interface InviteRebateSettlementQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  eventId?: string
  beneficiaryUserId?: string
  startDate?: string
  endDate?: string
}

export interface RunInviteRebateSettlementRequest {
  limit: number
}

export interface InviteRebateSettlementRunResult {
  settledCount: number
}
