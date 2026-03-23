import React, { useEffect, useMemo, useState } from "react";
import { Result, Tabs } from "antd";

import { TENANT_PERMISSION } from "@/constants/rbac";
import { useAuthStore } from "@/stores/authStore";

import AssetSupportConfigManager from "./AssetSupportConfigManager";

type TabKey = "withdrawal" | "deposit";

interface NetworkTabConfig {
  key: TabKey;
  label: string;
  content: React.ReactNode;
}

export default function AssetNetworkConfigPage() {
  const permissions = useAuthStore((state) => state.permissions);

  const tabItems = useMemo<NetworkTabConfig[]>(() => {
    const items: NetworkTabConfig[] = [];

    if (permissions.includes(TENANT_PERMISSION.WITHDRAWALS_VIEW)) {
      items.push({
        key: "withdrawal",
        label: "提现网络",
        content: (
          <AssetSupportConfigManager
            scene="withdrawal"
            title="提现网络配置"
            description="配置用户可发起提现的网络和币种。用户提交提现前会按这里的启用结果进行校验。"
            infoDescription="当前提现网络和币种基于系统币种列表维护。保存后，App 端和相关接口会按这里的启用结果进行过滤。"
          />
        ),
      });
    }

    if (permissions.includes(TENANT_PERMISSION.DEPOSITS_VIEW)) {
      items.push({
        key: "deposit",
        label: "充值网络",
        content: (
          <AssetSupportConfigManager
            scene="deposit"
            title="充值网络配置"
            description="配置用户可发起充值的网络和币种。相关充值入口和接口会按这里的启用结果进行过滤。"
            infoDescription="当前充值网络和币种基于系统币种列表维护。保存后，App 端和相关接口会按这里的启用结果进行过滤。"
          />
        ),
      });
    }

    return items;
  }, [permissions]);

  const [activeKey, setActiveKey] = useState<TabKey | "">("");

  useEffect(() => {
    if (tabItems.length === 0) {
      setActiveKey("");
      return;
    }

    if (!tabItems.some((item) => item.key === activeKey)) {
      setActiveKey(tabItems[0].key);
    }
  }, [activeKey, tabItems]);

  if (tabItems.length === 0) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问充提网络配置页面。"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white px-6 pt-4 shadow-sm shadow-slate-200/70">
        <Tabs
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key as TabKey)}
          tabBarGutter={32}
          className="[&_.ant-tabs-nav]:mb-6 [&_.ant-tabs-tab]:px-0 [&_.ant-tabs-tab]:pb-4 [&_.ant-tabs-tab-btn]:text-base [&_.ant-tabs-tab-btn]:font-medium"
          items={tabItems.map((item) => ({
            key: item.key,
            label: item.label,
            children: item.content,
          }))}
        />
      </div>
    </div>
  );
}
