import React, { useMemo, useState } from "react";
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  NotificationOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { TENANT_PERMISSION } from "@/constants/rbac";
import {
  notificationTemplateService,
  type CreateNotificationTemplatePayload,
  type NotificationTemplate,
  type UpdateNotificationTemplatePayload,
} from "@/services/notificationTemplateService";
import { useAuthStore } from "@/stores/authStore";

const { Paragraph, Text, Title } = Typography;

type ModalMode = "create" | "edit";

type TemplateFormValues = CreateNotificationTemplatePayload &
  UpdateNotificationTemplatePayload;

const EVENT_META: Record<
  string,
  {
    title: string;
    description: string;
    tagColor: string;
    variables: string[];
    defaultRoute: string;
    defaultTitle: Record<string, string>;
    defaultBody: Record<string, string>;
  }
> = {
  password_change_success: {
    title: "修改密码成功",
    description: "用户在 App 中成功修改登录密码后触发。",
    tagColor: "green",
    variables: ["occurredAt"],
    defaultRoute: "/settings/security",
    defaultTitle: {
      zh: "密码修改成功",
      en: "Password changed successfully",
    },
    defaultBody: {
      zh: "你的账户密码已于 {{.occurredAt}} 修改。如非本人操作，请立即重置密码并联系支持。",
      en: "Your account password was changed at {{.occurredAt}}. If this was not you, reset it immediately and contact support.",
    },
  },
  password_change_failed: {
    title: "修改密码失败",
    description: "用户尝试修改登录密码但校验失败时触发。",
    tagColor: "red",
    variables: ["reason", "occurredAt"],
    defaultRoute: "/settings/change-password",
    defaultTitle: {
      zh: "密码修改失败",
      en: "Password change failed",
    },
    defaultBody: {
      zh: "我们检测到一次密码修改失败尝试。原因：{{.reason}}。如非本人操作，请检查账户安全。",
      en: "We detected a failed password change attempt. Reason: {{.reason}}. If this was not you, please review your account security.",
    },
  },
  kyc_approved: {
    title: "KYC 审核通过",
    description: "租户后台审核通过用户 KYC 时触发。",
    tagColor: "blue",
    variables: ["occurredAt"],
    defaultRoute: "/settings/kyc",
    defaultTitle: {
      zh: "KYC 审核通过",
      en: "KYC approved",
    },
    defaultBody: {
      zh: "你的身份认证已通过，现在可以使用完整的钱包能力。",
      en: "Your identity verification has been approved. Full wallet capabilities are now available.",
    },
  },
  kyc_rejected: {
    title: "KYC 审核驳回",
    description: "租户后台驳回用户 KYC 时触发。",
    tagColor: "orange",
    variables: ["reason", "occurredAt"],
    defaultRoute: "/settings/kyc",
    defaultTitle: {
      zh: "KYC 审核未通过",
      en: "KYC not approved",
    },
    defaultBody: {
      zh: "你的身份认证未通过。原因：{{.reason}}。请补充资料后重新提交。",
      en: "Your identity verification was not approved. Reason: {{.reason}}. Please update your details and resubmit.",
    },
  },
  kyc_l2_approved: {
    title: "L2 人脸核验通过",
    description: "租户后台审核通过用户 L2 人脸 / 活体验证时触发。",
    tagColor: "cyan",
    variables: ["occurredAt"],
    defaultRoute: "/settings/kyc-l2",
    defaultTitle: {
      zh: "L2 人脸核验已通过",
      en: "L2 liveness approved",
    },
    defaultBody: {
      zh: "你的人脸核验已通过，可使用需要 L1 与 L2 均通过后才开放的功能。",
      en: "Your L2 liveness verification has been approved. Features requiring both L1 and L2 are now available.",
    },
  },
  kyc_l2_rejected: {
    title: "L2 人脸核验驳回",
    description: "租户后台驳回用户 L2 人脸 / 活体验证时触发。",
    tagColor: "volcano",
    variables: ["reason", "occurredAt"],
    defaultRoute: "/settings/kyc-l2",
    defaultTitle: {
      zh: "L2 人脸核验未通过",
      en: "L2 liveness not approved",
    },
    defaultBody: {
      zh: "你的人脸核验未通过。原因：{{.reason}}。请重新开始 L2 人脸核验。",
      en: "Your L2 liveness verification was not approved. Reason: {{.reason}}. Please restart L2 verification.",
    },
  },
};

const EVENT_OPTIONS = [
  { label: "全部事件", value: "all" },
  ...Object.entries(EVENT_META).map(([value, meta]) => ({
    label: meta.title,
    value,
  })),
];

const LOCALE_OPTIONS = [
  { label: "全部语言", value: "all" },
  { label: "中文", value: "zh" },
  { label: "English", value: "en" },
];

const FORM_LOCALE_OPTIONS = LOCALE_OPTIONS.filter(
  (item) => item.value !== "all",
);

const CHANNEL_OPTIONS = [{ label: "站内信", value: "in_app" }];

function getEventMeta(eventCode: string) {
  return (
    EVENT_META[eventCode] || {
      title: eventCode,
      description: "当前事件尚未配置说明。",
      tagColor: "default",
      variables: [],
      defaultRoute: "",
      defaultTitle: { zh: eventCode, en: eventCode },
      defaultBody: { zh: "", en: "" },
    }
  );
}

function getLocaleLabel(locale: string) {
  if (locale === "zh") return "中文";
  if (locale === "en") return "English";
  return locale || "-";
}

function getChannelLabel(channel: string) {
  if (channel === "in_app") return "站内信";
  if (channel === "push") return "Push";
  return channel || "-";
}

const NotificationTemplatePage: React.FC = () => {
  const [form] = Form.useForm<TemplateFormValues>();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) =>
    state.hasPermission(TENANT_PERMISSION.CONFIG_MANAGE),
  );

  const [eventFilter, setEventFilter] = useState<string>("all");
  const [localeFilter, setLocaleFilter] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("edit");
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const watchedEventCode = Form.useWatch("eventCode", form);
  const watchedLocale = Form.useWatch("locale", form);
  const watchedTitle = Form.useWatch("titleTemplate", form);
  const watchedBody = Form.useWatch("bodyTemplate", form);
  const watchedRoute = Form.useWatch("route", form);
  const watchedEnabled = Form.useWatch("enabled", form);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const response = await notificationTemplateService.getTemplates();
      return response.data || [];
    },
  });

  const templates = data || [];

  const syncDefaultsMutation = useMutation({
    mutationFn: () => notificationTemplateService.syncDefaultTemplates(),
    onSuccess: () => {
      message.success("默认模板已同步");
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
    },
    onError: (error) => {
      message.error(
        error instanceof Error ? error.message : "同步默认模板失败",
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateNotificationTemplatePayload) =>
      notificationTemplateService.createTemplate(payload),
    onSuccess: () => {
      message.success("模板已创建");
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      handleCloseModal();
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : "创建模板失败");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateNotificationTemplatePayload;
    }) => notificationTemplateService.updateTemplate(id, payload),
    onSuccess: () => {
      message.success("模板已更新");
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      handleCloseModal();
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : "更新模板失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationTemplateService.deleteTemplate(id),
    onSuccess: () => {
      message.success("模板已删除");
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : "删除模板失败");
    },
  });

  const filteredTemplates = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return templates.filter((item) => {
      if (eventFilter !== "all" && item.eventCode !== eventFilter) {
        return false;
      }
      if (localeFilter !== "all" && item.locale !== localeFilter) {
        return false;
      }
      if (!normalizedKeyword) {
        return true;
      }

      return [
        item.eventCode,
        getEventMeta(item.eventCode).title,
        item.titleTemplate,
        item.bodyTemplate,
        item.route || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedKeyword);
    });
  }, [eventFilter, keyword, localeFilter, templates]);

  const summary = useMemo(() => {
    return {
      total: templates.length,
      enabled: templates.filter((item) => item.enabled).length,
      events: new Set(templates.map((item) => item.eventCode)).size,
      locales: new Set(templates.map((item) => item.locale)).size,
    };
  }, [templates]);

  const applyEventPreset = (eventCode: string, locale: string) => {
    const meta = getEventMeta(eventCode);
    form.setFieldsValue({
      route: meta.defaultRoute,
      titleTemplate: watchedTitle?.trim()
        ? watchedTitle
        : meta.defaultTitle[locale] || meta.defaultTitle.zh,
      bodyTemplate: watchedBody?.trim()
        ? watchedBody
        : meta.defaultBody[locale] || meta.defaultBody.zh,
    });
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditing(null);
    form.setFieldsValue({
      eventCode: "password_change_success",
      locale: "zh",
      channel: "in_app",
      titleTemplate: EVENT_META.password_change_success.defaultTitle.zh,
      bodyTemplate: EVENT_META.password_change_success.defaultBody.zh,
      route: EVENT_META.password_change_success.defaultRoute,
      enabled: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: NotificationTemplate) => {
    setModalMode("edit");
    setEditing(record);
    form.setFieldsValue({
      eventCode: record.eventCode,
      locale: record.locale,
      channel: record.channel,
      titleTemplate: record.titleTemplate,
      bodyTemplate: record.bodyTemplate,
      route: record.route || "",
      enabled: record.enabled,
    });
    setModalOpen(true);
  };

  function handleCloseModal() {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === "create") {
        await createMutation.mutateAsync({
          eventCode: values.eventCode,
          locale: values.locale,
          channel: values.channel || "in_app",
          titleTemplate: values.titleTemplate.trim(),
          bodyTemplate: values.bodyTemplate.trim(),
          route: values.route?.trim() || "",
          enabled: Boolean(values.enabled),
        });
        return;
      }

      if (!editing) {
        return;
      }

      await updateMutation.mutateAsync({
        id: editing.id,
        payload: {
          titleTemplate: values.titleTemplate.trim(),
          bodyTemplate: values.bodyTemplate.trim(),
          route: values.route?.trim() || "",
          enabled: Boolean(values.enabled),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "事件模板",
        key: "event",
        render: (_: unknown, record: NotificationTemplate) => {
          const meta = getEventMeta(record.eventCode);
          return (
            <Space direction="vertical" size={2}>
              <Space size={8} wrap>
                <Tag color={meta.tagColor}>{meta.title}</Tag>
                <Tag>{getLocaleLabel(record.locale)}</Tag>
                <Tag>{getChannelLabel(record.channel)}</Tag>
              </Space>
              <Text type="secondary">{meta.description}</Text>
            </Space>
          );
        },
      },
      {
        title: "标题模板",
        dataIndex: "titleTemplate",
        key: "titleTemplate",
        render: (value: string) => (
          <Text ellipsis={{ tooltip: value }} style={{ maxWidth: 260 }}>
            {value}
          </Text>
        ),
      },
      {
        title: "正文模板",
        dataIndex: "bodyTemplate",
        key: "bodyTemplate",
        render: (value: string) => (
          <Paragraph
            ellipsis={{ rows: 2, tooltip: value }}
            style={{ marginBottom: 0, maxWidth: 420 }}
          >
            {value}
          </Paragraph>
        ),
      },
      {
        title: "路由与状态",
        key: "status",
        render: (_: unknown, record: NotificationTemplate) => (
          <Space direction="vertical" size={2}>
            <Text code>{record.route || "-"}</Text>
            <Tag color={record.enabled ? "success" : "default"}>
              {record.enabled ? "启用中" : "已停用"}
            </Tag>
          </Space>
        ),
      },
      {
        title: "版本",
        key: "version",
        render: (_: unknown, record: NotificationTemplate) => (
          <Space direction="vertical" size={2}>
            <Text>V{record.version}</Text>
            <Text type="secondary">
              {dayjs(record.updatedAt).format("YYYY-MM-DD HH:mm")}
            </Text>
          </Space>
        ),
      },
      {
        title: "操作",
        key: "actions",
        width: 180,
        render: (_: unknown, record: NotificationTemplate) =>
          canManage ? (
            <Space size={4} wrap>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="删除模板"
                description="删除后不会影响历史通知，但后续消息将回退到内置默认模板。"
                okText="删除"
                cancelText="取消"
                onConfirm={() => deleteMutation.mutate(record.id)}
              >
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleteMutation.isPending}
                >
                  删除
                </Button>
              </Popconfirm>
            </Space>
          ) : (
            <Tag icon={<EyeOutlined />} color="default">
              只读
            </Tag>
          ),
      },
    ],
    [canManage, deleteMutation],
  );

  const currentEventMeta = getEventMeta(
    watchedEventCode || editing?.eventCode || "password_change_success",
  );
  const modalLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[32px] border border-[#dbe8f6] bg-[linear-gradient(135deg,#f7fbff_0%,#edf4ff_45%,#ffffff_100%)] shadow-[0_24px_60px_rgba(37,99,235,0.08)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb_0%,#0ea5e9_42%,#93c5fd_100%)]" />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.34em] text-sky-700/70">
                Notification Studio
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <NotificationOutlined className="text-xl" />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0 }}>
                    消息通知模板
                  </Title>
                  <Text type="secondary">
                    管理密码修改、KYC 审核等消息通知文案与跳转路由。
                  </Text>
                </div>
              </div>
              <Paragraph className="mt-4 !mb-0 max-w-2xl text-sm leading-6 text-slate-600">
                模板只影响后续新生成的通知，历史通知会保留创建时的内容快照。当前版本先覆盖
                4 类核心事件， 你可以同步默认模板后再按租户需要做增删改。
              </Paragraph>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                  loading={isLoading}
                >
                  刷新模板
                </Button>
                {canManage ? (
                  <>
                    <Button
                      onClick={() => syncDefaultsMutation.mutate()}
                      loading={syncDefaultsMutation.isPending}
                    >
                      同步默认模板
                    </Button>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={openCreateModal}
                    >
                      新增模板
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "模板总数",
                  value: summary.total,
                  helper: "当前租户可见模板数",
                  icon: <AppstoreOutlined className="text-sky-600" />,
                  tone: "bg-sky-50",
                },
                {
                  label: "已启用",
                  value: summary.enabled,
                  helper: "会参与新通知渲染",
                  icon: <SafetyOutlined className="text-emerald-600" />,
                  tone: "bg-emerald-50",
                },
                {
                  label: "事件类型",
                  value: summary.events,
                  helper: "当前已配置事件数",
                  icon: <NotificationOutlined className="text-violet-600" />,
                  tone: "bg-violet-50",
                },
                {
                  label: "语言版本",
                  value: summary.locales,
                  helper: "默认支持中文和英文",
                  icon: <EditOutlined className="text-amber-600" />,
                  tone: "bg-amber-50",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-[24px] border border-slate-200 ${item.tone} px-4 py-4`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {item.label}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-slate-900">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.helper}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card
        bordered={false}
        className="rounded-[30px] border border-slate-200 bg-white shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[0.9fr_0.7fr_1fr_auto]">
          <Select
            options={EVENT_OPTIONS}
            value={eventFilter}
            onChange={setEventFilter}
          />
          <Select
            options={LOCALE_OPTIONS}
            value={localeFilter}
            onChange={setLocaleFilter}
          />
          <Input
            allowClear
            placeholder="搜索标题、正文、路由或事件名称"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Button
            onClick={() => {
              setEventFilter("all");
              setLocaleFilter("all");
              setKeyword("");
            }}
          >
            重置筛选
          </Button>
        </div>

        {filteredTemplates.length === 0 ? (
          <Empty
            description={
              templates.length === 0
                ? "当前租户还没有模板，请先同步默认模板或手动新增。"
                : "当前筛选条件下没有模板。"
            }
          >
            {canManage ? (
              <Space>
                <Button
                  onClick={() => syncDefaultsMutation.mutate()}
                  loading={syncDefaultsMutation.isPending}
                >
                  同步默认模板
                </Button>
                <Button
                  type="primary"
                  onClick={openCreateModal}
                  icon={<PlusOutlined />}
                >
                  新增模板
                </Button>
              </Space>
            ) : null}
          </Empty>
        ) : (
          <Table
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={filteredTemplates}
            locale={{
              emptyText: <Empty description="当前没有可展示的通知模板" />,
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
            scroll={{ x: 1280 }}
          />
        )}
      </Card>

      <Modal
        title={
          modalMode === "create"
            ? "新增模板"
            : `编辑模板 - ${editing ? getEventMeta(editing.eventCode).title : ""}`
        }
        open={modalOpen}
        onCancel={handleCloseModal}
        onOk={() => {
          void handleSubmit();
        }}
        confirmLoading={modalLoading}
        okText={modalMode === "create" ? "创建模板" : "保存模板"}
        cancelText="取消"
        width={960}
        destroyOnClose
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ enabled: true, locale: "zh", channel: "in_app" }}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Form.Item
                  name="eventCode"
                  label="事件类型"
                  rules={[{ required: true, message: "请选择事件类型" }]}
                >
                  <Select
                    disabled={modalMode === "edit"}
                    options={EVENT_OPTIONS.filter(
                      (item) => item.value !== "all",
                    )}
                    onChange={(value) =>
                      applyEventPreset(
                        value,
                        form.getFieldValue("locale") || "zh",
                      )
                    }
                  />
                </Form.Item>
                <Form.Item
                  name="locale"
                  label="语言"
                  rules={[{ required: true, message: "请选择语言" }]}
                >
                  <Select
                    disabled={modalMode === "edit"}
                    options={FORM_LOCALE_OPTIONS}
                    onChange={(value) =>
                      applyEventPreset(
                        form.getFieldValue("eventCode") ||
                          "password_change_success",
                        value,
                      )
                    }
                  />
                </Form.Item>
                <Form.Item name="channel" label="渠道">
                  <Select disabled options={CHANNEL_OPTIONS} />
                </Form.Item>
              </div>

              <Form.Item
                name="titleTemplate"
                label="标题模板"
                rules={[{ required: true, message: "请输入标题模板" }]}
              >
                <Input maxLength={120} showCount />
              </Form.Item>

              <Form.Item
                name="bodyTemplate"
                label="正文模板"
                rules={[{ required: true, message: "请输入正文模板" }]}
              >
                <Input.TextArea rows={6} maxLength={500} showCount />
              </Form.Item>

              <Form.Item name="route" label="跳转路由">
                <Input placeholder="/settings/security" />
              </Form.Item>

              <Form.Item
                name="enabled"
                label="启用状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
            </Form>
          </div>

          <div className="space-y-4">
            <Card size="small" className="border-slate-200">
              <Space direction="vertical" size={6}>
                <Space wrap size={[4, 4]}>
                  <Tag color={currentEventMeta.tagColor}>
                    {currentEventMeta.title}
                  </Tag>
                  <Tag>
                    {getLocaleLabel(watchedLocale || editing?.locale || "zh")}
                  </Tag>
                  <Tag>
                    {getChannelLabel(
                      form.getFieldValue("channel") ||
                        editing?.channel ||
                        "in_app",
                    )}
                  </Tag>
                </Space>
                <Text>{currentEventMeta.description}</Text>
                <Text type="secondary">
                  {modalMode === "edit" && editing
                    ? `当前版本：V${editing.version}`
                    : "新建模板时将从 V1 开始"}
                </Text>
              </Space>
            </Card>

            <Card size="small" title="可用变量">
              <Space wrap>
                {currentEventMeta.variables.length > 0 ? (
                  currentEventMeta.variables.map((variable) => (
                    <Tag key={variable} color="blue">
                      {`{{.${variable}}}`}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">当前事件暂无额外变量</Text>
                )}
              </Space>
            </Card>

            <Card size="small" title="模板预览">
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <Text strong>{watchedTitle || "通知标题预览"}</Text>
                    <Tag color={watchedEnabled ? "success" : "default"}>
                      {watchedEnabled ? "启用中" : "已停用"}
                    </Tag>
                  </div>
                  <Paragraph style={{ marginBottom: 0, marginTop: 12 }}>
                    {watchedBody || "通知正文预览"}
                  </Paragraph>
                  <Text type="secondary">跳转路由：{watchedRoute || "-"}</Text>
                </div>
                <Text type="secondary">
                  预览仅展示当前模板内容，不会回写历史通知。
                </Text>
              </Space>
            </Card>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NotificationTemplatePage;
