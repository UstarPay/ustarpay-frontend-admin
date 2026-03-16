export interface Chain {
  id: number
  chainId: number
  chainCode: string
  chainName: string
  chainNetwork?: string
  nativeSymbol: string
  rpcUrls: string[]
  explorerUrl: string
  lastScanHeight: number
  lastScanTime: string
  confirmationBlocks: number
  scanHeight: number
  scanInterval: number
  status: number
  createdAt: string
  updatedAt: string
  createdBy?: number
  updatedBy?: number
  currencies?: Array<{
    id: number
    chainCode: string
    symbol: string
    name: string
    decimals: number
    contractAddress: string
    isNative: boolean
    minDeposit: string
    minWithdraw: string
    withdrawFee: string
    status: number
    createdAt: string
    updatedAt: string
  }>
}

export interface CreateChainRequest {
  chainId: number
  chainCode: string
  chainName: string
  chain_network?: string
  nativeSymbol: string
  rpcUrls: string[]
  wsUrls?: string[]
  explorerUrls?: string[]
  confirmationBlocks?: number
  scanHeight?: number
  scanInterval?: number
  blockTime?: number
  isActive?: boolean
  isMainnet?: boolean
  status?: number
}

export interface UpdateChainRequest extends Partial<CreateChainRequest> {
}

export interface ChainListParams {
  page?: number
  pageSize?: number
  status?: number
  search?: string
}

export interface ChainListResponse {
  items: Chain[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
