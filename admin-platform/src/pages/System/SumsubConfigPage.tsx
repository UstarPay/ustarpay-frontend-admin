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
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import { ApiOutlined, ReloadOutlined, SafetyCertificateOutlined, SaveOutlined } from "@ant-design/icons";
import { Helmet } from "react-helmet-async";

import { sumsubConfigApi, type SumsubConfigView } from "@/services/apis/sumsubConfigApi";
import { useAuthStore } from "@/stores/authStore";

const { Paragraph, Text, Title } = Typography;

type FormValues = {
  appToken?: string;
  secretKey?: string;
  baseUrl: string;
  sandboxEnabled: boolean;
  l2LevelName: string;
  webhookSecret?: string;
  websdkTtlSecs: number;
};

const SumsubConfigPage: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const canManage = useAuthStore((state) => state.hasPermission("system:settings"));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SumsubConfigView | null>(null);

  const applyConfigToForm = useCallback(
    (next: SumsubConfigView) => {
      setConfig(next);
      form.setFieldsValue({
        appToken: "",
        secretKey: "",
        baseUrl: next.baseUrl,
        sandboxEnabled: next.sandboxEnabled,
        l2LevelName: next.l2LevelName,
        webhookSecret: "",
        websdkTtlSecs: next.websdkTtlSecs,
      });
    },
    [form],
  );

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const next = await sumsubConfigApi.getConfig();
      applyConfigToForm(next);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载 Sumsub 配置失败");
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
      setSaving(true);
      const payload = {
        baseUrl: values.baseUrl.trim(),
        sandboxEnabled: !!values.sandboxEnabled,
        l2LevelName: values.l2LevelName.trim(),
        websdkTtlSecs: Number(values.websdkTtlSecs),
        ...(values.appToken?.trim() ? { appToken: values.appToken.trim() } : {}),
        ...(values.secretKey?.trim() ? { secretKey: values.secretKey.trim() } : {}),
        ...(values.webhookSecret?.trim() ? { webhookSecret: values.webhookSecret.trim() } : {}),
      };
      const next = await sumsubConfigApi.updateConfig(payload);
      applyConfigToForm(next);
      message.success("Sumsub 配置已保存");
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return;
      }
      message.error(error instanceof Error ? error.message : "保存 Sumsub 配置失败");
    } finally {
      setSaving(false);
    }
  }, [applyConfigToForm, form]);

  const statusTags = useMemo(
    () => [
      {
        label: "App Token",
        configured: !!config?.appTokenConfigured,
        masked: config?.appToken || "未配置",
      },
      {
        label: "Secret Key",
        configured: !!config?.secretKeyConfigured,
        masked: config?.secretKey || "未配置",
      },
      {
        label: "Webhook Secret",
        configured: !!config?.webhookSecretConfigured,
        masked: config?.webhookSecret || "未配置",
      },
    ],
    [config],
  );

  if (!canManage) {
    return (
      <Card>
        <Alert
          type="error"
          showIcon
          message="权限不足"
          description="当前账号没有管理平台级 Sumsub 配置的权限。"
        />
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sumsub 配置 - NH资产钱包托管系统</title>
      </Helmet>

      <div className="flex flex-col gap-6 p-6">
        <Card
          bordered={false}
          className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#111827_52%,#155e75_100%)] text-white shadow-[0_26px_80px_rgba(8,47,73,0.24)]"
          bodyStyle={{ padding: 0 }}
        >
          <div className="relative overflow-hidden px-6 py-6 lg:px-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.18),transparent_34%)]" />
            <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-[0.34em] text-cyan-100/80">
                  Platform Integration
                </div>
                <div className="flex flex-col gap-2">
                  <Title level={2} className="!m-0 !text-white">
                    Sumsub 对接配置
                  </Title>
                  <Paragraph className="!m-0 !text-sm !leading-6 !text-slate-200">
                    统一管理平台级 Sumsub 令牌、密钥、Webhook 密钥、L2 级别名称和 SDK 有效期。保存后，认证服务会优先使用后台配置，未配置时再回退到本地环境变量。
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
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => void handleSave()}
                    className="h-9 rounded-full bg-cyan-300 px-4 text-slate-950 shadow-none hover:!bg-cyan-200 hover:!text-slate-950"
                  >
                    保存配置
                  </Button>
                </Space>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {statusTags.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</div>
                      <Tag color={item.configured ? "success" : "default"}>
                        {item.configured ? "已配置" : "未配置"}
                      </Tag>
                    </div>
                    <div className="mt-3 break-all font-mono text-sm text-white">{item.masked}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Alert
          type="info"
          showIcon
          message="敏感字段留空即保留原值"
          description="App Token、Secret Key、Webhook Secret 在页面中只显示脱敏结果。保存时如保持为空，后台会继续沿用当前已生效的值，不会把密钥清空。"
          className="rounded-[22px] border border-cyan-100 bg-cyan-50/80"
        />

        <Card
          bordered={false}
          className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
          bodyStyle={{ padding: 24 }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <SafetyCertificateOutlined />
            </div>
            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-slate-500">Credential & Runtime</Text>
              <Title level={4} className="!m-0">
                平台级认证参数
              </Title>
            </div>
          </div>

          <Form<FormValues>
            form={form}
            layout="vertical"
            disabled={loading}
            initialValues={{
              baseUrl: "https://api.sumsub.com",
              sandboxEnabled: true,
              l2LevelName: "",
              websdkTtlSecs: 1800,
            }}
          >
            <Row gutter={16}>
              <Col xs={24} xl={12}>
                <Form.Item label="App Token" name="appToken">
                  <Input.Password
                    placeholder={config?.appTokenConfigured ? "留空则保留当前 App Token" : "请输入 Sumsub App Token"}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} xl={12}>
                <Form.Item label="Secret Key" name="secretKey">
                  <Input.Password
                    placeholder={config?.secretKeyConfigured ? "留空则保留当前 Secret Key" : "请输入 Sumsub Secret Key"}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} xl={12}>
                <Form.Item
                  label="Webhook Secret"
                  name="webhookSecret"
                  extra="如未单独配置，服务端会自动回退到 Secret Key 作为验签密钥。"
                >
                  <Input.Password
                    placeholder={config?.webhookSecretConfigured ? "留空则保留当前 Webhook Secret" : "可选，建议单独配置"}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} xl={12}>
                <Form.Item
                  label="Base URL"
                  name="baseUrl"
                  rules={[{ required: true, message: "请输入 Sumsub Base URL" }]}
                >
                  <Input prefix={<ApiOutlined />} placeholder="https://api.sumsub.com" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="L2 Level 名称"
                  name="l2LevelName"
                  rules={[{ required: true, message: "请输入 L2 Level 名称" }]}
                >
                  <Input placeholder="例如 test-l2" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="WebSDK TTL（秒）"
                  name="websdkTtlSecs"
                  rules={[{ required: true, message: "请输入 WebSDK TTL" }]}
                >
                  <InputNumber min={60} max={86400} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Sandbox 模式"
              name="sandboxEnabled"
              valuePropName="checked"
              extra="关闭后将按正式环境口径与 Sumsub 通信，请确认令牌和级别配置已切换。"
            >
              <Switch checkedChildren="Sandbox" unCheckedChildren="Production" />
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default SumsubConfigPage;
