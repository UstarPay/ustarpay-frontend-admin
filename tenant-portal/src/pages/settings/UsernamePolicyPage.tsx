import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Empty, Form, Input, Space, Tag, Typography, message } from "antd";
import { ReloadOutlined, SafetyOutlined, SettingOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { TENANT_PERMISSION } from "@/constants/rbac";
import { usernamePolicyService, type TenantUsernamePolicy } from "@/services/usernamePolicyService";
import { useAuthStore } from "@/stores/authStore";

const { Paragraph, Text, Title } = Typography;

type UsernamePolicyFormValues = {
  customExact: string;
  customFragments: string;
};

function joinTerms(values?: string[]) {
  return (values || []).join("\n");
}

function splitTerms(value?: string) {
  return (value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderTerms(items: string[], color: string) {
  if (!items.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无内容" />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Tag key={`${color}-${item}`} color={color} className="rounded-full px-3 py-1 text-xs">
          {item}
        </Tag>
      ))}
    </div>
  );
}

function PolicySection({
  title,
  description,
  items,
  color,
}: {
  title: string;
  description: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Text className="text-sm font-semibold text-slate-800">{title}</Text>
          <Text className="text-xs leading-5 text-slate-500">{description}</Text>
        </div>
        <Tag color={color}>{items.length} 项</Tag>
      </div>
      {renderTerms(items, color)}
    </div>
  );
}

const UsernamePolicyPage: React.FC = () => {
  const [form] = Form.useForm<UsernamePolicyFormValues>();
  const location = useLocation();
  const canManage = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.CONFIG_MANAGE));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<TenantUsernamePolicy | null>(null);

  const syncForm = useCallback(
    (nextPolicy: TenantUsernamePolicy | null) => {
      form.resetFields();
      form.setFieldsValue({
        customExact: joinTerms(nextPolicy?.customExact),
        customFragments: joinTerms(nextPolicy?.customFragments),
      });
    },
    [form],
  );

  const loadPolicy = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usernamePolicyService.getPolicy();
      const nextPolicy = response.data || null;
      setPolicy(nextPolicy);
      syncForm(nextPolicy);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载用户名规则失败");
    } finally {
      setLoading(false);
    }
  }, [syncForm]);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy, location.pathname]);

  const customExactDraft = Form.useWatch("customExact", form) || "";
  const customFragmentDraft = Form.useWatch("customFragments", form) || "";

  const stats = useMemo(
    () => ({
      systemExact: policy?.systemExact.length || 0,
      systemFragments: policy?.systemFragments.length || 0,
      customExactSaved: policy?.customExact.length || 0,
      customFragmentsSaved: policy?.customFragments.length || 0,
      customExactDraft: splitTerms(customExactDraft).length,
      customFragmentsDraft: splitTerms(customFragmentDraft).length,
    }),
    [customExactDraft, customFragmentDraft, policy],
  );

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const response = await usernamePolicyService.updatePolicy({
        customExact: splitTerms(values.customExact),
        customFragments: splitTerms(values.customFragments),
      });
      const nextPolicy = response.data || null;
      setPolicy(nextPolicy);
      syncForm(nextPolicy);
      message.success("用户名违规规则已更新");
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  }, [form, syncForm]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[32px] border-0 bg-[linear-gradient(140deg,#0f172a_0%,#1e293b_52%,#115e59_100%)] text-white shadow-[0_24px_70px_rgba(17,94,89,0.25)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,234,212,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.10),transparent_26%)]" />
          <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col gap-4 rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.34em] text-teal-100/80">Username Governance</div>
              <div className="flex flex-col gap-2">
                <Title level={2} className="!m-0 !text-white">
                  用户名违规规则
                </Title>
                <Paragraph className="!m-0 !text-sm !leading-6 !text-slate-200">
                  系统基础红线始终生效，这里只维护租户自定义的精确违规词和片段违规词。保存后，后台新增用户、App
                  注册和 App 个人信息修改都会统一按这套规则校验。
                </Paragraph>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadPolicy}
                  loading={loading}
                  className="h-9 rounded-full border-white/15 bg-white/10 px-4 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
                >
                  刷新规则
                </Button>
                {canManage ? (
                  <Button
                    type="primary"
                    icon={<SettingOutlined />}
                    onClick={handleSave}
                    loading={saving}
                    className="h-9 rounded-full bg-emerald-500 px-4 shadow-none hover:!bg-emerald-400"
                  >
                    保存配置
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "系统精确词", value: stats.systemExact },
                { label: "系统片段词", value: stats.systemFragments },
                { label: "已保存自定义精确词", value: stats.customExactSaved },
                { label: "已保存自定义片段词", value: stats.customFragmentsSaved },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.label}</div>
                  <div className="mt-3 text-2xl font-semibold text-white">{item.value}</div>
                  <div className="mt-1 text-xs text-slate-200">当前已生效规则数量</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Alert
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        message="系统基础词库不可关闭"
        description="UStarPay 品牌、核心支付品牌、涉黄涉暴恐等基础红线由系统统一维护；后台这里只追加租户自定义违规词，避免误操作放开底线规则。"
        className="rounded-[24px] border border-sky-100 bg-sky-50/80"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.08fr]">
        <Card
          bordered={false}
          className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
          bodyStyle={{ padding: 24 }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-slate-500">已生效规则</Text>
              <Title level={4} className="!m-0">
                当前命中的完整词库
              </Title>
            </div>

            <PolicySection
              title="系统精确保留词"
              description="完全匹配即拦截，适合后台账号、客服、政府机构等高风险身份词。"
              items={policy?.systemExact || []}
              color="blue"
            />
            <PolicySection
              title="系统片段词"
              description="用户名只要包含这些片段就会拦截，适合品牌词和敏感片段。"
              items={policy?.systemFragments || []}
              color="geekblue"
            />
            <PolicySection
              title="自定义精确违规词"
              description="租户新增的完全匹配违规词，保存后这里会立即展示。"
              items={policy?.customExact || []}
              color="gold"
            />
            <PolicySection
              title="自定义片段违规词"
              description="租户新增的片段违规词，保存后这里会立即展示。"
              items={policy?.customFragments || []}
              color="purple"
            />
          </div>
        </Card>

        <Card
          bordered={false}
          className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] shadow-sm"
          bodyStyle={{ padding: 24 }}
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Text className="text-sm font-medium text-emerald-700">租户自定义词库</Text>
              <Title level={4} className="!m-0">
                精确词与片段词分开维护
              </Title>
              <Paragraph className="!m-0 !text-sm !leading-6 !text-slate-500">
                一行一个词。精确词适合完整黑名单用户名；片段词适合品牌、名人、机构简称等需要模糊拦截的场景。
              </Paragraph>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-emerald-100 bg-white px-4 py-4 shadow-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-600">Draft</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{stats.customExactDraft}</div>
                <div className="mt-1 text-xs text-slate-500">当前编辑中的精确词数量</div>
              </div>
              <div className="rounded-[22px] border border-emerald-100 bg-white px-4 py-4 shadow-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-600">Draft</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{stats.customFragmentsDraft}</div>
                <div className="mt-1 text-xs text-slate-500">当前编辑中的片段词数量</div>
              </div>
            </div>

            <Form form={form} layout="vertical" disabled={!canManage || loading}>
              <Form.Item
                label="自定义精确违规词"
                name="customExact"
                extra="一行一个。适合直接禁止完整用户名，例如 fakeofficial、vipservice。"
                rules={[
                  {
                    validator: async (_, value) => {
                      if (splitTerms(value).length > 200) {
                        throw new Error("自定义精确词最多 200 项");
                      }
                    },
                  },
                ]}
              >
                <Input.TextArea
                  rows={8}
                  placeholder={"例如：\nustaradmin\nvipservice"}
                  allowClear
                  className="rounded-2xl"
                />
              </Form.Item>

              <Form.Item
                label="自定义片段违规词"
                name="customFragments"
                extra="一行一个。适合禁止品牌词、敏感片段或名人简称，例如 visa、elon、gov。"
                rules={[
                  {
                    validator: async (_, value) => {
                      if (splitTerms(value).length > 200) {
                        throw new Error("自定义片段词最多 200 项");
                      }
                    },
                  },
                ]}
              >
                <Input.TextArea
                  rows={8}
                  placeholder={"例如：\nvisa\nelon"}
                  allowClear
                  className="rounded-2xl"
                />
              </Form.Item>

              <Space size={12}>
                <Button onClick={loadPolicy} loading={loading}>
                  重新加载
                </Button>
                {canManage ? (
                  <Button type="primary" onClick={handleSave} loading={saving}>
                    保存配置
                  </Button>
                ) : null}
              </Space>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UsernamePolicyPage;
