import React, { useMemo, useState } from "react";
import {
  BellOutlined,
  EyeOutlined,
  ReloadOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  notificationRecordService,
  type NotificationDeliveryRecord,
  type NotificationRecord,
  type NotificationUserSummary,
} from "@/services/notificationRecordService";

const { Paragraph, Text, Title } = Typography;
const { RangePicker } = DatePicker;

type UserQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  startDate: string;
  endDate: string;
};

type RecordQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  eventCode: string;
  readStatus: string;
  deliveryStatus: string;
  startDate: string;
  endDate: string;
};

const defaultUserParams: UserQueryParams = {
  page: 1,
  pageSize: 20,
  search: "",
  startDate: "",
  endDate: "",
};

const defaultRecordParams: RecordQueryParams = {
  page: 1,
  pageSize: 20,
  search: "",
  eventCode: "all",
  readStatus: "all",
  deliveryStatus: "all",
  startDate: "",
  endDate: "",
};

const EVENT_META: Record<string, { label: string; color: string }> = {
  password_change_success: { label: "修改密码成功", color: "green" },
  password_change_failed: { label: "修改密码失败", color: "red" },
  kyc_approved: { label: "KYC 审核通过", color: "blue" },
  kyc_rejected: { label: "KYC 审核驳回", color: "orange" },
};

const eventOptions = [
  { label: "全部事件", value: "all" },
  ...Object.entries(EVENT_META).map(([value, meta]) => ({
    label: meta.label,
    value,
  })),
];

const readStatusOptions = [
  { label: "全部阅读状态", value: "all" },
  { label: "未读", value: "unread" },
  { label: "已读", value: "read" },
];

const deliveryStatusOptions = [
  { label: "全部投递状态", value: "all" },
  { label: "仅站内信", value: "in_app_only" },
  { label: "待处理", value: "pending" },
  { label: "已受理", value: "accepted" },
  { label: "已送达", value: "delivered" },
  { label: "失败", value: "failed" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}

function getEventMeta(eventCode: string) {
  return EVENT_META[eventCode] || { label: eventCode || "-", color: "default" };
}

function renderSeverityTag(severity: string) {
  switch (severity) {
    case "success":
      return <Tag color="success">成功</Tag>;
    case "warning":
      return <Tag color="warning">警告</Tag>;
    case "error":
      return <Tag color="error">错误</Tag>;
    default:
      return <Tag>信息</Tag>;
  }
}

function renderDeliveryStatusTag(status: string) {
  switch (status) {
    case "in_app_only":
      return <Tag>仅站内信</Tag>;
    case "pending":
      return <Tag color="processing">待处理</Tag>;
    case "accepted":
      return <Tag color="cyan">已受理</Tag>;
    case "delivered":
      return <Tag color="success">已送达</Tag>;
    case "failed":
      return <Tag color="error">失败</Tag>;
    default:
      return <Tag>{status || "-"}</Tag>;
  }
}

function renderReadTag(read: boolean) {
  return read ? (
    <Tag color="success">已读</Tag>
  ) : (
    <Tag color="warning">未读</Tag>
  );
}

const NotificationRecordPage: React.FC = () => {
  const [userParams, setUserParams] = useState<UserQueryParams>(defaultUserParams);
  const [userSearchValue, setUserSearchValue] = useState(defaultUserParams.search);
  const [recordParams, setRecordParams] =
    useState<RecordQueryParams>(defaultRecordParams);
  const [recordSearchValue, setRecordSearchValue] = useState(
    defaultRecordParams.search,
  );
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<NotificationUserSummary | null>(
    null,
  );
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  const { data: userData, isLoading: userLoading, refetch: refetchUsers } =
    useQuery({
      queryKey: ["notification-record-users", userParams],
      queryFn: () =>
        notificationRecordService.getUsers({
          ...userParams,
          startDate: userParams.startDate || undefined,
          endDate: userParams.endDate || undefined,
        }),
    });

  const {
    data: recordData,
    isLoading: recordLoading,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: ["notification-records", activeUser?.userId, recordParams],
    enabled: userModalOpen && Boolean(activeUser?.userId),
    queryFn: () =>
      notificationRecordService.getRecords({
        ...recordParams,
        userId: activeUser?.userId,
        eventCode:
          recordParams.eventCode === "all" ? undefined : recordParams.eventCode,
        readStatus:
          recordParams.readStatus === "all" ? undefined : recordParams.readStatus,
        deliveryStatus:
          recordParams.deliveryStatus === "all"
            ? undefined
            : recordParams.deliveryStatus,
        startDate: recordParams.startDate || undefined,
        endDate: recordParams.endDate || undefined,
      }),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["notification-record-detail", activeRecordId],
    enabled: detailDrawerOpen && Boolean(activeRecordId),
    queryFn: async () => {
      if (!activeRecordId) {
        throw new Error("notification id is required");
      }
      return notificationRecordService.getRecord(activeRecordId);
    },
  });

  const userItems = userData?.data?.items || [];
  const userPagination = userData?.data?.pagination;
  const recordItems = recordData?.data?.items || [];
  const recordPagination = recordData?.data?.pagination;
  const detail = detailData?.data;

  const topSummary = useMemo(() => {
    return {
      totalUsers: userPagination?.total || 0,
      notificationCount: userItems.reduce(
        (sum, item) => sum + item.notificationCount,
        0,
      ),
      unreadCount: userItems.reduce((sum, item) => sum + item.unreadCount, 0),
      failedCount: userItems.reduce((sum, item) => sum + item.failedCount, 0),
    };
  }, [userItems, userPagination?.total]);

  const updateUserParams = (patch: Partial<UserQueryParams>) => {
    setUserParams((prev) => ({ ...prev, ...patch }));
  };

  const updateRecordParams = (patch: Partial<RecordQueryParams>) => {
    setRecordParams((prev) => ({ ...prev, ...patch }));
  };

  const handleUserSearch = (search: string) => {
    updateUserParams({ page: 1, search: search.trim() });
  };

  const handleRecordSearch = (search: string) => {
    updateRecordParams({ page: 1, search: search.trim() });
  };

  const handleUserReset = () => {
    setUserSearchValue(defaultUserParams.search);
    setUserParams(defaultUserParams);
  };

  const handleRecordReset = () => {
    setRecordSearchValue(defaultRecordParams.search);
    setRecordParams(defaultRecordParams);
  };

  const handleUserTableChange = (nextPagination: TablePaginationConfig) => {
    updateUserParams({
      page: nextPagination.current || 1,
      pageSize: nextPagination.pageSize || userParams.pageSize,
    });
  };

  const handleRecordTableChange = (nextPagination: TablePaginationConfig) => {
    updateRecordParams({
      page: nextPagination.current || 1,
      pageSize: nextPagination.pageSize || recordParams.pageSize,
    });
  };

  const openUserModal = (user: NotificationUserSummary) => {
    setActiveUser(user);
    setUserModalOpen(true);
    setRecordParams(defaultRecordParams);
    setRecordSearchValue(defaultRecordParams.search);
    setDetailDrawerOpen(false);
    setActiveRecordId(null);
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    setActiveUser(null);
    setRecordParams(defaultRecordParams);
    setRecordSearchValue(defaultRecordParams.search);
    setDetailDrawerOpen(false);
    setActiveRecordId(null);
  };

  const openDetail = (id: string) => {
    setActiveRecordId(id);
    setDetailDrawerOpen(true);
  };

  const userColumns = useMemo<ColumnsType<NotificationUserSummary>>(
    () => [
      {
        title: "用户",
        key: "user",
        width: 320,
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.userName || "-"}</Text>
            <Text type="secondary">{record.email || "-"}</Text>
            <Text
              copyable={{ text: record.userId }}
              className="font-mono text-xs text-slate-500"
            >
              {record.userId}
            </Text>
          </Space>
        ),
      },
      {
        title: "通知概览",
        key: "summary",
        width: 360,
        render: (_value, record) => (
          <Space direction="vertical" size={6}>
            <Space wrap size={[6, 6]}>
              <Tag color="blue">{`通知 ${record.notificationCount}`}</Tag>
              <Tag color="gold">{`未读 ${record.unreadCount}`}</Tag>
              <Tag color="red">{`失败 ${record.failedCount}`}</Tag>
              <Tag color="cyan">{`处理中 ${record.pendingCount}`}</Tag>
              <Tag color="green">{`送达 ${record.deliveredCount}`}</Tag>
            </Space>
            <Text type="secondary">
              点击“查看通知”后，可继续按事件、已读状态、投递状态做二级筛选。
            </Text>
          </Space>
        ),
      },
      {
        title: "最近通知时间",
        dataIndex: "lastNotificationAt",
        width: 220,
        render: (value) => formatDateTime(value),
      },
      {
        title: "操作",
        key: "actions",
        width: 140,
        fixed: "right",
        render: (_value, record) => (
          <Button type="link" icon={<EyeOutlined />} onClick={() => openUserModal(record)}>
            查看通知
          </Button>
        ),
      },
    ],
    [],
  );

  const recordColumns = useMemo<ColumnsType<NotificationRecord>>(
    () => [
      {
        title: "事件与状态",
        key: "event",
        width: 240,
        render: (_value, record) => {
          const eventMeta = getEventMeta(record.eventCode);
          return (
            <Space direction="vertical" size={4}>
              <Space wrap size={[4, 4]}>
                <Tag color={eventMeta.color}>{eventMeta.label}</Tag>
                {renderSeverityTag(record.severity)}
                {renderReadTag(record.read)}
              </Space>
              <Text type="secondary">{record.type || "-"}</Text>
            </Space>
          );
        },
      },
      {
        title: "消息内容",
        key: "content",
        width: 420,
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.title}</Text>
            <Paragraph
              ellipsis={{ rows: 2, tooltip: record.body }}
              style={{ marginBottom: 0 }}
            >
              {record.body}
            </Paragraph>
            <Text type="secondary">路由：{record.route || "-"}</Text>
          </Space>
        ),
      },
      {
        title: "投递状态",
        key: "delivery",
        width: 260,
        render: (_value, record) => (
          <Space direction="vertical" size={4}>
            <Space wrap size={[4, 4]}>
              {renderDeliveryStatusTag(record.deliveryStatus)}
              <Tag>{`总投递 ${record.totalDeliveries}`}</Tag>
            </Space>
            <Text type="secondary">
              送达 {record.deliveredCount} / 受理 {record.acceptedCount} / 待处理{" "}
              {record.pendingCount} / 失败 {record.failedCount}
            </Text>
            <Text type="secondary">
              最近回执：{formatDateTime(record.lastDeliveryAt)}
            </Text>
          </Space>
        ),
      },
      {
        title: "时间",
        key: "time",
        width: 220,
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <Text>{formatDateTime(record.createdAt)}</Text>
            <Text type="secondary">已读：{formatDateTime(record.readAt)}</Text>
          </Space>
        ),
      },
      {
        title: "操作",
        key: "actions",
        width: 120,
        fixed: "right",
        render: (_value, record) => (
          <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(record.id)}>
            查看详情
          </Button>
        ),
      },
    ],
    [],
  );

  const deliveryColumns = useMemo<ColumnsType<NotificationDeliveryRecord>>(
    () => [
      {
        title: "设备",
        key: "device",
        width: 220,
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.deviceName || record.platform || "未知设备"}</Text>
            <Text type="secondary">
              {record.platform || "-"} / {record.locale || "-"}
            </Text>
            <Text type="secondary">设备状态：{record.deviceStatus || "-"}</Text>
            <Text className="font-mono text-xs text-slate-500">
              {record.expoPushTokenMasked || "-"}
            </Text>
          </Space>
        ),
      },
      {
        title: "投递状态",
        key: "status",
        width: 180,
        render: (_value, record) => (
          <Space direction="vertical" size={4}>
            <Space wrap size={[4, 4]}>
              {renderDeliveryStatusTag(record.deliveryStatus)}
              <Tag>{record.provider || "-"}</Tag>
            </Space>
            <Text type="secondary">尝试次数：{record.attemptCount}</Text>
          </Space>
        ),
      },
      {
        title: "Provider 回执",
        key: "provider",
        width: 260,
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <Text
              copyable={{ text: record.providerTicketId || "" }}
              className="font-mono text-xs"
            >
              Ticket：{record.providerTicketId || "-"}
            </Text>
            <Text
              copyable={{ text: record.providerReceiptId || "" }}
              className="font-mono text-xs"
            >
              Receipt：{record.providerReceiptId || "-"}
            </Text>
          </Space>
        ),
      },
      {
        title: "错误信息",
        key: "error",
        width: 240,
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <Text type={record.errorCode ? "danger" : "secondary"}>
              {record.errorCode || "-"}
            </Text>
            <Paragraph
              ellipsis={{ rows: 2, tooltip: record.errorMessage || "-" }}
              style={{ marginBottom: 0 }}
            >
              {record.errorMessage || "-"}
            </Paragraph>
          </Space>
        ),
      },
      {
        title: "最近尝试",
        key: "time",
        width: 200,
        render: (_value, record) => (
          <Space direction="vertical" size={2}>
            <Text>{formatDateTime(record.lastAttemptAt)}</Text>
            <Text type="secondary">更新：{formatDateTime(record.updatedAt)}</Text>
          </Space>
        ),
      },
    ],
    [],
  );

  const userDateRangeValue = useMemo<[Dayjs, Dayjs] | null>(() => {
    if (!userParams.startDate || !userParams.endDate) {
      return null;
    }
    return [dayjs(userParams.startDate), dayjs(userParams.endDate)];
  }, [userParams.endDate, userParams.startDate]);

  const recordDateRangeValue = useMemo<[Dayjs, Dayjs] | null>(() => {
    if (!recordParams.startDate || !recordParams.endDate) {
      return null;
    }
    return [dayjs(recordParams.startDate), dayjs(recordParams.endDate)];
  }, [recordParams.endDate, recordParams.startDate]);

  return (
    <div className="space-y-6 p-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[32px] border border-[#dbe8f6] bg-[linear-gradient(135deg,#f6fbff_0%,#eef6ff_45%,#ffffff_100%)] shadow-[0_24px_60px_rgba(37,99,235,0.08)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb_0%,#0ea5e9_42%,#93c5fd_100%)]" />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.34em] text-sky-700/70">
                Notification Ledger
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <BellOutlined className="text-xl" />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0 }}>
                    消息记录
                  </Title>
                  <Text type="secondary">
                    第一层按用户聚合，第二层查看该用户通知列表，第三层查看单条通知详情。
                  </Text>
                </div>
              </div>
              <Paragraph className="mt-4 !mb-0 max-w-2xl text-sm leading-6 text-slate-600">
                顶层只保留用户和时间维度筛选，事件、已读状态、投递状态等消息级条件下沉到用户通知弹窗内处理，
                方便运营先定位用户，再查看该用户具体的通知历史和投递明细。
              </Paragraph>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetchUsers()}
                  loading={userLoading}
                >
                  刷新用户列表
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "匹配用户数",
                  value: topSummary.totalUsers,
                  helper: "当前筛选条件下的用户总数",
                  icon: <UserOutlined className="text-sky-600" />,
                  tone: "bg-sky-50",
                },
                {
                  label: "当前页通知数",
                  value: topSummary.notificationCount,
                  helper: "当前页用户合计通知条数",
                  icon: <BellOutlined className="text-amber-600" />,
                  tone: "bg-amber-50",
                },
                {
                  label: "当前页未读数",
                  value: topSummary.unreadCount,
                  helper: "当前页用户维度下的未读通知",
                  icon: <ReloadOutlined className="text-cyan-600" />,
                  tone: "bg-cyan-50",
                },
                {
                  label: "当前页失败数",
                  value: topSummary.failedCount,
                  helper: "当前页用户维度下存在失败回执的通知",
                  icon: <SendOutlined className="text-rose-600" />,
                  tone: "bg-rose-50",
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
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px_auto_auto]">
          <Input.Search
            allowClear
            placeholder="搜索用户姓名、邮箱或用户 ID"
            value={userSearchValue}
            onChange={(event) => setUserSearchValue(event.target.value)}
            onSearch={handleUserSearch}
          />
          <RangePicker
            value={userDateRangeValue}
            onChange={(dates) =>
              updateUserParams({
                page: 1,
                startDate: dates?.[0]?.format("YYYY-MM-DD") || "",
                endDate: dates?.[1]?.format("YYYY-MM-DD") || "",
              })
            }
          />
          <Button onClick={handleUserReset}>重置筛选</Button>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            点击某个用户后，进入该用户的消息列表，再查看单条通知详情。
          </div>
        </div>

        <Table<NotificationUserSummary>
          rowKey="userId"
          loading={userLoading}
          columns={userColumns}
          dataSource={userItems}
          locale={{
            emptyText: <Empty description="当前筛选条件下没有匹配到用户通知记录" />,
          }}
          pagination={{
            current: userPagination?.page || userParams.page,
            pageSize: userPagination?.pageSize || userParams.pageSize,
            total: userPagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleUserTableChange}
          onRow={(record) => ({
            onClick: () => openUserModal(record),
            style: { cursor: "pointer" },
          })}
          scroll={{ x: 1080 }}
        />
      </Card>

      <Modal
        title={
          <Space direction="vertical" size={2}>
            <Text strong>
              {activeUser?.userName || "-"} 的通知列表
            </Text>
            <Text type="secondary">{activeUser?.email || activeUser?.userId || "-"}</Text>
          </Space>
        }
        open={userModalOpen}
        onCancel={closeUserModal}
        footer={null}
        width={1280}
        destroyOnClose
      >
        <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          第二层提供消息级筛选。事件类型、阅读状态、投递状态和正文搜索都在这里处理。
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_0.9fr_0.9fr_0.9fr_auto]">
          <Input.Search
            allowClear
            placeholder="搜索标题、正文、事件编码"
            value={recordSearchValue}
            onChange={(event) => setRecordSearchValue(event.target.value)}
            onSearch={handleRecordSearch}
          />
          <Select
            options={eventOptions}
            value={recordParams.eventCode}
            onChange={(value) => updateRecordParams({ page: 1, eventCode: value })}
          />
          <Select
            options={readStatusOptions}
            value={recordParams.readStatus}
            onChange={(value) => updateRecordParams({ page: 1, readStatus: value })}
          />
          <Select
            options={deliveryStatusOptions}
            value={recordParams.deliveryStatus}
            onChange={(value) =>
              updateRecordParams({ page: 1, deliveryStatus: value })
            }
          />
          <Button onClick={handleRecordReset}>重置</Button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <RangePicker
            value={recordDateRangeValue}
            onChange={(dates) =>
              updateRecordParams({
                page: 1,
                startDate: dates?.[0]?.format("YYYY-MM-DD") || "",
                endDate: dates?.[1]?.format("YYYY-MM-DD") || "",
              })
            }
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetchRecords()}
            loading={recordLoading}
          >
            刷新通知列表
          </Button>
          <Space wrap size={[8, 8]}>
            <Tag color="blue">{`通知 ${activeUser?.notificationCount || 0}`}</Tag>
            <Tag color="gold">{`未读 ${activeUser?.unreadCount || 0}`}</Tag>
            <Tag color="red">{`失败 ${activeUser?.failedCount || 0}`}</Tag>
          </Space>
        </div>

        <Table<NotificationRecord>
          rowKey="id"
          loading={recordLoading}
          columns={recordColumns}
          dataSource={recordItems}
          locale={{
            emptyText: <Empty description="该用户在当前筛选条件下没有通知记录" />,
          }}
          pagination={{
            current: recordPagination?.page || recordParams.page,
            pageSize: recordPagination?.pageSize || recordParams.pageSize,
            total: recordPagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleRecordTableChange}
          onRow={(record) => ({
            onClick: () => openDetail(record.id),
            style: { cursor: "pointer" },
          })}
          scroll={{ x: 1320 }}
        />
      </Modal>

      <Drawer
        title="通知详情"
        width={960}
        open={detailDrawerOpen}
        destroyOnClose
        onClose={() => {
          setDetailDrawerOpen(false);
          setActiveRecordId(null);
        }}
      >
        {detail ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Descriptions title="消息快照" column={2} bordered size="small">
              <Descriptions.Item label="事件类型">
                {getEventMeta(detail.notification.eventCode).label}
              </Descriptions.Item>
              <Descriptions.Item label="消息分类">
                {detail.notification.type || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="用户">
                {detail.notification.userName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {detail.notification.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="阅读状态">
                {renderReadTag(detail.notification.read)}
              </Descriptions.Item>
              <Descriptions.Item label="投递状态">
                {renderDeliveryStatusTag(detail.notification.deliveryStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>
                {detail.notification.title}
              </Descriptions.Item>
              <Descriptions.Item label="正文" span={2}>
                {detail.notification.body}
              </Descriptions.Item>
              <Descriptions.Item label="路由" span={2}>
                {detail.notification.route || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(detail.notification.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="已读时间">
                {formatDateTime(detail.notification.readAt)}
              </Descriptions.Item>
              <Descriptions.Item label="总投递">
                {detail.notification.totalDeliveries}
              </Descriptions.Item>
              <Descriptions.Item label="最近回执">
                {formatDateTime(detail.notification.lastDeliveryAt)}
              </Descriptions.Item>
              <Descriptions.Item label="送达 / 受理 / 待处理 / 失败" span={2}>
                {detail.notification.deliveredCount} /{" "}
                {detail.notification.acceptedCount} /{" "}
                {detail.notification.pendingCount} /{" "}
                {detail.notification.failedCount}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="业务载荷快照">
              {detail.notification.payload ? (
                <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                  {JSON.stringify(detail.notification.payload, null, 2)}
                </pre>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="该消息没有额外业务载荷"
                />
              )}
            </Card>

            <Card size="small" title="设备投递明细">
              <Table<NotificationDeliveryRecord>
                rowKey="id"
                loading={detailLoading}
                columns={deliveryColumns}
                dataSource={detail.deliveries}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="该消息没有 Push 投递记录"
                    />
                  ),
                }}
                pagination={false}
                scroll={{ x: 1080 }}
                size="small"
              />
            </Card>
          </Space>
        ) : (
          <Empty
            description={
              detailLoading ? "正在加载详情..." : "请选择一条通知记录查看详情"
            }
          />
        )}
      </Drawer>
    </div>
  );
};

export default NotificationRecordPage;
