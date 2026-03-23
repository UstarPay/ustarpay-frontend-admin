import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import { currencyService } from "@/services";
import {
  assetSupportConfigService,
  type AssetSupportItem,
  type AssetSupportScene,
} from "@/services/assetSupportConfigService";
import type { Currency } from "@shared/types/currency";

const { Title, Text } = Typography;

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
        <Switch checked={record.enabled} onChange={(checked) => setRowEnabled(record.key, checked)} />
      ),
    },
    {
      title: "网络",
      key: "chain",
      width: 180,
      render: (_: unknown, record: SupportRow) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.chainNetwork || record.chainCode}</Text>
          <Text type="secondary">{record.chainCode}</Text>
        </Space>
      ),
    },
    {
      title: "币种",
      dataIndex: "symbol",
      width: 120,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
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
      render: (value: number, record: SupportRow) => `${value} ${record.symbol}`,
    },
    {
      title: "最小提现",
      dataIndex: "minWithdraw",
      width: 120,
      render: (value: number, record: SupportRow) => `${value} ${record.symbol}`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card bordered={false} className="shadow-sm" bodyStyle={{ padding: 24 }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Title level={3} style={{ marginBottom: 8 }}>
              {title}
            </Title>
            <Text type="secondary">{description}</Text>
          </div>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
              保存配置
            </Button>
          </Space>
        </div>
      </Card>

      <Alert type="info" showIcon message="配置说明" description={currentInfoDescription} />

      <Card bordered={false} className="shadow-sm" bodyStyle={{ padding: 20 }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="搜索链、网络、币种、名称"
              style={{ width: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              style={{ width: 220 }}
              value={chainFilter}
              onChange={setChainFilter}
              options={[{ value: "all", label: "全部网络" }, ...chainOptions]}
            />
          </Space>
          <Space wrap>
            <Tag color="gold">当前列表启用 {enabledCount} 项</Tag>
            <Button onClick={() => setCurrentRowsEnabled(true)}>全选当前筛选</Button>
            <Button onClick={() => setCurrentRowsEnabled(false)}>清空当前筛选</Button>
          </Space>
        </div>
      </Card>

      <Card bordered={false} className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <Table<SupportRow>
          rowKey="key"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 12, showSizeChanger: true }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
}
