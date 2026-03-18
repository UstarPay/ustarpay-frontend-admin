import { withdrawalRiskConfigService } from './withdrawalRiskConfigService'
import type { WithdrawalRiskConfig, UpsertRiskConfigRequest } from './withdrawalRiskConfigService'

export type WithdrawalFeeConfig = WithdrawalRiskConfig

export interface UpsertFeeConfigRequest extends Pick<
  UpsertRiskConfigRequest,
  'chainCode' | 'symbol' | 'feeMode' | 'fixedFee' | 'feeRate' | 'minFee' | 'maxFee' | 'feeSymbol' | 'feeDeductMode' | 'networkFeeMode'
> {}

export const withdrawalFeeConfigService = {
  listFeeConfigs: withdrawalRiskConfigService.listRiskConfigs,
  getFeeConfig: withdrawalRiskConfigService.getRiskConfig,
  upsertFeeConfig: withdrawalRiskConfigService.upsertRiskConfig,
  deleteFeeConfig: withdrawalRiskConfigService.deleteRiskConfig,
}
