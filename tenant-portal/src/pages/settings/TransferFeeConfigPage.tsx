import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Form, InputNumber, Space, Statistic, Typography, message } from "antd";
import { DollarOutlined, ReloadOutlined, SaveOutlined, SwapOutlined } from "@ant-design/icons";
import { TENANT_PERMISSION } from "@/constants/rbac";
import { transferFeeConfigService } from "@/services/transferFeeConfigService";
import { useAuthStore } from "@/stores/authStore";

const { Paragraph, Text, Title } = Typography;

const DEFAULT_FEE_RATE = 1;

type FormValues = {
  feeRatePercent: number;
};

function parseFeeRatePercent(raw?: string) {
  if (!raw?.trim()) {
    return DEFAULT_FEE_RATE;
  }

  try {
    const parsed = JSON.parse(raw) as { feeRate?: string | number };
    const numeric = Number(parsed?.feeRate ?? DEFAULT_FEE_RATE / 100);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric <= 1 ? numeric * 100 : numeric;
    }
  } catch {
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric <= 1 ? numeric * 100 : numeric;
    }
  }

  return DEFAULT_FEE_RATE;
}

export default function TransferFeeConfigPage() {
  const [form] = Form.useForm<FormValues>();
  const canManage = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.CONFIG_MANAGE));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [effectivePercent, setEffectivePercent] = useState(DEFAULT_FEE_RATE);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await transferFeeConfigService.getConfig();
      const nextPercent = parseFeeRatePercent(response.data?.configValue);
      setEffectivePercent(nextPercent);
      form.setFieldsValue({ feeRatePercent: nextPercent });
    } catch {
      setEffectivePercent(DEFAULT_FEE_RATE);
      form.setFieldsValue({ feeRatePercent: DEFAULT_FEE_RATE });
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const normalized = Math.max(0, Number(values.feeRatePercent || 0));
      await transferFeeConfigService.updateConfig((normalized / 100).toFixed(6));
      setEffectivePercent(normalized);
      message.success("划转手续费配置已保存");
      await loadConfig();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  }, [form, loadConfig]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(135deg,#111827_0%,#1f2937_48%,#0f766e_100%)] text-white shadow-[0_24px_70px_rgba(15,118,110,0.22)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_34%)]" />
          <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.34em] text-amber-100/80">Wallet to Card Transfer</div>
              <div className="flex flex-col gap-2">
                <Title level={2} className="!m-0 !text-white">
                  划转手续费配置
                </Title>
                <Paragraph className="!m-0 !text-sm !leading-6 !text-slate-200">
                  配置钱包账户划转到卡账户时的固定手续费比例。当前阶段采用单一费率，后端在未配置时会自动回退到默认值 1%。
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
                    className="h-9 rounded-full bg-amber-400 px-4 text-slate-950 shadow-none hover:!bg-amber-300 hover:!text-slate-950"
                  >
                    保存费率
                  </Button>
                ) : null}
              </Space>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Current</div>
                <div className="mt-3 text-2xl font-semibold text-white">{effectivePercent.toFixed(2)}%</div>
                <div className="mt-1 text-xs text-slate-200">当前生效费率</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Formula</div>
                <div className="mt-3 text-2xl font-semibold text-white">金额 × 费率</div>
                <div className="mt-1 text-xs text-slate-200">钱包总扣减 = 划转金额 + 手续费</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Alert
        type="info"
        showIcon
        message="当前阶段仅支持固定费率"
        description="本期先做单一固定费率配置，不区分虚拟卡、实体卡或币种。后续如果要做分层费率，可以继续沿用同一个配置中心扩展。"
        className="rounded-[22px] border border-sky-100 bg-sky-50/80"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card
          bordered={false}
          className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
          bodyStyle={{ padding: 24 }}
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <SwapOutlined />
              </div>
              <div className="flex flex-col gap-1">
                <Text className="text-sm font-medium text-slate-500">费率编辑</Text>
                <Title level={4} className="!m-0">
                  设置钱包到账户划转手续费
                </Title>
              </div>
            </div>

            <Form<FormValues> form={form} layout="vertical" disabled={!canManage || loading}>
              <Form.Item
                label="固定费率（百分比）"
                name="feeRatePercent"
                rules={[
                  { required: true, message: "请输入手续费比例" },
                  {
                    validator: async (_, value) => {
                      if (value === undefined || value === null || Number.isNaN(Number(value))) {
                        throw new Error("请输入有效的手续费比例");
                      }
                      const numeric = Number(value);
                      if (numeric < 0 || numeric > 100) {
                        throw new Error("手续费比例需在 0 到 100 之间");
                      }
                    },
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  step={0.1}
                  precision={2}
                  addonAfter="%"
                  style={{ width: "100%" }}
                  placeholder="例如 1.00"
                />
              </Form.Item>
            </Form>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-800">保存格式</div>
              <div className="mt-2 font-mono text-xs text-slate-500">
                {`{"feeRate":"${(effectivePercent / 100).toFixed(6)}"}`}
              </div>
            </div>
          </div>
        </Card>

        <Card
          bordered={false}
          className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] shadow-sm"
          bodyStyle={{ padding: 24 }}
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <DollarOutlined />
              </div>
              <div className="flex flex-col gap-1">
                <Text className="text-sm font-medium text-emerald-700">影响预览</Text>
                <Title level={4} className="!m-0">
                  以 1000 为例的扣费效果
                </Title>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Statistic title="划转金额" value={1000} precision={2} />
              <Statistic title="手续费" value={(1000 * effectivePercent) / 100} precision={2} />
              <Statistic title="总扣减" value={1000 + (1000 * effectivePercent) / 100} precision={2} />
            </div>

            <div className="rounded-[22px] border border-emerald-100 bg-white px-4 py-4">
              <Title level={5} className="!mb-3 !mt-0">
                生效规则
              </Title>
              <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-slate-600">
                <li>手续费在钱包侧单独扣减，并单独记录一条资金流水。</li>
                <li>卡侧只增加主划转金额，不会把手续费计入卡余额。</li>
                <li>首页只展示主划转记录，但会在记录说明里带出手续费。</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
