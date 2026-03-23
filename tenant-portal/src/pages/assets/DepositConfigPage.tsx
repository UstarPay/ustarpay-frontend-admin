import React from 'react'

import AssetSupportConfigManager from './AssetSupportConfigManager'

const DepositConfigPage: React.FC = () => {
  return (
    <AssetSupportConfigManager
      scene="deposit"
      title="充值网络配置"
      description="配置当前租户允许用户发起加密货币充值的链和币种。法币充值暂不开放。"
    />
  )
}

export default DepositConfigPage
