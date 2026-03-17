import { BaseEntity } from "./base"

// 内部转账记录类型
export interface InternalTransfer extends BaseEntity {
  tenantId: string
  transferType: InternalTransferType
  txHash?: string
  fromAddress: string
  toAddress: string
  chainCode: string
  symbol: string
  amount: string
  blockFee: string
  status: InternalTransferStatus
  createdBy?: string
  updatedBy?: string
  processedAt?: string
  completedAt?: string
  memo?: string
  fromWalletType?: 'hot' | 'cold'
  toWalletType?: 'hot' | 'cold'
  fromWalletName?: string
  toWalletName?: string
}

// 内部转账类型枚举
export enum InternalTransferType {
  COLLECT = 'collect',      // 归集
  REPLENISH = 'replenish',  // 补充
  REBALANCE = 'rebalance',  // 再平衡
  MANUAL = 'manual',        // 手动转账
}

// 内部转账状态枚举
export enum InternalTransferStatus {
  PENDING = 1,      // 待处理
  PROCESSING = 2,   // 处理中
  COMPLETED = 3,    // 已完成
  FAILED = -1,      // 失败
  CANCELLED = 0,    // 已取消
}

// 内部转账类型标签映射
export const INTERNAL_TRANSFER_TYPE_LABELS = {
  [InternalTransferType.COLLECT]: '归集',
  [InternalTransferType.REPLENISH]: '补充',
  [InternalTransferType.REBALANCE]: '再平衡',
  [InternalTransferType.MANUAL]: '手动转账',
}

// 内部转账类型颜色映射
export const INTERNAL_TRANSFER_TYPE_COLORS = {
  [InternalTransferType.COLLECT]: 'blue',
  [InternalTransferType.REPLENISH]: 'green',
  [InternalTransferType.REBALANCE]: 'purple',
  [InternalTransferType.MANUAL]: 'orange',
}

// 内部转账状态标签映射
export const INTERNAL_TRANSFER_STATUS_LABELS = {
  [InternalTransferStatus.PENDING]: '待处理',
  [InternalTransferStatus.PROCESSING]: '处理中',
  [InternalTransferStatus.COMPLETED]: '已完成',
  [InternalTransferStatus.FAILED]: '失败',
  [InternalTransferStatus.CANCELLED]: '已取消',
}

// 内部转账状态颜色映射
export const INTERNAL_TRANSFER_STATUS_COLORS = {
  [InternalTransferStatus.PENDING]: 'orange',
  [InternalTransferStatus.PROCESSING]: 'blue',
  [InternalTransferStatus.COMPLETED]: 'green',
  [InternalTransferStatus.FAILED]: 'red',
  [InternalTransferStatus.CANCELLED]: 'gray',
}

// 内部转账申请类型
export interface InternalTransferRequest {
  transferType: InternalTransferType
  fromAddress: string
  toAddress: string
  chainCode: string
  symbol: string
  amount: string
  memo?: string
}

// 待处理交易类型
export interface PendingTransaction extends BaseEntity {
  tenantId: string
  type: 'withdraw' | 'transfer' | 'collect' | 'replenish'
  amount: string
  currency: string
  toAddress?: string
  fromAddress?: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'processing' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  businessId?: string
  memo?: string
  estimatedFee?: string
  requiredApprovals?: number
  currentApprovals?: number
  approvers?: string[]
  rejectionReason?: string
  submittedBy?: string
  reviewedBy?: string
  reviewedAt?: string
}