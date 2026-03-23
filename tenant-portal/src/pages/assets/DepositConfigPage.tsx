import React from "react";

import AssetSupportConfigManager from "./AssetSupportConfigManager";

const DepositConfigPage: React.FC = () => {
  return (
    <AssetSupportConfigManager
      scene="deposit"
      title="充值网络配置"
      description="配置用户可发起充值的网络和币种。相关充值入口和接口会按这里的启用结果进行过滤。"
      infoDescription="当前充值网络和币种基于系统币种列表维护。保存后，App 端和相关接口会按这里的启用结果进行过滤。"
    />
  );
};

export default DepositConfigPage;
