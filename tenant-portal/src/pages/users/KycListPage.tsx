import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { TENANT_PERMISSION } from "@/constants/rbac";
import {
  tenantUserService,
  type TenantAppUserKyc,
  type TenantAppUserKycDetail,
  type TenantAppUserKycUserSummary,
  type TenantUserKycListParams,
  type TenantUserKycReviewPayload,
} from "@/services/tenantUserService";
import { useAuthStore } from "@/stores/authStore";

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;

type KycLevel = "l1" | "l2";
type ReviewMode = "approve" | "reject";

interface UserSearchFormValues {
  search?: string;
  status?: string;
}

interface SubmissionSearchFormValues {
  search?: string;
  status?: string;
  businessId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  nationality?: string;
  addressCountry?: string;
  operator?: string;
  submittedRange?: [Dayjs, Dayjs];
  approvedRange?: [Dayjs, Dayjs];
  rejectedRange?: [Dayjs, Dayjs];
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

const levelOptions = [
  { label: "L1 内部审核", value: "l1" },
  { label: "L2 Sumsub 验证", value: "l2" },
] as const;

const l1StatusOptions = [
  { label: "待审核", value: "0" },
  { label: "已通过", value: "1" },
  { label: "已驳回", value: "2" },
];

const l2StatusOptions = [
  { label: "未开始", value: "0" },
  { label: "已通过", value: "1" },
  { label: "已驳回", value: "2" },
  { label: "审核中", value: "3" },
  { label: "暂缓处理", value: "4" },
];

const normalizedL2StatusOptions = [
  { label: "未开始", value: "0" },
  { label: "已通过", value: "1" },
  { label: "已驳回", value: "2" },
  { label: "审核中", value: "3" },
  { label: "暂缓处理", value: "4" },
  { label: "请求重新提交", value: "5" },
];

function getStatusOptions(level: KycLevel) {
  if (level === "l2") {
    return normalizedL2StatusOptions;
  }
  /*
  if (level === "l2") {
    return [
      { label: "未开始", value: "0" },
      { label: "已通过", value: "1" },
      { label: "已驳回", value: "2" },
      { label: "审核中", value: "3" },
      { label: "暂缓处理", value: "4" },
      { label: "请求重新提交", value: "5" },
    ];
  }
  */
  return l1StatusOptions;
  /*
    ? [...l2StatusOptions, { label: "璇锋眰閲嶆柊鎻愪氦", value: "5" }]
    : l1StatusOptions;
  */
}

function getStatusLabel(level: KycLevel, status: number) {
  return getStatusOptions(level).find((item) => Number(item.value) === Number(status))?.label || String(status);
}

function getStatusTag(level: KycLevel, status: number) {
  const color =
    status === 1 ? "success" : status === 2 ? "error" : status === 4 || status === 5 ? "warning" : "processing";
  return <Tag color={color}>{getStatusLabel(level, status)}</Tag>;
}

function getProviderStatusLabel(value?: string) {
  const normalized = (value || "").trim().toLowerCase();
  switch (normalized) {
    case "approved":
      return "已批准";
    case "rejected":
      return "已拒绝";
    case "resubmission_requested":
      return "请求重新提交";
    case "on_hold":
      return "暂缓处理";
    case "pending":
    case "initiated":
      return "审核中";
    case "init":
      return "未开始";
    default:
      break;
  }
  switch ((value || "").trim().toLowerCase()) {
    case "approved":
      return "宸查€氳繃";
    case "rejected":
      return "宸查┏鍥?";
    case "resubmission_requested":
      return "璇锋眰閲嶆柊鎻愪氦";
    case "on_hold":
      return "鏆傜紦澶勭悊";
    case "pending":
    case "initiated":
      return "瀹℃牳涓?";
    case "init":
      return "鏈紑濮?";
    default:
      return value || "-";
  }
}

function getLevelTitle(level: KycLevel) {
  return level === "l1" ? "L1 内部审核" : "L2 Sumsub 验证";
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}

function buildSubmissionParams(
  values: SubmissionSearchFormValues,
  page: number,
  pageSize: number,
  level: KycLevel,
): TenantUserKycListParams {
  const params: TenantUserKycListParams = {
    page,
    pageSize,
    level,
    search: values.search?.trim() || undefined,
    status: values.status || undefined,
    businessId: values.businessId?.trim() || undefined,
    firstName: values.firstName?.trim() || undefined,
    lastName: values.lastName?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    nationality: values.nationality?.trim() || undefined,
    addressCountry: values.addressCountry?.trim() || undefined,
    operator: values.operator?.trim() || undefined,
  };

  if (values.submittedRange) {
    params.submittedFrom = values.submittedRange[0].format("YYYY-MM-DD");
    params.submittedTo = values.submittedRange[1].format("YYYY-MM-DD");
  }
  if (values.approvedRange) {
    params.approvedFrom = values.approvedRange[0].format("YYYY-MM-DD");
    params.approvedTo = values.approvedRange[1].format("YYYY-MM-DD");
  }
  if (values.rejectedRange) {
    params.rejectedFrom = values.rejectedRange[0].format("YYYY-MM-DD");
    params.rejectedTo = values.rejectedRange[1].format("YYYY-MM-DD");
  }
  return params;
}

function buildOperatorLabel(record: Pick<TenantAppUserKyc, "operatorUsername" | "operatorDisplayName">) {
  if (!record.operatorUsername && !record.operatorDisplayName) {
    return "-";
  }
  if (record.operatorUsername && record.operatorDisplayName) {
    return `${record.operatorUsername} / ${record.operatorDisplayName}`;
  }
  return record.operatorUsername || record.operatorDisplayName || "-";
}

const KycListPage: React.FC = () => {
  const [userFilterForm] = Form.useForm<UserSearchFormValues>();
  const [submissionFilterForm] = Form.useForm<SubmissionSearchFormValues>();
  const [reviewForm] = Form.useForm<{ rejectReason?: string }>();
  const [level, setLevel] = useState<KycLevel>("l1");
  const [userItems, setUserItems] = useState<TenantAppUserKycUserSummary[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userPagination, setUserPagination] = useState<PaginationState>({ current: 1, pageSize: 10, total: 0 });
  const [selectedUser, setSelectedUser] = useState<TenantAppUserKycUserSummary | null>(null);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [submissionItems, setSubmissionItems] = useState<TenantAppUserKyc[]>([]);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionPagination, setSubmissionPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<TenantAppUserKycDetail | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("approve");
  const [reviewingItem, setReviewingItem] = useState<TenantAppUserKyc | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const canManageKyc = useAuthStore((state) =>
    state.hasPermission(TENANT_PERMISSION.TENANT_USER_KYC_MANAGE),
  );

  const loadUsers = useCallback(
    async (page: number, pageSize: number) => {
      const values = userFilterForm.getFieldsValue();
      try {
        setUserLoading(true);
        const response = await tenantUserService.getKycUsers({
          page,
          pageSize,
          level,
          search: values.search?.trim() || undefined,
          status: values.status || undefined,
        });
        const nextItems = response.data?.items || [];
        const nextPagination = response.data?.pagination;
        setUserItems(nextItems);
        setUserPagination({
          current: nextPagination?.page || page,
          pageSize: nextPagination?.pageSize || pageSize,
          total: nextPagination?.total || nextItems.length,
        });
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载 KYC 用户列表失败");
      } finally {
        setUserLoading(false);
      }
    },
    [level, userFilterForm],
  );

  const loadSubmissions = useCallback(
    async (userId: string, page: number, pageSize: number) => {
      const values = submissionFilterForm.getFieldsValue();
      try {
        setSubmissionLoading(true);
        const response = await tenantUserService.getUserKycSubmissions(
          userId,
          buildSubmissionParams(values, page, pageSize, level),
        );
        const nextItems = response.data?.items || [];
        const nextPagination = response.data?.pagination;
        setSubmissionItems(nextItems);
        setSubmissionPagination({
          current: nextPagination?.page || page,
          pageSize: nextPagination?.pageSize || pageSize,
          total: nextPagination?.total || nextItems.length,
        });
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载审核提交记录失败");
      } finally {
        setSubmissionLoading(false);
      }
    },
    [level, submissionFilterForm],
  );

  useEffect(() => {
    void loadUsers(1, userPagination.pageSize);
  }, [loadUsers, userPagination.pageSize]);

  useEffect(() => {
    setSubmissionOpen(false);
    setSelectedUser(null);
    setSubmissionItems([]);
    setDetailOpen(false);
    setDetailItem(null);
    submissionFilterForm.resetFields();
  }, [level, submissionFilterForm]);

  const handleUserSearch = async () => {
    await loadUsers(1, userPagination.pageSize);
  };

  const handleUserReset = async () => {
    userFilterForm.resetFields();
    await loadUsers(1, userPagination.pageSize);
  };

  const handleUserTableChange = async (nextPagination: TablePaginationConfig) => {
    await loadUsers(nextPagination.current || 1, nextPagination.pageSize || userPagination.pageSize);
  };

  const handleOpenSubmissions = async (item: TenantAppUserKycUserSummary) => {
    setSelectedUser(item);
    submissionFilterForm.resetFields();
    setSubmissionOpen(true);
    await loadSubmissions(item.userId, 1, submissionPagination.pageSize);
  };

  const handleSubmissionSearch = async () => {
    if (!selectedUser) {
      return;
    }
    await loadSubmissions(selectedUser.userId, 1, submissionPagination.pageSize);
  };

  const handleSubmissionReset = async () => {
    if (!selectedUser) {
      return;
    }
    submissionFilterForm.resetFields();
    await loadSubmissions(selectedUser.userId, 1, submissionPagination.pageSize);
  };

  const handleSubmissionTableChange = async (nextPagination: TablePaginationConfig) => {
    if (!selectedUser) {
      return;
    }
    await loadSubmissions(
      selectedUser.userId,
      nextPagination.current || 1,
      nextPagination.pageSize || submissionPagination.pageSize,
    );
  };

  const handleViewDetail = async (id: string) => {
    try {
      const response = await tenantUserService.getKycSubmissionDetail(id);
      setDetailItem(response.data || null);
      setDetailOpen(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载详情失败");
    }
  };

  const openReviewModal = (mode: ReviewMode, item: TenantAppUserKyc) => {
    if (!canManageKyc) {
      message.warning("当前账号仅有查看权限");
      return;
    }
    setReviewMode(mode);
    setReviewingItem(item);
    reviewForm.resetFields();
    setReviewOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewingItem || !selectedUser) {
      return;
    }
    try {
      setSubmittingReview(true);
      const values = await reviewForm.validateFields();
      const payload: TenantUserKycReviewPayload = {
        action: reviewMode,
        rejectReason: values.rejectReason?.trim() || undefined,
        level,
      };
      await tenantUserService.reviewKyc(reviewingItem.id, payload);
      message.success(reviewMode === "approve" ? "审核已通过" : "审核已驳回");
      setReviewOpen(false);
      setReviewingItem(null);
      await loadSubmissions(selectedUser.userId, submissionPagination.current, submissionPagination.pageSize);
      await loadUsers(userPagination.current, userPagination.pageSize);
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const summary = useMemo(() => {
    return {
      total: userPagination.total,
      pending: userItems.filter((item) => item.latestStatus === 0 || item.latestStatus === 3 || item.latestStatus === 4).length,
      approved: userItems.filter((item) => item.latestStatus === 1).length,
      rejected: userItems.filter((item) => item.latestStatus === 2).length,
    };
  }, [userItems, userPagination.total]);

  const userColumns = useMemo<ColumnsType<TenantAppUserKycUserSummary>>(
    () => [
      {
        title: "用户",
        key: "user",
        render: (_value, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{record.userName || "-"}</Text>
            <Text type="secondary">{record.email || "-"}</Text>
          </Space>
        ),
      },
      {
        title: "手机号",
        dataIndex: "phone",
        key: "phone",
        render: (value?: string) => value || "-",
      },
      {
        title: "当前状态",
        dataIndex: "latestStatus",
        key: "latestStatus",
        render: (value: number) => getStatusTag(level, value),
      },
      {
        title: "最近提交时间",
        dataIndex: "latestSubmittedAt",
        key: "latestSubmittedAt",
        render: (value?: string) => formatDateTime(value),
      },
      {
        title: "提交记录数",
        dataIndex: "submissionCount",
        key: "submissionCount",
      },
      {
        title: "操作",
        key: "actions",
        width: 140,
        render: (_value, record) => (
          <Button type="link" icon={<UnorderedListOutlined />} onClick={() => void handleOpenSubmissions(record)}>
            查看记录
          </Button>
        ),
      },
    ],
    [level],
  );

  const submissionColumns = useMemo<ColumnsType<TenantAppUserKyc>>(
    () => [
      {
        title: "提交记录",
        dataIndex: "businessId",
        key: "businessId",
        width: 220,
        render: (value: string) => value || "-",
      },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (value: number) => getStatusTag(level, value),
      },
      {
        title: "提交时间",
        dataIndex: "submittedAt",
        key: "submittedAt",
        width: 180,
        render: (value?: string) => formatDateTime(value),
      },
      {
        title: "通过时间",
        dataIndex: "approvedAt",
        key: "approvedAt",
        width: 180,
        render: (value?: string) => formatDateTime(value),
      },
      {
        title: "驳回时间",
        dataIndex: "rejectedAt",
        key: "rejectedAt",
        width: 180,
        render: (value?: string) => formatDateTime(value),
      },
      ...(level === "l2"
        ? ([
            {
              title: "Provider 状态",
              dataIndex: "providerStatus",
              key: "providerStatus",
              width: 140,
              render: (value?: string) => getProviderStatusLabel(value),
            },
            {
              title: "审核结果",
              dataIndex: "reviewAnswer",
              key: "reviewAnswer",
              width: 120,
              render: (value?: string) => value || "-",
            },
          ] satisfies ColumnsType<TenantAppUserKyc>)
        : ([
            {
              title: "操作员",
              key: "operator",
              width: 180,
              render: (_value, record) => buildOperatorLabel(record),
            },
          ] satisfies ColumnsType<TenantAppUserKyc>)),
      {
        title: "失败原因",
        key: "failureReason",
        width: 220,
        render: (_value, record) => record.failureReason || record.rejectReason || "-",
      },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: level === "l1" ? 240 : 120,
        render: (_value, record) => (
          <Space size={[4, 4]} wrap>
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => void handleViewDetail(record.id)}>
              查看详情
            </Button>
            {canManageKyc && level === "l1" && Number(record.status) === 0 ? (
              <>
                <Button size="small" type="text" icon={<CheckCircleOutlined />} onClick={() => openReviewModal("approve", record)}>
                  通过
                </Button>
                <Button size="small" type="text" danger icon={<CloseCircleOutlined />} onClick={() => openReviewModal("reject", record)}>
                  驳回
                </Button>
              </>
            ) : null}
          </Space>
        ),
      },
    ],
    [canManageKyc, level],
  );

  return (
    <div className="space-y-6 p-6">
      <Card bordered={false} className="rounded-[28px] border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.22em] text-sky-700/70">KYC Review Desk</div>
            <Title level={2} style={{ marginTop: 12, marginBottom: 8 }}>
              KYC 审核中心
            </Title>
            <Paragraph style={{ marginBottom: 0, color: "#475569" }}>
              第一层仅看用户，第二层看提交记录，第三层看记录详情。L1 和 L2 保持统一的分层查看方式。
            </Paragraph>
          </div>
          <Space direction="vertical" size="middle" style={{ minWidth: 280 }}>
            <Segmented block options={levelOptions as any} value={level} onChange={(value) => setLevel(value as KycLevel)} />
            <Button icon={<ReloadOutlined />} loading={userLoading} onClick={() => void loadUsers(userPagination.current, userPagination.pageSize)}>
              刷新列表
            </Button>
          </Space>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "当前层级", value: getLevelTitle(level) },
            { label: "用户总数", value: String(summary.total) },
            { label: "待处理用户", value: String(summary.pending) },
            { label: "已通过 / 已驳回", value: `${summary.approved} / ${summary.rejected}` },
          ].map((item, index) => (
            <div
              key={item.label}
              className={`rounded-[22px] border px-4 py-4 ${
                index === 0 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className={`text-xs uppercase tracking-[0.14em] ${index === 0 ? "text-slate-300" : "text-slate-500"}`}>
                {item.label}
              </div>
              <div className={`mt-3 text-2xl font-semibold ${index === 0 ? "text-white" : "text-slate-900"}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card bordered={false} className="rounded-[28px] border border-slate-200 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-500">Level 1 Filters</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">用户筛选</div>
            <div className="mt-2 text-sm text-slate-600">第一层只保留用户维度筛选，记录维度条件全部下沉到第二层。</div>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
            当前层级：{getLevelTitle(level)}
          </div>
        </div>

        <Form form={userFilterForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={14} lg={16}>
              <Form.Item name="search" label="综合搜索">
                <Input allowClear prefix={<SearchOutlined className="text-slate-400" />} placeholder="用户名、邮箱、手机号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={10} lg={8}>
              <Form.Item name="status" label="当前状态">
                <Select allowClear options={getStatusOptions(level)} placeholder="全部状态" />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="primary" icon={<SearchOutlined />} onClick={() => void handleUserSearch()}>
              搜索
            </Button>
            <Button onClick={() => void handleUserReset()}>重置</Button>
          </div>
        </Form>
      </Card>

      <Card bordered={false} className="rounded-[28px] border border-slate-200 shadow-sm">
        <div className="mb-5">
          <div className="text-sm font-medium text-slate-500">Level 1 List</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">用户列表</div>
          <div className="mt-2 text-sm text-slate-600">点击右侧“查看记录”进入第二层，查看该用户的审核提交记录。</div>
        </div>

        <Table
          rowKey="userId"
          loading={userLoading}
          columns={userColumns}
          dataSource={userItems}
          locale={{ emptyText: <Empty description="暂无 KYC 用户数据" /> }}
          pagination={{
            current: userPagination.current,
            pageSize: userPagination.pageSize,
            total: userPagination.total,
            showSizeChanger: true,
          }}
          onChange={handleUserTableChange}
        />
      </Card>

      <Modal
        title={`${selectedUser?.userName || "-"} 的提交记录`}
        open={submissionOpen}
        width={1200}
        destroyOnClose
        onCancel={() => {
          setSubmissionOpen(false);
          setSelectedUser(null);
          setSubmissionItems([]);
          setDetailOpen(false);
          setDetailItem(null);
        }}
        footer={null}
      >
        {selectedUser ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card size="small" className="border-slate-200 bg-slate-50">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="用户">{selectedUser.userName || "-"}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{selectedUser.email || "-"}</Descriptions.Item>
                <Descriptions.Item label="手机号">{selectedUser.phone || "-"}</Descriptions.Item>
                <Descriptions.Item label="当前状态">{getStatusTag(level, selectedUser.latestStatus)}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="提交记录筛选">
              <Form form={submissionFilterForm} layout="vertical">
                <Row gutter={16}>
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item name="search" label="综合搜索">
                      <Input allowClear placeholder="记录号、姓名、手机号、国籍、地址国家、失败原因" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={4}>
                    <Form.Item name="status" label="记录状态">
                      <Select allowClear options={getStatusOptions(level)} placeholder="全部状态" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item name="businessId" label={level === "l2" ? "Action / 外部记录号" : "业务 ID"}>
                      <Input allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={6}>
                    <Form.Item name="submittedRange" label="提交时间">
                      <RangePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12} lg={4}>
                    <Form.Item name="firstName" label="名">
                      <Input allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={4}>
                    <Form.Item name="lastName" label="姓">
                      <Input allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={4}>
                    <Form.Item name="phone" label="手机号">
                      <Input allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={4}>
                    <Form.Item name="nationality" label="国籍">
                      <Input allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={4}>
                    <Form.Item name="addressCountry" label="地址国家">
                      <Input allowClear />
                    </Form.Item>
                  </Col>
                  {level === "l1" ? (
                    <Col xs={24} md={12} lg={4}>
                      <Form.Item name="operator" label="操作员">
                        <Input allowClear />
                      </Form.Item>
                    </Col>
                  ) : null}
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="approvedRange" label="通过时间">
                      <RangePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="rejectedRange" label="驳回时间">
                      <RangePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="primary" icon={<SearchOutlined />} onClick={() => void handleSubmissionSearch()}>
                    搜索记录
                  </Button>
                  <Button onClick={() => void handleSubmissionReset()}>重置</Button>
                </div>
              </Form>
            </Card>

            <Table
              rowKey="id"
              loading={submissionLoading}
              columns={submissionColumns}
              dataSource={submissionItems}
              scroll={{ x: 1500 }}
              locale={{ emptyText: <Empty description="该用户暂无提交记录" /> }}
              pagination={{
                current: submissionPagination.current,
                pageSize: submissionPagination.pageSize,
                total: submissionPagination.total,
                showSizeChanger: true,
              }}
              onChange={handleSubmissionTableChange}
            />
          </Space>
        ) : null}
      </Modal>

      <Drawer
        title="提交记录详情"
        open={detailOpen}
        width={760}
        destroyOnClose
        onClose={() => {
          setDetailOpen(false);
          setDetailItem(null);
        }}
      >
        {detailItem ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="审核层级">{getLevelTitle(level)}</Descriptions.Item>
                <Descriptions.Item label="记录来源">{detailItem.recordSource === "sumsub" ? "Sumsub" : "本地审核"}</Descriptions.Item>
                <Descriptions.Item label="当前状态">{getStatusTag(level, Number(detailItem.status))}</Descriptions.Item>
                <Descriptions.Item label="提交时间">{formatDateTime(detailItem.submittedAt)}</Descriptions.Item>
                <Descriptions.Item label="通过时间">{formatDateTime(detailItem.approvedAt)}</Descriptions.Item>
                <Descriptions.Item label="驳回时间">{formatDateTime(detailItem.rejectedAt)}</Descriptions.Item>
                <Descriptions.Item label="失败原因">{detailItem.failureReason || detailItem.rejectReason || "-"}</Descriptions.Item>
                {level === "l2" ? (
                  <>
                    <Descriptions.Item label="Provider 状态">{detailItem.providerStatus || "-"}</Descriptions.Item>
                    <Descriptions.Item label="审核结果">{detailItem.reviewAnswer || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Applicant ID">{detailItem.applicantId || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Action ID">{detailItem.actionId || "-"}</Descriptions.Item>
                    <Descriptions.Item label="External Action ID">{detailItem.externalActionId || "-"}</Descriptions.Item>
                  </>
                ) : (
                  <Descriptions.Item label="操作员">{buildOperatorLabel(detailItem)}</Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Card title="基础信息" size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="用户">{detailItem.userName || "-"}</Descriptions.Item>
                <Descriptions.Item label="用户 ID">{detailItem.userId || "-"}</Descriptions.Item>
                <Descriptions.Item label="记录号">{detailItem.businessId || "-"}</Descriptions.Item>
                <Descriptions.Item label="证件类型">{detailItem.documentType || "-"}</Descriptions.Item>
                <Descriptions.Item label="证件签发国家">{detailItem.documentCountry || "-"}</Descriptions.Item>
                <Descriptions.Item label="姓">{detailItem.lastName || "-"}</Descriptions.Item>
                <Descriptions.Item label="名">{detailItem.firstName || "-"}</Descriptions.Item>
                <Descriptions.Item label="全名">{detailItem.fullName || "-"}</Descriptions.Item>
                <Descriptions.Item label="性别">{detailItem.gender || "-"}</Descriptions.Item>
                <Descriptions.Item label="出生日期">
                  {detailItem.dob ? String(detailItem.dob).slice(0, 10) : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="出生地">{detailItem.placeOfBirth || "-"}</Descriptions.Item>
                <Descriptions.Item label="出生国家">{detailItem.countryOfBirth || "-"}</Descriptions.Item>
                <Descriptions.Item label="国籍">{detailItem.nationality || "-"}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{detailItem.email || "-"}</Descriptions.Item>
                <Descriptions.Item label="手机号">{detailItem.phone || "-"}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="地址与税务信息" size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="居住国家">{detailItem.residenceCountry || detailItem.addressCountry || "-"}</Descriptions.Item>
                <Descriptions.Item label="税务居住国">{detailItem.taxResidenceCountry || "-"}</Descriptions.Item>
                <Descriptions.Item label="街道">{detailItem.addressStreet || "-"}</Descriptions.Item>
                <Descriptions.Item label="城市">{detailItem.addressTown || "-"}</Descriptions.Item>
                <Descriptions.Item label="州 / 省">{detailItem.addressState || "-"}</Descriptions.Item>
                <Descriptions.Item label="邮编">{detailItem.addressPostCode || "-"}</Descriptions.Item>
                <Descriptions.Item label="楼栋号">{detailItem.addressBuildingNumber || "-"}</Descriptions.Item>
                <Descriptions.Item label="房间号">{detailItem.addressFlatNumber || "-"}</Descriptions.Item>
                <Descriptions.Item label="完整地址">{detailItem.addressFormattedAddress || "-"}</Descriptions.Item>
                <Descriptions.Item label="TIN">{detailItem.tin || "-"}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="核验资料" size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="证件正面">
                  {detailItem.idCardFrontUrl ? <Text copyable>{detailItem.idCardFrontUrl}</Text> : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="证件反面">
                  {detailItem.idCardBackUrl ? <Text copyable>{detailItem.idCardBackUrl}</Text> : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="自拍 / 活体资源">
                  {detailItem.selfieUrl ? <Text copyable>{detailItem.selfieUrl}</Text> : "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title={reviewMode === "approve" ? `通过 ${getLevelTitle(level)}` : `驳回 ${getLevelTitle(level)}`}
        open={reviewOpen}
        destroyOnClose
        confirmLoading={submittingReview}
        onCancel={() => {
          setReviewOpen(false);
          setReviewingItem(null);
          reviewForm.resetFields();
        }}
        onOk={handleReviewSubmit}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Card size="small" className="border-slate-200 bg-slate-50">
            <Space direction="vertical" size={4}>
              <Text strong>{reviewingItem?.userName || "-"}</Text>
              <Text type="secondary">记录号：{reviewingItem?.businessId || "-"}</Text>
              <Text type="secondary">当前状态：{reviewingItem ? getStatusTag(level, reviewingItem.status) : "-"}</Text>
            </Space>
          </Card>
          <Form form={reviewForm} layout="vertical">
            <Form.Item
              name="rejectReason"
              label="驳回原因"
              rules={reviewMode === "reject" ? [{ required: true, message: "请填写驳回原因" }] : []}
            >
              <Input.TextArea rows={4} disabled={reviewMode !== "reject"} placeholder={reviewMode === "reject" ? "请填写具体驳回原因" : "审核通过时无需填写"} />
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </div>
  );
};

export default KycListPage;
