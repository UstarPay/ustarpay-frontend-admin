import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  FilterOutlined,
  GlobalOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { TENANT_PERMISSION } from "@/constants/rbac";
import {
  kycCountryFilterService,
  type CountryOption,
  type TenantKYCCountryFilter,
} from "@/services/kycCountryFilterService";
import { useAuthStore } from "@/stores/authStore";

const { Paragraph, Text, Title } = Typography;

type FormValues = TenantKYCCountryFilter;

function normalizeCodes(values?: string[]) {
  return Array.from(
    new Set(
      (values || [])
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean),
    ),
  ).sort();
}

function countryLabel(country: CountryOption) {
  return `${country.nameZh || country.nameEn} / ${country.alpha3}`;
}

function renderSelectionTags(
  title: string,
  description: string,
  codes: string[],
  countryMap: Map<string, CountryOption>,
  color: string,
  onRemove: (code: string) => void,
  removable: boolean,
) {
  return (
    <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Text className="text-sm font-semibold text-slate-800">{title}</Text>
          <Text className="text-xs leading-5 text-slate-500">{description}</Text>
        </div>
        <Tag color={color}>{codes.length} 项</Tag>
      </div>

      {codes.length ? (
        <div className="flex flex-wrap gap-2">
          {codes.map((code) => {
            const matched = countryMap.get(code);
            return (
              <Tag
                key={`${title}-${code}`}
                color={color}
                closable={removable}
                onClose={(event) => {
                  event.preventDefault();
                  onRemove(code);
                }}
                className="rounded-full px-3 py-1 text-xs"
              >
                {matched ? countryLabel(matched) : code}
              </Tag>
            );
          })}
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无已选地区" />
      )}
    </div>
  );
}

export default function KycCountryFilterPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const canManage = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.CONFIG_MANAGE));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [search, setSearch] = useState("");

  const allowAlpha3 = Form.useWatch("allowAlpha3", form) || [];
  const denyAlpha3 = Form.useWatch("denyAlpha3", form) || [];

  const countryMap = useMemo(() => {
    const next = new Map<string, CountryOption>();
    countries.forEach((country) => {
      next.set(country.alpha3, country);
    });
    return next;
  }, [countries]);

  const loadCountries = useCallback(async () => {
    try {
      setCountriesLoading(true);
      const response = await kycCountryFilterService.listCountries();
      setCountries(response.data || []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "地区列表加载失败");
      setCountries([]);
    } finally {
      setCountriesLoading(false);
    }
  }, []);

  const loadFilter = useCallback(async () => {
    try {
      setLoading(true);
      const response = await kycCountryFilterService.getFilter();
      form.resetFields();
      form.setFieldsValue({
        allowAlpha3: normalizeCodes(response.data?.allowAlpha3),
        denyAlpha3: normalizeCodes(response.data?.denyAlpha3),
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "L1 地区配置加载失败");
      form.setFieldsValue({ allowAlpha3: [], denyAlpha3: [] });
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void Promise.all([loadCountries(), loadFilter()]);
  }, [loadCountries, loadFilter]);

  const filteredCountries = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return countries;
    }

    return countries.filter((country) => {
      const haystacks = [
        country.nameZh,
        country.nameEn,
        country.alpha2,
        country.alpha3,
        country.numericCode,
      ]
        .filter(Boolean)
        .map((item) => item.toLowerCase());

      return haystacks.some((item) => item.includes(keyword));
    });
  }, [countries, search]);

  const updateFormCodes = useCallback(
    (patch: Partial<FormValues>) => {
      form.setFieldsValue({
        allowAlpha3: normalizeCodes(patch.allowAlpha3 ?? allowAlpha3),
        denyAlpha3: normalizeCodes(patch.denyAlpha3 ?? denyAlpha3),
      });
    },
    [allowAlpha3, denyAlpha3, form],
  );

  const addToAllow = useCallback(
    (code: string) => {
      updateFormCodes({
        allowAlpha3: [...allowAlpha3.filter((item) => item !== code), code],
        denyAlpha3: denyAlpha3.filter((item) => item !== code),
      });
    },
    [allowAlpha3, denyAlpha3, updateFormCodes],
  );

  const addToDeny = useCallback(
    (code: string) => {
      updateFormCodes({
        allowAlpha3: allowAlpha3.filter((item) => item !== code),
        denyAlpha3: [...denyAlpha3.filter((item) => item !== code), code],
      });
    },
    [allowAlpha3, denyAlpha3, updateFormCodes],
  );

  const removeFromAllow = useCallback(
    (code: string) => {
      updateFormCodes({
        allowAlpha3: allowAlpha3.filter((item) => item !== code),
      });
    },
    [allowAlpha3, updateFormCodes],
  );

  const removeFromDeny = useCallback(
    (code: string) => {
      updateFormCodes({
        denyAlpha3: denyAlpha3.filter((item) => item !== code),
      });
    },
    [denyAlpha3, updateFormCodes],
  );

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        allowAlpha3: normalizeCodes(values.allowAlpha3),
        denyAlpha3: normalizeCodes(values.denyAlpha3),
      };
      await kycCountryFilterService.updateFilter(payload);
      await loadFilter();
      message.success("L1 地区配置已保存");
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  }, [form, loadFilter]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border-0 bg-[linear-gradient(140deg,#0f172a_0%,#1d4ed8_52%,#0f766e_100%)] text-white shadow-[0_24px_70px_rgba(15,118,110,0.22)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(147,197,253,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.10),transparent_24%)]" />
          <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <Space wrap size={[12, 12]} className="justify-between">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate("/tenant-users/kyc")}
                  className="h-9 rounded-full border-white/15 bg-white/10 px-4 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
                >
                  返回 KYC列表
                </Button>
                <div className="text-[11px] uppercase tracking-[0.34em] text-sky-100/80">L1 Region Config</div>
              </Space>
              <div className="flex flex-col gap-2">
                <Title level={2} className="!m-0 !text-white">
                  L1 地区配置
                </Title>
                <Paragraph className="!m-0 !text-sm !leading-6 !text-slate-200">
                  该配置仅影响 App 端 L1 第二步的地区选择范围，不影响注册页、个人资料页和其他地区接口。
                </Paragraph>
              </div>
              <Space wrap>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => void Promise.all([loadCountries(), loadFilter()])}
                  loading={loading || countriesLoading}
                  className="h-9 rounded-full border-white/15 bg-white/10 px-4 text-white hover:!border-white/30 hover:!bg-white/15 hover:!text-white"
                >
                  刷新配置
                </Button>
                {canManage ? (
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => void handleSave()}
                    loading={saving}
                    className="h-9 rounded-full bg-emerald-400 px-4 text-slate-950 shadow-none hover:!bg-emerald-300 hover:!text-slate-950"
                  >
                    保存地区规则
                  </Button>
                ) : null}
              </Space>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Regions</div>
                <div className="mt-3 text-2xl font-semibold text-white">{countries.length}</div>
                <div className="mt-1 text-xs text-slate-200">当前可配置地区总数</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Search Result</div>
                <div className="mt-3 text-2xl font-semibold text-white">{filteredCountries.length}</div>
                <div className="mt-1 text-xs text-slate-200">当前搜索命中地区数</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Allow List</div>
                <div className="mt-3 text-2xl font-semibold text-white">{allowAlpha3.length}</div>
                <div className="mt-1 text-xs text-slate-200">白名单为空时默认全开放</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-300">Deny List</div>
                <div className="mt-3 text-2xl font-semibold text-white">{denyAlpha3.length}</div>
                <div className="mt-1 text-xs text-slate-200">黑名单始终优先生效</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Alert
        type="info"
        showIcon
        message="地区规则说明"
        description="白名单为空时，App L1 第二步默认展示全部有效地区，再扣除黑名单；当某个地区同时存在于白名单和黑名单时，黑名单优先。"
        className="rounded-[22px] border border-sky-100 bg-sky-50/80"
      />

      <Card
        bordered={false}
        className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <GlobalOutlined />
            </div>
            <div className="flex flex-col gap-1">
              <Text className="text-sm font-medium text-slate-500">地区搜索</Text>
              <Title level={4} className="!m-0">
                按中文、英文或代码筛选地区
              </Title>
            </div>
          </div>

          <Input
            allowClear
            prefix={<FilterOutlined className="text-slate-400" />}
            placeholder="输入中国 / China / CN / CHN"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={countriesLoading}
          />

          <Form<FormValues> form={form} initialValues={{ allowAlpha3: [], denyAlpha3: [] }}>
            <Form.Item name="allowAlpha3" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="denyAlpha3" hidden>
              <Input />
            </Form.Item>
          </Form>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <Text className="text-sm font-semibold text-slate-800">候选地区</Text>
                  <div className="text-xs text-slate-500">点击加入允许列表或禁止列表</div>
                </div>
                {countriesLoading ? <Spin size="small" /> : null}
              </div>

              <div className="flex max-h-[620px] flex-col gap-3 overflow-y-auto pr-1">
                {!countriesLoading && filteredCountries.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的地区" />
                ) : null}

                {filteredCountries.map((country) => {
                  const inAllow = allowAlpha3.includes(country.alpha3);
                  const inDeny = denyAlpha3.includes(country.alpha3);
                  return (
                    <div
                      key={country.alpha3}
                      className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <Text className="text-sm font-semibold text-slate-800">{country.nameZh || country.nameEn}</Text>
                          <Text className="text-xs text-slate-500">
                            {country.nameEn} · {country.alpha2} / {country.alpha3}
                          </Text>
                        </div>
                        <Space size={8}>
                          <Button
                            size="small"
                            type={inAllow ? "default" : "primary"}
                            icon={<PlusCircleOutlined />}
                            onClick={() => addToAllow(country.alpha3)}
                            disabled={!canManage}
                          >
                            {inAllow ? "已允许" : "允许"}
                          </Button>
                          <Button
                            size="small"
                            danger={!inDeny}
                            icon={<MinusCircleOutlined />}
                            onClick={() => addToDeny(country.alpha3)}
                            disabled={!canManage}
                          >
                            {inDeny ? "已禁止" : "禁止"}
                          </Button>
                        </Space>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {renderSelectionTags(
                "允许地区",
                "仅当白名单非空时生效；这里的地区会作为 L1 第二步的候选范围。",
                allowAlpha3,
                countryMap,
                "green",
                removeFromAllow,
                canManage,
              )}
              {renderSelectionTags(
                "禁止地区",
                "黑名单优先级最高，即使同一地区已在允许列表中，也不会返回给 App。",
                denyAlpha3,
                countryMap,
                "red",
                removeFromDeny,
                canManage,
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
