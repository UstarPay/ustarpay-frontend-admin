import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApartmentOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  Button,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";

import { currencyService } from "@/services";
import {
  assetSupportConfigService,
  type AssetSupportItem,
  type AssetSupportScene,
} from "@/services/assetSupportConfigService";
import type { Currency } from "@shared/types/currency";

interface AssetSupportConfigManagerProps {
  scene: AssetSupportScene;
  title: string;
  description: string;
  infoDescription?: string;
}

interface SupportRow {
  key: string;
  chainCode: string;
  chainNetwork?: string;
  symbol: string;
  name: string;
  minDeposit: number;
  minWithdraw: number;
  enabled: boolean;
}

function buildPairKey(chainCode: string, symbol: string) {
  return `${chainCode.toUpperCase()}::${symbol.toUpperCase()}`;
}

const SCENE_META: Record<
  AssetSupportScene,
  {
    heroLabel: string;
    heroGradient: string;
    infoBorder: string;
    infoBackground: string;
    infoIconBackground: string;
  }
> = {
  withdrawal: {
    heroLabel: "WITHDRAW NETWORK CENTER",
    heroGradient:
      "bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_58%,#38bdf8_100%)]",
    infoBorder: "border-sky-100",
    infoBackground: "bg-sky-50/90",
    infoIconBackground: "bg-sky-500",
  },
  deposit: {
    heroLabel: "DEPOSIT NETWORK CENTER",
    heroGradient:
      "bg-[linear-gradient(135deg,#134e4a_0%,#0f766e_52%,#14b8a6_100%)]",
    infoBorder: "border-emerald-100",
    infoBackground: "bg-emerald-50/90",
    infoIconBackground: "bg-emerald-500",
  },
};

export default function AssetSupportConfigManager({
  scene,
  title,
  description,
  infoDescription,
}: AssetSupportConfigManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [chainFilter, setChainFilter] = useState<string>("all");

  const sceneLabel = scene === "deposit" ? "充值" : "提现";
  const sceneMeta = SCENE_META[scene];
  const currentInfoDescription =
    infoDescription ??
    `当前${sceneLabel}网络和币种基于系统币种列表维护。保存后，App 端和相关接口会按这里的启用结果进行过滤。`;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [currencyResp, configItems] = await Promise.all([
        currencyService.getActiveCurrencies(),
        assetSupportConfigService.getSceneItems(scene),
      ]);

      const currencyList = ((currencyResp as any)?.data ?? currencyResp ?? []) as Currency[];
      const activeCurrencies = currencyList.filter((item) => Number(item.status) === 1);
      setCurrencies(activeCurrencies);

      const configuredMap: Record<string, boolean> = {};
      if (configItems.length > 0) {
        configItems.forEach((item) => {
          configuredMap[buildPairKey(item.chainCode, item.symbol)] = item.enabled !== false;
        });
      } else {
        activeCurrencies.forEach((item) => {
          configuredMap[buildPairKey(item.chainCode, item.symbol)] = true;
        });
      }
      setEnabledMap(configuredMap);
    } catch (error) {
      console.error(`加载${sceneLabel}网络配置失败`, error);
      message.error(`加载${sceneLabel}网络配置失败`);
    } finally {
      setLoading(false);
    }
  }, [scene, sceneLabel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const chainOptions = useMemo(() => {
    const unique = new Map<string, string>();
    currencies.forEach((item) => {
      if (!unique.has(item.chainCode)) {
        unique.set(item.chainCode, item.chainNetwork || item.chainCode);
      }
    });
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [currencies]);

  const rows = useMemo<SupportRow[]>(() => {
    const keyword = search.trim().toLowerCase();

    return currencies
      .filter((item) => chainFilter === "all" || item.chainCode === chainFilter)
      .filter((item) => {
        if (!keyword) return true;
        return (
          item.chainCode.toLowerCase().includes(keyword) ||
          (item.chainNetwork || "").toLowerCase().includes(keyword) ||
          item.symbol.toLowerCase().includes(keyword) ||
          item.name.toLowerCase().includes(keyword)
        );
      })
      .map((item) => ({
        key: buildPairKey(item.chainCode, item.symbol),
        chainCode: item.chainCode,
        chainNetwork: item.chainNetwork,
        symbol: item.symbol,
        name: item.name,
        minDeposit: Number(item.minDeposit ?? 0),
        minWithdraw: Number(item.minWithdraw ?? 0),
        enabled: enabledMap[buildPairKey(item.chainCode, item.symbol)] !== false,
      }))
      .sort((a, b) => {
        if (a.chainCode === b.chainCode) {
          return a.symbol.localeCompare(b.symbol);
        }
        return a.chainCode.localeCompare(b.chainCode);
      });
  }, [chainFilter, currencies, enabledMap, search]);

  const enabledCount = useMemo(() => rows.filter((row) => row.enabled).length, [rows]);
  const totalPairCount = currencies.length;
  const totalEnabledCount = useMemo(
    () =>
      currencies.filter(
        (item) => enabledMap[buildPairKey(item.chainCode, item.symbol)] !== false,
      ).length,
    [currencies, enabledMap],
  );
  const filteredDisabledCount = Math.max(rows.length - enabledCount, 0);

  const heroStats = [
    {
      key: "total",
      label: "系统币种对",
      value: totalPairCount,
      description: "随系统币种列表同步更新",
      className: "bg-white/10 border border-white/15",
    },
    {
      key: "enabled",
      label: "整体已启用",
      value: totalEnabledCount,
      description: "保存后按启用结果生效",
      className: "bg-slate-950/20 border border-white/10",
    },
  ];

  const overviewCards = [
    {
      key: "networks",
      label: "网络数量",
      value: chainOptions.length,
      description: "按链维度统一管理可见范围",
      icon: <ApartmentOutlined />,
      iconClassName: "bg-sky-50 text-sky-600",
    },
    {
      key: "filtered",
      label: "当前筛选结果",
      value: rows.length,
      description: "支持基于筛选结果批量处理",
      icon: <SwapOutlined />,
      iconClassName: "bg-violet-50 text-violet-600",
    },
    {
      key: "disabled",
      label: "当前列表停用",
      value: filteredDisabledCount,
      description: "便于快速确认需要隐藏的组合",
      icon: <CloseCircleOutlined />,
      iconClassName: "bg-rose-50 text-rose-600",
    },
  ];

  const setRowEnabled = (key: string, enabled: boolean) => {
    setEnabledMap((prev) => ({
      ...prev,
      [key]: enabled,
    }));
  };

  const setCurrentRowsEnabled = (enabled: boolean) => {
    setEnabledMap((prev) => {
      const next = { ...prev };
      rows.forEach((row) => {
        next[row.key] = enabled;
      });
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const items: AssetSupportItem[] = currencies
        .filter((item) => enabledMap[buildPairKey(item.chainCode, item.symbol)] !== false)
        .map((item, index) => ({
          chainCode: item.chainCode,
          symbol: item.symbol,
          enabled: true,
          sort: index + 1,
        }));

      await assetSupportConfigService.saveSceneItems(scene, items);
      message.success(`${sceneLabel}网络配置已保存`);
      await loadData();
    } catch (error) {
      console.error(`保存${sceneLabel}网络配置失败`, error);
      message.error(`保存${sceneLabel}网络配置失败`);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "启用",
      dataIndex: "enabled",
      width: 96,
      render: (_: boolean, record: SupportRow) => (
        <Switch
          checked={record.enabled}
          disabled={saving}
          onChange={(checked) => setRowEnabled(record.key, checked)}
        />
      ),
    },
    {
      title: "网络",
      key: "chain",
      width: 180,
      render: (_: unknown, record: SupportRow) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900">
            {record.chainNetwork || record.chainCode}
          </div>
          <div className="text-xs text-slate-400">{record.chainCode}</div>
        </div>
      ),
    },
    {
      title: "币种",
      dataIndex: "symbol",
      width: 120,
      render: (value: string) => (
        <Tag className="!m-0 rounded-full border-0 bg-sky-50 px-3 py-1 text-sky-600">
          {value}
        </Tag>
      ),
    },
    {
      title: "名称",
      dataIndex: "name",
      width: 180,
    },
    {
      title: "最小充值",
      dataIndex: "minDeposit",
      width: 120,
      render: (value: number, record: SupportRow) => (
        <span className="font-medium text-slate-700">{`${value} ${record.symbol}`}</span>
      ),
    },
    {
      title: "最小提现",
      dataIndex: "minWithdraw",
      width: 120,
      render: (value: number, record: SupportRow) => (
        <span className="font-medium text-slate-700">{`${value} ${record.symbol}`}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#eff6ff_32%,#f8fafc_100%)] p-5">
        <div
          className={`overflow-hidden rounded-[24px] ${sceneMeta.heroGradient} px-7 py-6 text-white shadow-sm`}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs uppercase tracking-[0.24em] text-white/75">
                {sceneMeta.heroLabel}
              </div>
              <div className="mt-3 text-[2.2rem] font-semibold leading-tight tracking-tight">
                {title}
              </div>
              <div className="mt-3 text-sm leading-6 text-white/85">
                {description}
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:min-w-[360px]">
              <div className="rounded-[22px] bg-white px-5 py-4 text-slate-900 shadow-lg shadow-slate-950/10">
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="large"
                    icon={<ReloadOutlined />}
                    onClick={loadData}
                    loading={loading}
                  >
                    刷新数据
                  </Button>
                  <Button
                    size="large"
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={saving}
                  >
                    保存配置
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {heroStats.map((item) => (
                  <div
                    key={item.key}
                    className={`rounded-2xl p-4 backdrop-blur ${item.className}`}
                  >
                    <div className="text-xs uppercase tracking-[0.2em] text-sky-100">
                      {item.label}
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      {item.value}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-sky-100">
                      {item.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`rounded-[24px] border ${sceneMeta.infoBorder} ${sceneMeta.infoBackground} p-5 shadow-sm`}
      >
        <div className="flex gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${sceneMeta.infoIconBackground} text-lg text-white`}
          >
            <InfoCircleOutlined />
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">配置说明</div>
            <div className="mt-2 text-sm leading-7 text-slate-600">
              {currentInfoDescription}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {overviewCards.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  {item.value}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </div>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg ${item.iconClassName}`}
              >
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight text-slate-900">
            配置工作台
          </div>
          <div className="mt-1 text-sm text-slate-500">
            筛选网络与币种，批量调整启用状态并保存生效。
          </div>
        </div>
        <Tag className="!m-0 rounded-full border-0 bg-amber-50 px-3 py-1 text-sm text-amber-600">
          当前列表启用 {enabledCount} 项
        </Tag>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="mb-3">
            <div className="text-sm font-semibold text-slate-900">筛选与搜索</div>
            <div className="mt-0.5 text-xs text-slate-500">
              组合条件快速收敛可配置网络，并支持当前筛选结果批量操作。
            </div>
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <Space wrap size={[12, 12]}>
              <Input.Search
                allowClear
                size="large"
                placeholder="搜索链、网络、币种、名称"
                style={{ width: 320 }}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select
                size="large"
                style={{ width: 240 }}
                value={chainFilter}
                onChange={setChainFilter}
                options={[{ value: "all", label: "全部网络" }, ...chainOptions]}
              />
            </Space>

            <Space wrap size={[12, 12]}>
              <Button
                size="large"
                disabled={rows.length === 0 || saving}
                onClick={() => setCurrentRowsEnabled(true)}
              >
                全选当前筛选
              </Button>
              <Button
                size="large"
                disabled={rows.length === 0 || saving}
                onClick={() => setCurrentRowsEnabled(false)}
              >
                清空当前筛选
              </Button>
            </Space>
          </div>
        </div>

        <div className="px-2 pb-2 pt-4">
          <Table<SupportRow>
            rowKey="key"
            loading={loading}
            columns={columns}
            dataSource={rows}
            pagination={{
              pageSize: 12,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 项`,
            }}
            locale={{
              emptyText: (
                <div className="py-10">
                  <div className="text-base font-medium text-slate-500">
                    暂无可配置的{sceneLabel}网络
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    请先检查系统币种列表或筛选条件。
                  </div>
                </div>
              ),
            }}
            scroll={{ x: 960 }}
          />
        </div>
      </div>
    </div>
  );
}
