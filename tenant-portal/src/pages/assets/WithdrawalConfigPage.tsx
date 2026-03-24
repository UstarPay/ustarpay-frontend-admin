import React from "react";

import AssetSupportConfigManager from "./AssetSupportConfigManager";

const WithdrawalConfigPage: React.FC = () => {
  return (
    <AssetSupportConfigManager
      scene="withdrawal"
      title="提现网络配置"
      description="配置用户可发起提现的网络和币种。用户提交提现前会按这里的启用结果进行校验。"
      infoDescription="当前提现网络和币种基于系统币种列表维护。保存后，App 端和相关接口会按这里的启用结果进行过滤。"
    />
  );
};

export default WithdrawalConfigPage;
