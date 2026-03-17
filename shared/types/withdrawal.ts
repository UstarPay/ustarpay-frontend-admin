import { BaseEntity } from "./base"

// 提现记录类型
export interface Withdrawal extends BaseEntity {
  tenantId: string
  txHash?: string
  address: string
  chainCode: string
  symbol: string
  amount: string
  blockFee: string
  businessId: string
  confirmations: number
  requiredConfirmations: number
  status: WithdrawalStatus
  failureReason?: string
  webhookSent: boolean
  webhookSentAt?: string
  requestedAt: string
  processedAt?: string
  completedAt?: string
  createdBy?: string
  updatedBy?: string
  memo?: string
  priority?: 'low' | 'normal' | 'high'
  estimatedTime?: string
}

// 提现状态枚举
export enum WithdrawalStatus {
  PENDING = 0,          // 待审核
  APPROVED = 1,         // 审核成功
  REJECTED = 2,         // 审核失败
  COMPLETED = 3,        // 交易成功
  FAILED = 4,          // 交易失败
  CANCELLED = 5,       // 已取消
}

// 提现状态标签映射
export const WITHDRAWAL_STATUS_LABELS = {
  [WithdrawalStatus.PENDING]: '待审核',
  [WithdrawalStatus.APPROVED]: '审核成功',
  [WithdrawalStatus.REJECTED]: '审核失败',
  [WithdrawalStatus.COMPLETED]: '交易成功',
  [WithdrawalStatus.FAILED]: '交易失败',
  [WithdrawalStatus.CANCELLED]: '已取消',
}

// 提现状态颜色映射
export const WITHDRAWAL_STATUS_COLORS = {
  [WithdrawalStatus.PENDING]: 'orange',
  [WithdrawalStatus.APPROVED]: 'blue',
  [WithdrawalStatus.REJECTED]: 'red',
  [WithdrawalStatus.COMPLETED]: 'green',
  [WithdrawalStatus.FAILED]: 'red',
  [WithdrawalStatus.CANCELLED]: 'gray',
}

// 提现申请类型
export interface WithdrawalRequest {
  address: string
  chainCode: string
  symbol: string
  amount: string
  businessId: string
  memo?: string
  priority?: 'low' | 'normal' | 'high'
}

// 提现手续费估算类型
export interface WithdrawalFeeEstimate {
  fee: string
  estimatedTime: string
  priority: string
  networkFee: string
  serviceFee: string
  totalFee: string
}

// 提现请求类型
export interface WithdrawRequest {
  walletId: string
  toAddress: string
  amount: string
  currency: string
  priority?: 'low' | 'medium' | 'high'
  memo?: string
}