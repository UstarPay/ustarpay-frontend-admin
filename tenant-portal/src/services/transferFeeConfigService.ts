import { api } from "./api";

export interface TenantConfigRecord {
  id?: string;
  tenantId?: string;
  configKey: string;
  configValue: string;
  name?: string;
  description?: string;
}

export interface WalletTransferConfigPayload {
  enabled: boolean;
  feeRate: string;
  minCreditedAmount: string;
  maxCreditedAmount: string;
  dailyCreditedLimit: string;
  supportedCurrencies: string[];
  exchangeRates: Record<string, string>;
}

const NEW_KEY = "/config/key/wallet_to_card_transfer";
const LEGACY_KEY = "/config/key/wallet_to_card_transfer_fee";

export const transferFeeConfigService = {
  getConfig: async () => {
    try {
      return await api.get<TenantConfigRecord>(NEW_KEY);
    } catch {
      return api.get<TenantConfigRecord>(LEGACY_KEY);
    }
  },

  updateConfig: async (payload: WalletTransferConfigPayload) => {
    return api.put<TenantConfigRecord>(NEW_KEY, {
      value: JSON.stringify(payload),
    });
  },
};
