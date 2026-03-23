import React from 'react'

import AssetSupportConfigManager from './AssetSupportConfigManager'

const WithdrawalConfigPage: React.FC = () => {
  return (
    <AssetSupportConfigManager
      scene="withdrawal"
      title="提现网络配置"
      description="配置当前租户允许用户发起提现的链和币种。用户提交提现前会按这里的启用结果做合规校验。"
    />
  )
}

export default WithdrawalConfigPage
