import { BaseEntity, ListParams, Status } from "./base"

// 钱包相关类型
export interface Wallet extends BaseEntity {
  tenantId: string
  name: string
  description?: string
  address: string
  status: WalletStatus
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
}

export interface HotWallet extends Wallet {
  chainCodes: string[]  // 支持多个链
  symbols: string[]     // 支持多个代币
  isWithdrawalWallet: boolean
  isGasWallet: boolean
}

export interface ColdWallet extends Wallet {
  chainCodes: string[]  // 支持多个链
  symbols: string[]     // 支持多个代币
  // 冷钱包没有 isWithdrawalWallet 和 isGasWallet 字段
}

export interface WalletQueryParams extends ListParams {
  chainCodes?: string[]
  symbols?: string[]
  address?: string
  name?: string
  userId?: string
  userEmail?: string
  userPhone?: string
  status?: Status
}

export interface FundAccountQueryParams extends ListParams {
  userId?: string
  symbol?: string
  status?: Status
}

export interface FundAccount extends BaseEntity {
  tenantId: string
  userId: string
  userName?: string
  userEmail?: string
  userPhone?: string
  countryCode?: string
  symbol: string
  balance: string
  frozenBalance: string
  availableBalance: string
  status: Status
}

export interface FundAccountStats {
  totalAccounts: number
  activeAccounts: number
  totalSymbols: number
  totalBalance: string
  totalFrozen: string
  totalAvailable: string
}

export interface CardFundAccountQueryParams extends ListParams {
  userId?: string
  status?: number
  cardType?: number
}

export interface CardFundAccount extends BaseEntity {
  tenantId: string
  userId: string
  userName?: string
  userEmail?: string
  userPhone?: string
  countryCode?: string
  cardId: string
  cardType: number
  cardTypeName: string
  amount: string
  status: number
  statusName: string
}

export interface CardFundAccountStats {
  totalAccounts: number
  activeAccounts: number
  virtualAccounts: number
  physicalAccounts: number
  totalBalance: string
}

export interface WalletBalance extends BaseEntity {
  walletId: string
  walletName: string
  address: string
  chainCode: string
  symbol: string
  balance: string
  lockedBalance: string
  availableBalance: string
  frozenBalance?: string
  totalBalance: string
  usdtValue?: string
  change24h?: string
  lastUpdatedAt: string
}

export interface SimpleWalletBalance {
  balance: string,
  frozenBalance: string,
  lastBlockHeight: string
}

export interface WalletWithBalance   {
  wallet: Wallet
  balanceByChain: {
    [chainCode: string]: {
      [symbol: string]: SimpleWalletBalance
    }
  }
  // 用户信息
  userName?: string      // 用户名
  userEmail?: string     // 用户邮箱
  userPhone?: string     // 用户手机号
  userStatus?: number    // 用户状态
  countryCode?: string   // 国家代码
}

export interface HotWalletWithBalance {
  wallet: HotWallet
  balanceByChain: {
    [chainCode: string]: {
      [symbol: string]: SimpleWalletBalance
    }
  }
}

export interface ColdWalletWithBalance {
  wallet: ColdWallet
  balanceByChain: {
    [chainCode: string]: {
      [symbol: string]: SimpleWalletBalance
    }
  }
}

// 热钱包统计
export interface HotWalletStats {
  totalWallets: number
  activeWallets: number
  totalBalance: string
  totalUsdtValue: string
  totalAddresses: number
  todayTransactions: number
  monthlyTransactions: number
  symbols: string[]
  chainCodes: string[]
}

// 创建热钱包请求
export interface CreateHotWalletRequest {
  name: string
  description?: string
  chainCodes: string[]  // 支持多个链，为空表示全部
  symbols: string[]     // 支持多个代币，为空表示全部
  isWithdrawalWallet: boolean
  isGasWallet: boolean
  status: number
}

// 更新热钱包状态请求
export interface UpdateHotWalletStatusRequest {
  status: WalletStatus
  reason?: string
}

// 热钱包更新请求（仅允许更新描述、提现钱包、Gas钱包、状态）
export interface UpdateHotWalletRequest {
  description?: string
  chainCodes?: string[]
  symbols?: string[]
  isWithdrawalWallet?: boolean
  isGasWallet?: boolean
  status?: number
}

// 热钱包余额查询参数
export interface WalletBalanceQueryParams extends ListParams {
  chainCode?: string
  symbol?: string
  minBalance?: string
  maxBalance?: string
}


export enum WalletType {
  HOT = 'hot',
  COLD = 'cold',
}

export enum WalletStatus {
  ACTIVE = 1,
  INACTIVE = 0,
  FROZEN = -1,
}

export interface WalletSettings {
  autoCollection: boolean
  collectionThreshold: number
  withdrawalLimit: number
  dailyWithdrawalLimit: number
  requiresApproval: boolean
  approvers: string[]
}

// 钱包余额类型
export interface WalletBalance {
  walletId: string
  walletName: string
  currency: string
  balance: string
  lockedBalance: string
  availableBalance: string
  frozenBalance?: string
  totalBalance: string
  usdtValue?: string
  change24h?: string
  lastUpdatedAt: string
  addressCount?: number
}

// 钱包统计类型
export interface WalletStatistics {
  totalBalance: string
  totalWallets: number
  activeWallets: number
  totalTransactions: number
  todayTransactions: number
}

export interface WalletInfo {
  walletBalances: WalletBalance[]
  wallets: Wallet[]
}

// 创建冷钱包请求
export interface CreateColdWalletRequest {
  name: string
  description?: string
  address: string  // 用户手动输入的地址
  chainCodes: string[]  // 支持多个链，为空表示全部
  symbols: string[]     // 支持多个代币，为空表示全部
  status?: number
}
