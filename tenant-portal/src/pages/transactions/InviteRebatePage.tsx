import React, { useEffect, useMemo, useState } from "react";
import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  ProfileOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  SyncOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { FormInstance } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { TENANT_PERMISSION } from "@/constants/rbac";
import { inviteRebateService } from "@/services";
import { useAuthStore } from "@/stores/authStore";
import type {
  InviteRebateConfig,
  InviteRebateEvent,
  InviteRebateProfile,
  InviteRebateSettlement,
  UpdateInviteRebateConfigRequest,
  UpsertInviteRebateProfileRequest,
} from "@shared/types";

const { Title, Text, Paragraph } = Typography;

export type InviteRebateSection = "config" | "profiles" | "events" | "settlements";

interface InviteRebatePageProps {
  section?: InviteRebateSection;
}

type ConfigFormValues = {
  enabled: boolean;
  currency: string;
  consumeSettleDays: number;
  openCardDirectRate: number;
  openCardIndirectRate: number;
  consumeDirectRate: number;
  consumeIndirectRate: number;
};

type ProfileFormValues = {
  userId: string;
  profileType: string;
  status: number;
  openCardDirectRate?: number | null;
  openCardIndirectRate?: number | null;
  consumeDirectRate?: number | null;
  consumeIndirectRate?: number | null;
  consumeSettleDays?: number | null;
  remark?: string;
};

type Metric = {
  key: string;
  label: string;
  value: string | number;
  description: string;
  icon?: React.ReactNode;
  iconClassName?: string;
};

const SECTION_META: Record<
  InviteRebateSection,
  { title: string; heroLabel: string; description: string; heroGradient: string }
> = {
  config: {
    title: "返佣配置",
    heroLabel: "INVITE REBATE CONFIG",
    description: "维护默认返佣开关、比例和消费返佣结算规则，作为当前业务的默认配置口径。",
    heroGradient: "bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_58%,#38bdf8_100%)]",
  },
  profiles: {
    title: "专属档案",
    heroLabel: "INVITE REBATE PROFILE CENTER",
    description: "面向 KOL、合作方等特殊账户单独覆盖返佣比例和结算规则，并支持独立权限控制。",
    heroGradient: "bg-[linear-gradient(135deg,#134e4a_0%,#0f766e_52%,#14b8a6_100%)]",
  },
  events: {
    title: "返佣事件",
    heroLabel: "INVITE REBATE EVENT CENTER",
    description: "跟踪返佣触发、层级关系和结算状态，返佣失败只记事件，不回滚主链路。",
    heroGradient: "bg-[linear-gradient(135deg,#1e293b_0%,#334155_54%,#0f766e_100%)]",
  },
  settlements: {
    title: "结算记录",
    heroLabel: "INVITE REBATE SETTLEMENT CENTER",
    description: "查看返佣实际入账记录，并支持手动执行已到期的消费返佣结算。",
    heroGradient: "bg-[linear-gradient(135deg,#7c2d12_0%,#b45309_48%,#f59e0b_100%)]",
  },
};

const RULE_ITEMS = [
  "开卡返佣按 L1 KYC 通过 + 成功购卡触发，实时入账。",
  "消费返佣按卡消费结算金额计算，按 T+N 结算。",
  "当前仅向上追溯两级邀请关系，统一以 USDT 结算。",
  "返佣链路失败只记事件，不反向阻断开卡或消费主链路。",
];

function formatDateTime(value?: string | null) {
  return value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-";
}

function formatPercent(rate?: string | null) {
  if (!rate) return "-";
  const value = Number(rate);
  return Number.isNaN(value) ? rate : `${Number((value * 100).toFixed(4))}%`;
}

function formatAmount(value?: string | number | null, precision = 2) {
  if (value == null || value === "") return "-";
  const amount = Number(value);
  return Number.isNaN(amount) ? String(value) : amount.toFixed(precision).replace(/\.?0+$/, "");
}

function rateToPercent(rate?: string | null) {
  if (!rate) return undefined;
  const value = Number(rate);
  return Number.isNaN(value) ? undefined : Number((value * 100).toFixed(4));
}

function percentToRate(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return undefined;
  return (Number(value) / 100).toFixed(8).replace(/\.?0+$/, "");
}

function trimOptionalText(value?: string | null) {
  const next = value?.trim();
  return next ? next : undefined;
}

function profileTypeLabel(value?: string) {
  return value === "custom" ? "专属档案" : "默认档案";
}

function rebateTypeTag(value: string) {
  if (value === "CARD_OPEN") return <Tag color="blue">开卡返佣</Tag>;
  if (value === "CARD_CONSUME") return <Tag color="purple">消费返佣</Tag>;
  return <Tag>{value}</Tag>;
}

function settleModeTag(value: string) {
  if (value === "REALTIME") return <Tag color="success">实时结算</Tag>;
  if (value === "T_PLUS_N") return <Tag color="gold">T+N 结算</Tag>;
  return <Tag>{value}</Tag>;
}

function eventStatusTag(value: string) {
  if (value === "PENDING") return <Tag color="processing">待结算</Tag>;
  if (value === "SETTLED") return <Tag color="success">已结算</Tag>;
  return <Tag>{value}</Tag>;
}

function profileStatusTag(status: number) {
  return status === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>;
}

function applyConfigForm(form: FormInstance<ConfigFormValues>, data: InviteRebateConfig) {
  form.setFieldsValue({
    enabled: data.enabled,
    currency: data.currency || "USDT",
    consumeSettleDays: data.consumeSettleDays ?? 0,
    openCardDirectRate: rateToPercent(data.openCardDirectRate) ?? 0,
    openCardIndirectRate: rateToPercent(data.openCardIndirectRate) ?? 0,
    consumeDirectRate: rateToPercent(data.consumeDirectRate) ?? 0,
    consumeIndirectRate: rateToPercent(data.consumeIndirectRate) ?? 0,
  });
}

function buildProfileFormValues(data: InviteRebateProfile): ProfileFormValues {
  return {
    userId: data.userId,
    profileType: data.id ? data.profileType || "custom" : "custom",
    status: data.status ?? 1,
    openCardDirectRate: rateToPercent(data.openCardDirectRate),
    openCardIndirectRate: rateToPercent(data.openCardIndirectRate),
    consumeDirectRate: rateToPercent(data.consumeDirectRate),
    consumeIndirectRate: rateToPercent(data.consumeIndirectRate),
    consumeSettleDays: data.consumeSettleDays ?? null,
    remark: data.remark || "",
  };
}

function Hero({ meta, stats, onRefresh }: { meta: (typeof SECTION_META)[InviteRebateSection]; stats: Metric[]; onRefresh: () => void }) {
  return (
    <Card bordered={false} className="overflow-hidden rounded-2xl shadow-sm">
      <div className={`relative overflow-hidden rounded-2xl ${meta.heroGradient}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_36%)]" />
        <div className="relative grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-7">
          <div className="space-y-4 text-white">
            <Space size={10} wrap>
              <Tag className="!m-0 rounded-full border-0 bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white">
                {meta.heroLabel}
              </Tag>
              <span className="text-sm text-white/75">UStarPay 后台业务模块</span>
            </Space>
            <div className="space-y-2">
              <Title level={3} className="!mb-0 !text-white">{meta.title}</Title>
              <Paragraph className="!mb-0 max-w-3xl !text-slate-100/90">{meta.description}</Paragraph>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {stats.map((item) => (
                <div key={item.key} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="text-xs text-white/70">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</div>
                  <div className="mt-1 text-xs text-white/70">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/25 bg-white/85 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <AuditOutlined />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">业务口径</div>
                <div className="text-base font-semibold text-slate-900">一期执行规则</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {RULE_ITEMS.map((item) => (
                <div key={item} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{item}</div>
              ))}
            </div>
            <Button icon={<ReloadOutlined />} className="mt-4" onClick={onRefresh}>刷新当前工作台</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function OverviewCard({ item }: { item: Metric }) {
  return (
    <Card bordered={false} className="rounded-2xl shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${item.iconClassName || "bg-slate-100 text-slate-700"}`}>
          {item.icon}
        </div>
        <div className="flex-1">
          <div className="text-sm text-slate-500">{item.label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{item.value}</div>
          <div className="mt-1 text-sm text-slate-500">{item.description}</div>
        </div>
      </div>
    </Card>
  );
}

const InviteRebatePage: React.FC<InviteRebatePageProps> = ({ section = "config" }) => {
  const meta = SECTION_META[section];
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.INVITE_REBATES_MANAGE));
  const [configForm] = Form.useForm<ConfigFormValues>();
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileLookupLoading, setProfileLookupLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState<InviteRebateProfile | null>(null);
  const [loadedProfile, setLoadedProfile] = useState<InviteRebateProfile | null>(null);
  const [settlementLimit, setSettlementLimit] = useState(50);
  const [profileFilters, setProfileFilters] = useState({ page: 1, pageSize: 10, search: "", profileType: "", status: "" });
  const [eventFilters, setEventFilters] = useState({ page: 1, pageSize: 10, search: "", rebateType: "", status: "", settleMode: "", relationLevel: "" });
  const [settlementFilters, setSettlementFilters] = useState({ page: 1, pageSize: 10, search: "", status: "" });

  const configQuery = useQuery({ queryKey: ["invite-rebate-config"], queryFn: () => inviteRebateService.getConfig() });
  const profilesQuery = useQuery({
    queryKey: ["invite-rebate-profiles", profileFilters],
    queryFn: () => inviteRebateService.listProfiles({ ...profileFilters, search: trimOptionalText(profileFilters.search), profileType: profileFilters.profileType || undefined, status: profileFilters.status || undefined }),
    enabled: section === "profiles",
  });
  const eventsQuery = useQuery({
    queryKey: ["invite-rebate-events", eventFilters],
    queryFn: () => inviteRebateService.listEvents({ ...eventFilters, search: trimOptionalText(eventFilters.search), rebateType: eventFilters.rebateType || undefined, status: eventFilters.status || undefined, settleMode: eventFilters.settleMode || undefined, relationLevel: eventFilters.relationLevel || undefined }),
    enabled: section === "events",
  });
  const settlementsQuery = useQuery({
    queryKey: ["invite-rebate-settlements", settlementFilters],
    queryFn: () => inviteRebateService.listSettlements({ ...settlementFilters, search: trimOptionalText(settlementFilters.search), status: settlementFilters.status || undefined }),
    enabled: section === "settlements",
  });

  useEffect(() => {
    if (configQuery.data) applyConfigForm(configForm, configQuery.data);
  }, [configForm, configQuery.data]);

  useEffect(() => {
    if (section !== "profiles" && profileModalOpen) {
      setProfileModalOpen(false);
      setEditingProfile(null);
      setLoadedProfile(null);
      profileForm.resetFields();
    }
  }, [profileForm, profileModalOpen, section]);

  const currentConfig = configQuery.data;
  const profileItems = profilesQuery.data?.data?.items || [];
  const profileTotal = profilesQuery.data?.data?.total || 0;
  const eventItems = eventsQuery.data?.data?.items || [];
  const eventTotal = eventsQuery.data?.data?.total || 0;
  const settlementItems = settlementsQuery.data?.data?.items || [];
  const settlementTotal = settlementsQuery.data?.data?.total || 0;

  const configPreview = [
    ["开卡一级", formatPercent(currentConfig?.openCardDirectRate)],
    ["开卡二级", formatPercent(currentConfig?.openCardIndirectRate)],
    ["消费一级", formatPercent(currentConfig?.consumeDirectRate)],
    ["消费二级", formatPercent(currentConfig?.consumeIndirectRate)],
  ];

  const enabledProfileCount = profileItems.filter((item) => Number(item.status) === 1).length;
  const customProfileCount = profileItems.filter((item) => item.profileType === "custom").length;
  const pendingEventCount = eventItems.filter((item) => item.status === "PENDING").length;
  const settledEventCount = eventItems.filter((item) => item.status === "SETTLED").length;
  const realtimeEventCount = eventItems.filter((item) => item.settleMode === "REALTIME").length;
  const tPlusEventCount = eventItems.filter((item) => item.settleMode === "T_PLUS_N").length;
  const levelOneEventCount = eventItems.filter((item) => Number(item.relationLevel) === 1).length;
  const settlementAmount = settlementItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const updateConfigMutation = useMutation({
    mutationFn: (payload: UpdateInviteRebateConfigRequest) => inviteRebateService.updateConfig(payload),
    onSuccess: (data) => {
      message.success("返佣配置已更新");
      queryClient.setQueryData(["invite-rebate-config"], data);
      applyConfigForm(configForm, data);
    },
    onError: (error: Error) => message.error(error.message || "返佣配置更新失败"),
  });

  const upsertProfileMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpsertInviteRebateProfileRequest }) =>
      inviteRebateService.upsertProfile(userId, payload),
    onSuccess: () => {
      message.success("专属档案已保存");
      setProfileModalOpen(false);
      setEditingProfile(null);
      setLoadedProfile(null);
      profileForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: ["invite-rebate-profiles"] });
    },
    onError: (error: Error) => message.error(error.message || "专属档案保存失败"),
  });

  const runSettlementMutation = useMutation({
    mutationFn: (limit: number) => inviteRebateService.runSettlement({ limit }),
    onSuccess: (data) => {
      message.success(`本次结算完成 ${data.settledCount} 条记录`);
      void queryClient.invalidateQueries({ queryKey: ["invite-rebate-events"] });
      void queryClient.invalidateQueries({ queryKey: ["invite-rebate-settlements"] });
    },
    onError: (error: Error) => message.error(error.message || "执行结算失败"),
  });

  const resetProfileDetailFields = () => {
    profileForm.setFieldsValue({
      profileType: "custom",
      status: 1,
      openCardDirectRate: null,
      openCardIndirectRate: null,
      consumeDirectRate: null,
      consumeIndirectRate: null,
      consumeSettleDays: null,
      remark: "",
    });
  };

  const refreshCurrentSection = () => {
    if (section === "config") return void configQuery.refetch();
    if (section === "profiles") return void profilesQuery.refetch();
    if (section === "events") return void eventsQuery.refetch();
    return void settlementsQuery.refetch();
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setEditingProfile(null);
    setLoadedProfile(null);
    profileForm.resetFields();
  };

  const loadProfileByUserId = async (userIdParam?: string, silent?: boolean) => {
    const userId = trimOptionalText(userIdParam || profileForm.getFieldValue("userId"));
    if (!userId) {
      message.warning("请先输入用户 ID");
      return;
    }
    setProfileLookupLoading(true);
    try {
      const data = await inviteRebateService.getProfile(userId);
      setLoadedProfile(data);
      profileForm.setFieldsValue(buildProfileFormValues(data));
      if (!silent) {
        message.success(data.id ? "已加载用户返佣档案" : "已找到用户，可新建专属档案");
      }
    } catch (error) {
      setLoadedProfile(null);
      resetProfileDetailFields();
      if (!silent) {
        message.error(error instanceof Error ? error.message : "用户档案查询失败");
      }
    } finally {
      setProfileLookupLoading(false);
    }
  };

  const openCreateProfileModal = () => {
    setEditingProfile(null);
    setLoadedProfile(null);
    setProfileModalOpen(true);
    profileForm.setFieldsValue({
      userId: "",
      profileType: "custom",
      status: 1,
      openCardDirectRate: null,
      openCardIndirectRate: null,
      consumeDirectRate: null,
      consumeIndirectRate: null,
      consumeSettleDays: null,
      remark: "",
    });
  };

  const openEditProfileModal = (record: InviteRebateProfile) => {
    setEditingProfile(record);
    setLoadedProfile(record);
    setProfileModalOpen(true);
    profileForm.setFieldsValue(buildProfileFormValues(record));
    void loadProfileByUserId(record.userId, true);
  };

  const handleSaveConfig = async () => {
    const values = await configForm.validateFields();
    const payload: UpdateInviteRebateConfigRequest = {
      enabled: values.enabled,
      currency: (values.currency || "USDT").trim().toUpperCase(),
      consumeSettleDays: Number(values.consumeSettleDays ?? 0),
      openCardDirectRate: percentToRate(values.openCardDirectRate) || "0",
      openCardIndirectRate: percentToRate(values.openCardIndirectRate) || "0",
      consumeDirectRate: percentToRate(values.consumeDirectRate) || "0",
      consumeIndirectRate: percentToRate(values.consumeIndirectRate) || "0",
    };
    await updateConfigMutation.mutateAsync(payload);
  };

  const handleSaveProfile = async () => {
    const values = await profileForm.validateFields();
    const userId = trimOptionalText(values.userId);
    if (!userId) {
      message.warning("请输入用户 ID");
      return;
    }
    const payload: UpsertInviteRebateProfileRequest = {
      profileType: values.profileType,
      status: Number(values.status ?? 1),
      openCardDirectRate: percentToRate(values.openCardDirectRate),
      openCardIndirectRate: percentToRate(values.openCardIndirectRate),
      consumeDirectRate: percentToRate(values.consumeDirectRate),
      consumeIndirectRate: percentToRate(values.consumeIndirectRate),
      consumeSettleDays: values.consumeSettleDays == null ? undefined : Number(values.consumeSettleDays),
      remark: trimOptionalText(values.remark),
    };
    await upsertProfileMutation.mutateAsync({ userId, payload });
  };

  const heroStats: Metric[] =
    section === "config"
      ? [
          { key: "status", label: "模块状态", value: currentConfig?.enabled ? "已启用" : "未启用", description: "按当前业务配置控制返佣是否生效" },
          { key: "currency", label: "结算币种", value: currentConfig?.currency || "USDT", description: "当前一期统一使用 USDT 返佣" },
          { key: "settle", label: "消费结算", value: `T+${currentConfig?.consumeSettleDays ?? 0}`, description: "消费返佣按结算日批量入账" },
        ]
      : section === "profiles"
        ? [
            { key: "profiles-total", label: "档案总数", value: profileTotal, description: "当前筛选条件下的专属档案总量" },
            { key: "profiles-enabled", label: "当前页启用", value: enabledProfileCount, description: "便于快速确认当前生效的专属配置" },
            { key: "profiles-settle", label: "默认消费结算", value: `T+${currentConfig?.consumeSettleDays ?? 0}`, description: "档案未覆盖时继续走默认配置" },
          ]
        : section === "events"
          ? [
              { key: "events-total", label: "事件总数", value: eventTotal, description: "开卡返佣和消费返佣统一沉淀到事件流水" },
              { key: "events-pending", label: "当前页待结算", value: pendingEventCount, description: "主要关注 T+N 到期前后的待处理数据" },
              { key: "events-settled", label: "当前页已结算", value: settledEventCount, description: "实时返佣和已完成批量结算的结果" },
            ]
          : [
              { key: "settlements-total", label: "记录总数", value: settlementTotal, description: "返佣成功入账后的结算流水" },
              { key: "settlements-amount", label: "当前页结算额", value: `${formatAmount(settlementAmount)} ${currentConfig?.currency || "USDT"}`, description: "基于当前页列表的已结算金额汇总" },
              { key: "settlements-limit", label: "批量上限", value: settlementLimit, description: "手动执行时单次最多处理的到期事件数" },
            ];

  const overviewMetrics: Metric[] =
    section === "config"
      ? [
          { key: "open-direct", label: "开卡一级返佣", value: formatPercent(currentConfig?.openCardDirectRate), description: "直接上级在成功购卡后实时返佣", icon: <DollarCircleOutlined />, iconClassName: "bg-sky-50 text-sky-600" },
          { key: "open-indirect", label: "开卡二级返佣", value: formatPercent(currentConfig?.openCardIndirectRate), description: "间接上级按二级关系分佣", icon: <TeamOutlined />, iconClassName: "bg-cyan-50 text-cyan-600" },
          { key: "consume-direct", label: "消费一级返佣", value: formatPercent(currentConfig?.consumeDirectRate), description: "按卡消费结算金额计算返佣", icon: <ClockCircleOutlined />, iconClassName: "bg-violet-50 text-violet-600" },
          { key: "consume-indirect", label: "消费二级返佣", value: formatPercent(currentConfig?.consumeIndirectRate), description: "与一级返佣一起进入 T+N 批量结算", icon: <ProfileOutlined />, iconClassName: "bg-amber-50 text-amber-600" },
        ]
      : section === "profiles"
        ? [
            { key: "profiles-custom", label: "当前页专属档案", value: customProfileCount, description: "用于覆盖默认返佣比例的用户数量", icon: <UserOutlined />, iconClassName: "bg-emerald-50 text-emerald-600" },
            { key: "profiles-page", label: "当前页记录数", value: profileItems.length, description: "本页实际加载的档案数量", icon: <ProfileOutlined />, iconClassName: "bg-teal-50 text-teal-600" },
            { key: "profiles-currency", label: "返佣币种", value: currentConfig?.currency || "USDT", description: "专属档案只覆盖比例和结算天数，不改结算币种", icon: <DollarCircleOutlined />, iconClassName: "bg-sky-50 text-sky-600" },
          ]
        : section === "events"
          ? [
              { key: "events-realtime", label: "实时结算事件", value: realtimeEventCount, description: "通常对应开卡返佣，落库后即可入账", icon: <CheckCircleOutlined />, iconClassName: "bg-emerald-50 text-emerald-600" },
              { key: "events-t-plus", label: "T+N 事件", value: tPlusEventCount, description: "主要对应消费返佣，等待到期后结算", icon: <ClockCircleOutlined />, iconClassName: "bg-amber-50 text-amber-600" },
              { key: "events-level-one", label: "一级关系事件", value: levelOneEventCount, description: "当前页中直接上级获得返佣的事件数", icon: <TeamOutlined />, iconClassName: "bg-sky-50 text-sky-600" },
            ]
          : [
              { key: "settlements-page", label: "当前页记录数", value: settlementItems.length, description: "用于确认分页和筛选后的结算结果", icon: <ProfileOutlined />, iconClassName: "bg-amber-50 text-amber-600" },
              { key: "settlements-symbol", label: "结算币种", value: currentConfig?.currency || "USDT", description: "当前一期结算仅支持资金账户 USDT 入账", icon: <DollarCircleOutlined />, iconClassName: "bg-orange-50 text-orange-600" },
              { key: "settlements-status", label: "当前筛选状态", value: settlementFilters.status || "全部", description: "用于检查结算成功记录或放大某类流水", icon: <SettingOutlined />, iconClassName: "bg-slate-100 text-slate-700" },
            ];

  const profileColumns: ColumnsType<InviteRebateProfile> = [
    {
      title: "用户信息",
      key: "user",
      width: 260,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{record.userName || record.userId}</Text>
          <Text type="secondary">{record.userEmail || "-"}</Text>
          <Text copyable={{ text: record.userId }} style={{ fontSize: 12 }}>{record.userId}</Text>
        </Space>
      ),
    },
    {
      title: "档案属性",
      key: "meta",
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Tag color={record.profileType === "custom" ? "cyan" : "default"}>{profileTypeLabel(record.profileType)}</Tag>
          {profileStatusTag(record.status)}
        </Space>
      ),
    },
    {
      title: "开卡返佣",
      key: "openCard",
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text>一级：{formatPercent(record.openCardDirectRate)}</Text>
          <Text type="secondary">二级：{formatPercent(record.openCardIndirectRate)}</Text>
        </Space>
      ),
    },
    {
      title: "消费返佣",
      key: "consume",
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text>一级：{formatPercent(record.consumeDirectRate)}</Text>
          <Text type="secondary">二级：{formatPercent(record.consumeIndirectRate)}</Text>
        </Space>
      ),
    },
    {
      title: "结算规则",
      key: "settle",
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text>{record.consumeSettleDays == null ? "跟随默认配置" : `T+${record.consumeSettleDays}`}</Text>
          <Text type="secondary">{record.remark || "-"}</Text>
        </Space>
      ),
    },
    { title: "更新时间", dataIndex: "updatedAt", key: "updatedAt", width: 180, render: (value?: string) => formatDateTime(value) },
    {
      title: "操作",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => <Button type="link" disabled={!canManage} onClick={() => openEditProfileModal(record)}>编辑</Button>,
    },
  ];

  const eventColumns: ColumnsType<InviteRebateEvent> = [
    {
      title: "返佣来源",
      key: "source",
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {rebateTypeTag(record.rebateType)}
          <Text copyable={{ text: record.sourceEventKey }} style={{ fontSize: 12 }}>{record.sourceEventKey}</Text>
        </Space>
      ),
    },
    {
      title: "邀请链路",
      key: "relation",
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{record.sourceUserName || record.sourceUserId}</Text>
          <Text type="secondary">受益人：{record.beneficiaryUserName || record.beneficiaryUserId}</Text>
          <Tag color={record.relationLevel === 1 ? "blue" : "geekblue"}>{record.relationLevel === 1 ? "直接上级" : "间接上级"}</Tag>
        </Space>
      ),
    },
    {
      title: "返佣金额",
      key: "amount",
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text>来源：{record.sourceAmount} {record.sourceCurrency}</Text>
          <Text type="secondary">比例：{formatPercent(record.rebateRate)}</Text>
          <Text strong>返佣：{record.rebateAmount} {record.currency}</Text>
        </Space>
      ),
    },
    {
      title: "结算方式",
      key: "settle",
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {settleModeTag(record.settleMode)}
          <Text type="secondary">{record.settleMode === "T_PLUS_N" ? `T+${record.settleDays}` : "实时入账"}</Text>
          <Text type="secondary">应结算：{formatDateTime(record.settleAt)}</Text>
        </Space>
      ),
    },
    {
      title: "状态",
      key: "status",
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {eventStatusTag(record.status)}
          <Text type="secondary">{formatDateTime(record.settledAt || record.createdAt)}</Text>
        </Space>
      ),
    },
  ];

  const settlementColumns: ColumnsType<InviteRebateSettlement> = [
    {
      title: "受益用户",
      key: "beneficiary",
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{record.beneficiaryUserName || record.beneficiaryUserId}</Text>
          <Text type="secondary">{record.beneficiaryUserEmail || "-"}</Text>
          <Text copyable={{ text: record.beneficiaryUserId }} style={{ fontSize: 12 }}>{record.beneficiaryUserId}</Text>
        </Space>
      ),
    },
    {
      title: "返佣来源",
      key: "source",
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {record.rebateType ? rebateTypeTag(record.rebateType) : <Tag>未知</Tag>}
          <Text copyable={{ text: record.sourceEventKey || record.eventId }} style={{ fontSize: 12 }}>{record.sourceEventKey || record.eventId}</Text>
        </Space>
      ),
    },
    {
      title: "结算金额",
      key: "amount",
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{record.amount} {record.symbol}</Text>
          <Tag color="success">{record.status}</Tag>
        </Space>
      ),
    },
    {
      title: "到账信息",
      key: "fund",
      width: 240,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text copyable={{ text: record.accountId || "" }} style={{ fontSize: 12 }}>资金账户：{record.accountId || "-"}</Text>
          <Text copyable={{ text: record.fundFlowRecordId || "" }} style={{ fontSize: 12 }}>资金流水：{record.fundFlowRecordId || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "时间",
      key: "time",
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text>结算：{formatDateTime(record.settledAt)}</Text>
          <Text type="secondary">创建：{formatDateTime(record.createdAt)}</Text>
        </Space>
      ),
    },
  ];

  const sectionContent =
    section === "config" ? (
      <Spin spinning={configQuery.isLoading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card bordered={false} className="rounded-2xl shadow-sm" title="默认返佣配置">
              <Form form={configForm} layout="vertical">
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item label="启用返佣" name="enabled" valuePropName="checked">
                      <Switch disabled={!canManage} checkedChildren="启用" unCheckedChildren="停用" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="返佣币种" name="currency" rules={[{ required: true, message: "请确认返佣币种" }]}>
                      <Input disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="消费结算天数（T+N）" name="consumeSettleDays" rules={[{ required: true, message: "请输入消费结算天数" }]}>
                      <InputNumber min={0} max={365} precision={0} style={{ width: "100%" }} disabled={!canManage} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="开卡一级返佣比例（%）" name="openCardDirectRate" rules={[{ required: true, message: "请输入开卡一级返佣比例" }]}>
                      <InputNumber min={0} max={100} precision={4} style={{ width: "100%" }} disabled={!canManage} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="开卡二级返佣比例（%）" name="openCardIndirectRate" rules={[{ required: true, message: "请输入开卡二级返佣比例" }]}>
                      <InputNumber min={0} max={100} precision={4} style={{ width: "100%" }} disabled={!canManage} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="消费一级返佣比例（%）" name="consumeDirectRate" rules={[{ required: true, message: "请输入消费一级返佣比例" }]}>
                      <InputNumber min={0} max={100} precision={4} style={{ width: "100%" }} disabled={!canManage} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="消费二级返佣比例（%）" name="consumeIndirectRate" rules={[{ required: true, message: "请输入消费二级返佣比例" }]}>
                      <InputNumber min={0} max={100} precision={4} style={{ width: "100%" }} disabled={!canManage} />
                    </Form.Item>
                  </Col>
                </Row>
                {!canManage ? (
                  <Alert type="warning" showIcon message="当前账号只有查看权限" description="如需修改返佣配置，请为当前账号补充 invite_rebates:manage 权限。" />
                ) : null}
                <div className="mt-4 flex justify-end">
                  <Button type="primary" icon={<SaveOutlined />} loading={updateConfigMutation.isPending} onClick={() => void handleSaveConfig()}>
                    保存默认配置
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
          <Col xs={24} xl={8}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card bordered={false} className="rounded-2xl shadow-sm" title="默认比例快照">
                <div className="grid gap-3 sm:grid-cols-2">
                  {configPreview.map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-4">
                      <div className="text-xs text-slate-500">{label}</div>
                      <div className="mt-1 text-base font-semibold text-slate-900">{value}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card bordered={false} className="rounded-2xl shadow-sm" title="配置说明">
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 p-4">开卡返佣命中后实时入账，消费返佣由结算任务按 T+N 到期执行。</div>
                  <div className="rounded-xl bg-slate-50 p-4">专属档案仅在用户命中时覆盖默认比例，未命中继续使用本页配置。</div>
                  <div className="rounded-xl bg-slate-50 p-4">当前返佣模块采用独立权限控制，保持既有架构不变。</div>
                </div>
              </Card>
            </Space>
          </Col>
        </Row>
      </Spin>
    ) : section === "profiles" ? (
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card bordered={false} className="rounded-2xl shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-900">专属档案执行说明</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>1. 先按用户 ID 查询并确认用户存在且可配置。</div>
                <div>2. 专属档案只覆盖返佣比例和消费结算天数，结算币种继续走默认配置。</div>
                <div>3. 停用档案后自动回退默认返佣配置，不影响既有邀请关系。</div>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5">
              <div className="text-sm font-semibold text-slate-900">当前默认口径</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>返佣币种：{currentConfig?.currency || "USDT"}</div>
                <div>消费结算：T+{currentConfig?.consumeSettleDays ?? 0}</div>
                <div>最大追溯层级：2 级</div>
              </div>
            </div>
          </div>
        </Card>
        <Card bordered={false} className="rounded-2xl shadow-sm" title="专属返佣档案" extra={<Text type="secondary">共 {profileTotal} 条</Text>}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={8}>
                <Input allowClear value={profileFilters.search} prefix={<SearchOutlined />} placeholder="按用户 ID / 用户名 / 邮箱搜索" onChange={(event) => setProfileFilters((prev) => ({ ...prev, page: 1, search: event.target.value }))} />
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Select value={profileFilters.profileType} options={[{ value: "", label: "全部档案类型" }, { value: "standard", label: "默认档案" }, { value: "custom", label: "专属档案" }]} onChange={(value) => setProfileFilters((prev) => ({ ...prev, page: 1, profileType: value }))} />
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Select value={profileFilters.status} options={[{ value: "", label: "全部状态" }, { value: "1", label: "启用" }, { value: "0", label: "停用" }]} onChange={(value) => setProfileFilters((prev) => ({ ...prev, page: 1, status: value }))} />
              </Col>
              <Col xs={24} lg={8} className="flex justify-end">
                <Space wrap>
                  <Button icon={<ReloadOutlined />} onClick={() => void profilesQuery.refetch()}>刷新</Button>
                  <Button type="primary" disabled={!canManage} onClick={openCreateProfileModal}>新增专属档案</Button>
                </Space>
              </Col>
            </Row>
            <Table rowKey={(record) => record.id || record.userId} loading={profilesQuery.isLoading} columns={profileColumns} dataSource={profileItems} locale={{ emptyText: <Empty description="暂无专属返佣档案" /> }} scroll={{ x: 1280 }} pagination={{ current: profileFilters.page, pageSize: profileFilters.pageSize, total: profileTotal, showSizeChanger: true, onChange: (page, pageSize) => setProfileFilters((prev) => ({ ...prev, page, pageSize })) }} />
          </Space>
        </Card>
      </Space>
    ) : section === "events" ? (
      <Card bordered={false} className="rounded-2xl shadow-sm" title="返佣事件流水" extra={<Text type="secondary">共 {eventTotal} 条</Text>}>
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Input allowClear value={eventFilters.search} prefix={<SearchOutlined />} placeholder="按来源事件 / 用户 ID 搜索" onChange={(event) => setEventFilters((prev) => ({ ...prev, page: 1, search: event.target.value }))} />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select value={eventFilters.rebateType} options={[{ value: "", label: "全部返佣类型" }, { value: "CARD_OPEN", label: "开卡返佣" }, { value: "CARD_CONSUME", label: "消费返佣" }]} onChange={(value) => setEventFilters((prev) => ({ ...prev, page: 1, rebateType: value }))} />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select value={eventFilters.status} options={[{ value: "", label: "全部状态" }, { value: "PENDING", label: "待结算" }, { value: "SETTLED", label: "已结算" }]} onChange={(value) => setEventFilters((prev) => ({ ...prev, page: 1, status: value }))} />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select value={eventFilters.settleMode} options={[{ value: "", label: "全部结算方式" }, { value: "REALTIME", label: "实时结算" }, { value: "T_PLUS_N", label: "T+N 结算" }]} onChange={(value) => setEventFilters((prev) => ({ ...prev, page: 1, settleMode: value }))} />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Select value={eventFilters.relationLevel} options={[{ value: "", label: "全部层级" }, { value: "1", label: "一级关系" }, { value: "2", label: "二级关系" }]} onChange={(value) => setEventFilters((prev) => ({ ...prev, page: 1, relationLevel: value }))} />
            </Col>
          </Row>
          <Table rowKey="id" loading={eventsQuery.isLoading} columns={eventColumns} dataSource={eventItems} locale={{ emptyText: <Empty description="暂无返佣事件" /> }} scroll={{ x: 1280 }} pagination={{ current: eventFilters.page, pageSize: eventFilters.pageSize, total: eventTotal, showSizeChanger: true, onChange: (page, pageSize) => setEventFilters((prev) => ({ ...prev, page, pageSize })) }} />
        </Space>
      </Card>
    ) : (
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card bordered={false} className="rounded-2xl shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} xl={12}>
              <Text strong>手动执行到期结算</Text>
              <div className="mt-1 text-sm text-slate-500">只处理当前范围内已到期且未结算的消费返佣事件，不影响原始开卡或消费链路。</div>
            </Col>
            <Col xs={24} xl={12}>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <InputNumber min={1} max={500} precision={0} value={settlementLimit} onChange={(value) => setSettlementLimit(typeof value === "number" ? value : 50)} style={{ minWidth: 160 }} disabled={!canManage} />
                <Button type="primary" icon={<SyncOutlined />} disabled={!canManage} loading={runSettlementMutation.isPending} onClick={() => void runSettlementMutation.mutateAsync(settlementLimit)}>执行到期结算</Button>
              </div>
            </Col>
          </Row>
        </Card>
        <Card bordered={false} className="rounded-2xl shadow-sm" title="返佣结算记录" extra={<Text type="secondary">共 {settlementTotal} 条</Text>}>
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <Input allowClear value={settlementFilters.search} prefix={<SearchOutlined />} placeholder="按事件 ID / 用户 ID / 流水 ID 搜索" onChange={(event) => setSettlementFilters((prev) => ({ ...prev, page: 1, search: event.target.value }))} />
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Select value={settlementFilters.status} options={[{ value: "", label: "全部状态" }, { value: "SUCCESS", label: "结算成功" }]} onChange={(value) => setSettlementFilters((prev) => ({ ...prev, page: 1, status: value }))} />
              </Col>
              <Col xs={24} lg={10} className="flex justify-end">
                <Button icon={<ReloadOutlined />} onClick={() => void settlementsQuery.refetch()}>刷新</Button>
              </Col>
            </Row>
            <Table rowKey="id" loading={settlementsQuery.isLoading} columns={settlementColumns} dataSource={settlementItems} locale={{ emptyText: <Empty description="暂无返佣结算记录" /> }} scroll={{ x: 1180 }} pagination={{ current: settlementFilters.page, pageSize: settlementFilters.pageSize, total: settlementTotal, showSizeChanger: true, onChange: (page, pageSize) => setSettlementFilters((prev) => ({ ...prev, page, pageSize })) }} />
          </Space>
        </Card>
      </Space>
    );

  return (
    <div className="space-y-6">
      <Hero meta={meta} stats={heroStats} onRefresh={refreshCurrentSection} />
      <Row gutter={[16, 16]}>
        {overviewMetrics.map((item) => (
          <Col key={item.key} xs={24} md={12} xl={24 / overviewMetrics.length}>
            <OverviewCard item={item} />
          </Col>
        ))}
      </Row>
      {sectionContent}
      <Modal title={editingProfile ? "编辑专属返佣档案" : "新增专属返佣档案"} open={profileModalOpen} width={820} destroyOnClose confirmLoading={profileLookupLoading || upsertProfileMutation.isPending} onCancel={closeProfileModal} onOk={() => void handleSaveProfile()}>
        <Form form={profileForm} layout="vertical" onValuesChange={(changedValues) => {
          if (Object.prototype.hasOwnProperty.call(changedValues, "userId") && !editingProfile) {
            setLoadedProfile(null);
            resetProfileDetailFields();
          }
        }}>
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item label="用户 ID" name="userId" rules={[{ required: true, message: "请输入用户 ID" }]}>
                <Input disabled={!!editingProfile} placeholder="请输入用户 ID" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label=" " colon={false}>
                <Button block icon={<UserOutlined />} loading={profileLookupLoading} onClick={() => void loadProfileByUserId()}>查询用户档案</Button>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Alert type={loadedProfile ? "info" : "warning"} showIcon message={loadedProfile ? "用户信息已加载" : "请先确认用户，再保存专属档案"} description={loadedProfile ? `用户：${loadedProfile.userName || loadedProfile.userId}；邮箱：${loadedProfile.userEmail || "-"}；当前档案：${profileTypeLabel(loadedProfile.profileType)}` : "新增专属档案前，需要先确认用户存在且可配置。"} />
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="档案类型" name="profileType" rules={[{ required: true, message: "请选择档案类型" }]}>
                <Select options={[{ value: "custom", label: "专属档案" }, { value: "standard", label: "默认档案" }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="状态" name="status" rules={[{ required: true, message: "请选择状态" }]}>
                <Select options={[{ value: 1, label: "启用" }, { value: 0, label: "停用" }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="开卡一级返佣比例（%）" name="openCardDirectRate">
                <InputNumber min={0} max={100} precision={4} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="开卡二级返佣比例（%）" name="openCardIndirectRate">
                <InputNumber min={0} max={100} precision={4} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="消费一级返佣比例（%）" name="consumeDirectRate">
                <InputNumber min={0} max={100} precision={4} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="消费二级返佣比例（%）" name="consumeIndirectRate">
                <InputNumber min={0} max={100} precision={4} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="消费结算天数（T+N）" name="consumeSettleDays">
                <InputNumber min={0} max={365} precision={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="备注" name="remark">
                <Input.TextArea rows={3} maxLength={255} showCount placeholder="留空表示无额外说明" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default InviteRebatePage;
