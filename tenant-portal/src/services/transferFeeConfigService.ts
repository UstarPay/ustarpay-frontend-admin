import { api } from "./api";

export interface TenantConfigRecord {
  id?: string;
  tenantId?: string;
  configKey: string;
  configValue: string;
  name?: string;
  description?: string;
}

export const transferFeeConfigService = {
  getConfig: async () => {
    return api.get<TenantConfigRecord>("/config/key/wallet_to_card_transfer_fee");
  },

  updateConfig: async (feeRate: string) => {
    return api.put<TenantConfigRecord>("/config/key/wallet_to_card_transfer_fee", {
      value: JSON.stringify({ feeRate }),
    });
  },
};
