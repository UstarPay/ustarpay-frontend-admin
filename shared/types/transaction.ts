import { BaseEntity, ListParams } from "./base"


export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  COLLECTION = 'collection',
  TRANSFER = 'transfer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// 热钱包列表查询参数
export interface TransactionQueryParams extends ListParams {
  type?: string
}


// 交易相关类型
export interface Transaction extends BaseEntity {
  tenantId: string
  walletId: string
  walletName?: string
  type: TransactionType
  status: TransactionStatus
  currency: string
  amount: string
  fee?: string
  fromAddress?: string
  toAddress?: string
  hash?: string
  blockHeight?: number
  confirmations?: number
  requiredConfirmations?: number
  memo?: string
  errorMessage?: string
  priority?: 'low' | 'medium' | 'high'
  estimatedTime?: number
  actualTime?: number
}
