export interface Currency {
  id: number;
  chainCode: string;
  chainNetwork?: string;
  symbol: string;
  name: string;
  decimals: number;
  isNative: boolean;
  contractAddress?: string;
  iconUrl?: string;
  coingeckoId?: string;
  status: number;
  minDeposit: number;
  minWithdraw: number;
  withdrawFee: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  // 关联数据
  chain?: {
    id: number;
    chainCode: string;
    chainName: string;
  };
}

export interface CreateCurrencyRequest {
  chainCode: string;
  chain_network?: string;
  symbol: string;
  name: string;
  decimals: number;
  isNative: boolean;
  contractAddress?: string;
  iconUrl?: string;
  coingeckoId?: string;
  status?: number;
}

export interface UpdateCurrencyRequest extends Partial<CreateCurrencyRequest> {}

export interface CurrencyListParams {
  page?: number;
  pageSize?: number;
  chainCode?: string;
  isNative?: boolean;
  status?: number;
  keyword?: string;
}

export interface CurrencyListResponse {
  items: Currency[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
