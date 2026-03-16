import { BaseEntity } from "./base"

// 充值记录类型
export interface Deposit extends BaseEntity {
  tenantId: string
  txHash?: string
  address: string
  fromAddress?: string
  chainCode: string
  symbol: string
  amount: string
  businessId?: string
  status: DepositStatus
  webhookSent: boolean
  webhookSentAt?: string
  confirmations?: number
  requiredConfirmations?: number
  blockHeight?: number
  memo?: string
  errorMessage?: string
}

// 充值状态枚举
export enum DepositStatus {
  PENDING = 0,           // 待确认
  CONFIRMED = 1,         // 确认成功
  CONFIRMATION_FAILED = 2, // 确认失败
  COMPLETED = 3,         // 交易成功
  FAILED = 4,           // 交易失败
  CANCELLED = 5,        // 已取消
}

// 充值状态标签映射
export const DEPOSIT_STATUS_LABELS = {
  [DepositStatus.PENDING]: '待确认',
  [DepositStatus.CONFIRMED]: '充值成功',
  [DepositStatus.CONFIRMATION_FAILED]: '充值失败',
  [DepositStatus.COMPLETED]: '充值成功(旧状态)',
  [DepositStatus.FAILED]: '充值失败(旧状态)',
  [DepositStatus.CANCELLED]: '已取消',
}

// 充值状态颜色映射
export const DEPOSIT_STATUS_COLORS = {
  [DepositStatus.PENDING]: 'orange',
  [DepositStatus.CONFIRMED]: 'blue',
  [DepositStatus.CONFIRMATION_FAILED]: 'red',
  [DepositStatus.COMPLETED]: 'green',
  [DepositStatus.FAILED]: 'red',
  [DepositStatus.CANCELLED]: 'gray',
}
