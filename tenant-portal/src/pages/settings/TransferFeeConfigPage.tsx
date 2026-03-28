import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Statistic,
  Switch,
  Typography,
  message,
} from "antd";
import { ReloadOutlined, SaveOutlined, SwapOutlined } from "@ant-design/icons";

import { TENANT_PERMISSION } from "@/constants/rbac";
import {
  transferFeeConfigService,
  type TenantConfigRecord,
  type WalletTransferConfigPayload,
} from "@/services/transferFeeConfigService";
import { useAuthStore } from "@/stores/authStore";

const { Paragraph, Text, Title } = Typography;

type FormValues = {
  enabled: boolean;
  feeRatePercent: number;
  minCreditedAmount: number;
  maxCreditedAmount: number;
  dailyCreditedLimit: number;
  supportedCurrenciesText: string;
  exchangeRatesText: string;
};

const DEFAULT_EXCHANGE_RATES: Record<string, string> = {
  USDT: "1",
};

const DEFAULT_VALUES: WalletTransferConfigPayload = {
  enabled: true,
  feeRate: "0.010000",
  minCreditedAmount: "0",
  maxCreditedAmount: "0",
  dailyCreditedLimit: "0",
  supportedCurrencies: [],
  exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
};

function parseFeeRatePercent(raw?: string | number) {
  const numeric = Number(raw ?? 0);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 1;
  }
  return numeric <= 1 ? numeric * 100 : numeric;
}

function parseConfigValue(raw?: string): WalletTransferConfigPayload {
  if (!raw?.trim()) {
    return DEFAULT_VALUES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WalletTransferConfigPayload> & { feeRate?: string | number };
    const normalizedExchangeRates =
      typeof parsed.exchangeRates === "object" && parsed.exchangeRates
        ? Object.fromEntries(
            Object.entries(parsed.exchangeRates)
              .map(([key, value]) => [
                key.trim().toUpperCase().replace(/-/g, "_"),
                String(value).trim(),
              ])
              .filter(([key, value]) => key && value),
          )
        : {};

    return {
      enabled: parsed.enabled ?? true,
      feeRate: String(parsed.feeRate ?? DEFAULT_VALUES.feeRate),
      minCreditedAmount: String(parsed.minCreditedAmount ?? "0"),
      maxCreditedAmount: String(parsed.maxCreditedAmount ?? "0"),
      dailyCreditedLimit: String(parsed.dailyCreditedLimit ?? "0"),
      supportedCurrencies: Array.isArray(parsed.supportedCurrencies)
        ? parsed.supportedCurrencies.map((item) => String(item).trim().toUpperCase()).filter(Boolean)
        : [],
      exchangeRates:
        Object.keys(normalizedExchangeRates).length > 0
          ? normalizedExchangeRates
          : { ...DEFAULT_EXCHANGE_RATES },
    };
  } catch {
    return {
      ...DEFAULT_VALUES,
      feeRate: String(raw),
    };
  }
}

function stringifyCurrencies(value: string[]) {
  return value.join(", ");
}

function parseCurrencies(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/)
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
  );
}

function stringifyExchangeRates(value: Record<string, string>) {
  return Object.entries(value)
    .map(([key, rate]) => `${key}=${rate}`)
    .join("\n");
}

function parseExchangeRates(raw: string) {
  const next: Record<string, string> = {};
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [rawKey, rawValue] = line.split("=", 2);
      const key = rawKey?.trim().toUpperCase().replace(/-/g, "_");
      const value = rawValue?.trim();
      if (!key || !value) {
        return;
      }
      next[key] = value;
    });
  return next;
}

export default function TransferFeeConfigPage() {
  const [form] = Form.useForm<FormValues>();
  const canManage = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.CONFIG_MANAGE));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [effectiveConfig, setEffectiveConfig] = useState<WalletTransferConfigPayload>(DEFAULT_VALUES);
  const [configSource, setConfigSource] = useState<"default" | "legacy" | "current">("default");

  const applyConfigToForm = useCallback(
    (record?: TenantConfigRecord) => {
      const parsed = parseConfigValue(record?.configValue);
      const source =
        record?.configKey === "wallet_to_card_transfer_fee"
          ? "legacy"
          : record
            ? "current"
            : "default";

      setEffectiveConfig(parsed);
      setConfigSource(source);
      form.setFieldsValue({
        enabled: parsed.enabled,
        feeRatePercent: parseFeeRatePercent(parsed.feeRate),
        minCreditedAmount: Number(parsed.minCreditedAmount || 0),
        maxCreditedAmount: Number(parsed.maxCreditedAmount || 0),
        dailyCreditedLimit: Number(parsed.dailyCreditedLimit || 0),
        supportedCurrenciesText: stringifyCurrencies(parsed.supportedCurrencies),
        exchangeRatesText: stringifyExchangeRates(parsed.exchangeRates),
      });
    },
    [form],
  );

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await transferFeeConfigService.getConfig();
      applyConfigToForm(response.data);
    } catch (error) {
      applyConfigToForm(undefined);
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [applyConfigToForm]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const payload: WalletTransferConfigPayload = {
        enabled: !!values.enabled,
        feeRate: (Math.max(0, Number(values.feeRatePercent || 0)) / 100).toFixed(6),
        minCreditedAmount: Math.max(0, Number(values.minCreditedAmount || 0)).toFixed(2),
        maxCreditedAmount: Math.max(0, Number(values.maxCreditedAmount || 0)).toFixed(2),
        dailyCreditedLimit: Math.max(0, Number(values.dailyCreditedLimit || 0)).toFixed(2),
        supportedCurrencies: parseCurrencies(values.supportedCurrenciesText || ""),
        exchangeRates: parseExchangeRates(values.exchangeRatesText || ""),
      };

      if (
        Number(payload.maxCreditedAmount) > 0 &&
        Number(payload.minCreditedAmount) > Number(payload.maxCreditedAmount)
      ) {
        message.error("单笔最低到账金额不能大于单笔最高到账金额");
        return;
      }

      setSaving(true);
      const response = await transferFeeConfigService.updateConfig(payload);
      applyConfigToForm(response.data);
      message.success("转账配置已保存");
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) {
        return;
      }
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  }, [applyConfigToForm, form]);

  const preview = useMemo(() => {
    const feePercent = parseFeeRatePercent(effectiveConfig.feeRate);
    const sourceAmount = 1000;
    const fee = (sourceAmount * feePercent) / 100;
    const net = sourceAmount - fee;
    const sampleRate = Number(Object.values(effectiveConfig.exchangeRates)[0] || 1);
    return {
      feePercent,
      fee,
      net,
      credited: net * sampleRate,
      sampleRate,
    };
  }, [effectiveConfig]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#111827_48%,#14532d_100%)] text-white shadow-[0_24px_70px_rgba(20,83,45,0.22)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.18),transparent_34%)]" />
          <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.34em] text-emerald-100/80">
                Wallet to Card Transfer
              </div>
              <div className="flex flex-col gap-2">
                <Title level={2} className="!m-0 !text-white">
                  转账配置
                </Title>
                <Paragraph className="!m-0 !text-sm !leading-6 !text-slate-200">
                  管理钱包向卡片转账时的开关、手续费、到账限额、可用币种和汇率规则。保存后会实时覆盖租户当前的钱包转卡逻辑。
                </Paragraph>
              </div>
              <Space wrap>
                <Button
                  icon={<ReloadOutlined />}
                  loading={loading}
                  onClick={() => void loadConfig()}
                  className="h-9 rounded-full border-white/15 bg-white/10 px-4 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
                >
                  刷新配置
                </Button>
                {canManage ? (
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => void handleSave()}
                    className="h-9 rounded-full bg-emerald-300 px-4 text-slate-950 shadow-none hover:!bg-emerald-200 hover:!text-slate-950"
                  >
                    保存配置
                  </Button>
                ) : null}
              </Space>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Status</div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  {effectiveConfig.enabled ? "已启用" : "已关闭"}
                </div>
                <div className="mt-1 text-xs text-slate-200">当前转账开关状态</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Source</div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  {configSource === "current" ? "新配置" : configSource === "legacy" ? "旧费率" : "默认值"}
                </div>
                <div className="mt-1 text-xs text-slate-200">当前页面加载到的配置来源</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Alert
        type="info"
        showIcon
        message="额度统一按卡到账币种计算"
        description="单笔最低到账、单笔最高到账和每日累计到账上限，均按入卡后的目标币种金额校验。手续费仍按钱包侧转出币种扣减。"
        className="rounded-[22px] border border-sky-100 bg-sky-50/80"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card bordered={false} className="rounded-[28px] border border-slate-200 bg-white shadow-sm" bodyStyle={{ padding: 24 }}>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <SwapOutlined />
              </div>
              <div className="flex flex-col gap-1">
                <Text className="text-sm font-medium text-slate-500">规则编辑</Text>
                <Title level={4} className="!m-0">
                  钱包转卡参数
                </Title>
              </div>
            </div>

            <Form<FormValues> form={form} layout="vertical" disabled={!canManage || loading}>
              <Form.Item
                label="转账开关"
                name="enabled"
                valuePropName="checked"
                extra="关闭后，前台仍可看到页面，但无法真正提交钱包转卡。"
              >
                <Switch checkedChildren="启用" unCheckedChildren="关闭" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="手续费率（%）"
                    name="feeRatePercent"
                    rules={[{ required: true, message: "请输入手续费率" }]}
                  >
                    <InputNumber min={0} max={100} step={0.1} precision={2} addonAfter="%" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="每日累计到账上限"
                    name="dailyCreditedLimit"
                    rules={[{ required: true, message: "请输入每日累计到账上限" }]}
                    extra="0 表示不限制"
                  >
                    <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="单笔最低到账金额"
                    name="minCreditedAmount"
                    rules={[{ required: true, message: "请输入单笔最低到账金额" }]}
                    extra="按入卡币种计算，0 表示不限制"
                  >
                    <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="单笔最高到账金额"
                    name="maxCreditedAmount"
                    rules={[{ required: true, message: "请输入单笔最高到账金额" }]}
                    extra="按入卡币种计算，0 表示不限制"
                  >
                    <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="可用币种"
                name="supportedCurrenciesText"
                extra="用逗号或换行分隔。留空表示不限制币种。示例：USDT, USDC, BTC"
              >
                <Input.TextArea rows={3} placeholder="USDT, USDC, BTC" />
              </Form.Item>

              <Form.Item
                label="汇率配置"
                name="exchangeRatesText"
                extra="每行一条，格式为 币种=汇率 或 币种对=汇率。默认建议保留 USDT=1；若钱包币种与卡币种相同，会自动按 1 处理。"
              >
                <Input.TextArea rows={6} placeholder={"USDT=1\nUSDC=1\nBTC_USD=65000"} />
              </Form.Item>
            </Form>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card bordered={false} className="rounded-[28px] border border-slate-200 bg-white shadow-sm" bodyStyle={{ padding: 24 }}>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <SaveOutlined />
                </div>
                <div className="flex flex-col gap-1">
                  <Text className="text-sm font-medium text-slate-500">保存格式</Text>
                  <Title level={4} className="!m-0">
                    配置落库预览
                  </Title>
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-xs leading-6 text-slate-600">
                {JSON.stringify(effectiveConfig, null, 2)}
              </div>
            </div>
          </Card>

          <Card
            bordered={false}
            className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] shadow-sm"
            bodyStyle={{ padding: 24 }}
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <Text className="text-sm font-medium text-emerald-700">影响预览</Text>
                <Title level={4} className="!m-0">
                  以钱包转出 1000 为例
                </Title>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Statistic title="转出金额" value={1000} precision={2} />
                <Statistic title="手续费" value={preview.fee} precision={2} />
                <Statistic title="净额" value={preview.net} precision={2} />
                <Statistic title="到账金额" value={preview.credited} precision={2} />
              </div>

              <div className="rounded-[22px] border border-emerald-100 bg-white px-4 py-4">
                <Title level={5} className="!mb-3 !mt-0">
                  当前规则摘要
                </Title>
                <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-slate-600">
                  <li>手续费率：{preview.feePercent.toFixed(2)}%</li>
                  <li>示例汇率：{preview.sampleRate.toFixed(6)}</li>
                  <li>
                    可用币种：
                    {effectiveConfig.supportedCurrencies.length ? effectiveConfig.supportedCurrencies.join(", ") : "不限"}
                  </li>
                  <li>
                    单笔到账区间：
                    {Number(effectiveConfig.minCreditedAmount) > 0 ? effectiveConfig.minCreditedAmount : "不限"}
                    {" ~ "}
                    {Number(effectiveConfig.maxCreditedAmount) > 0 ? effectiveConfig.maxCreditedAmount : "不限"}
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
