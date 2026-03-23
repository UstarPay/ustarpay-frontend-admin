import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
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
} from "@ant-design/icons";
import { TENANT_PERMISSION } from "@/constants/rbac";
import {
  tenantUserService,
  type TenantAppUserKyc,
  type TenantAppUserKycDetail,
  type TenantUserKycListParams,
  type TenantUserKycReviewPayload,
} from "@/services/tenantUserService";
import { useAuthStore } from "@/stores/authStore";

const { RangePicker } = DatePicker;
const { Paragraph, Text, Title } = Typography;

type KycLevel = "l1" | "l2";
type ReviewMode = "approve" | "reject";

interface KycSearchFormValues {
  search?: string;
  status?: string;
  userName?: string;
  businessId?: string;
  email?: string;
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
  { label: "L2 人脸核验", value: "l2" },
] as const;

const kycStatusOptions = [
  { label: "待审核", value: "0" },
  { label: "已通过", value: "1" },
  { label: "已驳回", value: "2" },
];

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : value;
}

function getStatusTag(status: number) {
  const option = kycStatusOptions.find((item) => Number(item.value) === Number(status));
  const color = status === 1 ? "success" : status === 2 ? "error" : "processing";
  return <Tag color={color}>{option?.label || status}</Tag>;
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

function buildQueryParams(
  values: KycSearchFormValues,
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
    userName: values.userName?.trim() || undefined,
    businessId: values.businessId?.trim() || undefined,
    email: values.email?.trim() || undefined,
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

function getLevelTitle(level: KycLevel) {
  return level === "l1" ? "L1 内部审核" : "L2 人脸核验";
}

function isPendingStatus(status: number) {
  return Number(status) === 0;
}

const KycListPage: React.FC = () => {
  const [filterForm] = Form.useForm<KycSearchFormValues>();
  const [reviewForm] = Form.useForm<{ rejectReason?: string }>();
  const [level, setLevel] = useState<KycLevel>("l1");
  const [items, setItems] = useState<TenantAppUserKyc[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<TenantAppUserKycDetail | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("approve");
  const [reviewingItem, setReviewingItem] = useState<TenantAppUserKyc | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const canManageKyc = useAuthStore((state) =>
    state.hasPermission(TENANT_PERMISSION.TENANT_USER_KYC_MANAGE),
  );

  const loadData = useCallback(
    async (page: number, pageSize: number) => {
      const values = filterForm.getFieldsValue();
      try {
        setLoading(true);
        const response = await tenantUserService.getKycs(buildQueryParams(values, page, pageSize, level));
        const nextItems = response.data?.items || [];
        const nextPagination = response.data?.pagination;
        setItems(nextItems);
        setPagination({
          current: nextPagination?.page || page,
          pageSize: nextPagination?.pageSize || pageSize,
          total: nextPagination?.total || nextItems.length,
        });
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载 KYC 列表失败");
      } finally {
        setLoading(false);
      }
    },
    [filterForm, level],
  );

  useEffect(() => {
    void loadData(1, 10);
  }, [loadData]);

  const handleSearch = async () => {
    await loadData(1, pagination.pageSize);
  };

  const handleReset = async () => {
    filterForm.resetFields();
    await loadData(1, pagination.pageSize);
  };

  const handleTableChange = async (nextPagination: TablePaginationConfig) => {
    await loadData(nextPagination.current || 1, nextPagination.pageSize || pagination.pageSize);
  };

  const handleView = async (id: string) => {
    try {
      const response = await tenantUserService.getKyc(id, level);
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
    if (!reviewingItem) {
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
      await loadData(pagination.current, pagination.pageSize);
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const summary = useMemo(
    () => ({
      total: pagination.total,
      pending: items.filter((item) => item.status === 0).length,
      approved: items.filter((item) => item.status === 1).length,
      rejected: items.filter((item) => item.status === 2).length,
    }),
    [items, pagination.total],
  );

  const columns = useMemo<ColumnsType<TenantAppUserKyc>>(
    () => [
      { title: "用户名", dataIndex: "userName", key: "userName", width: 140, fixed: "left" },
      { title: "业务 ID", dataIndex: "businessId", key: "businessId", width: 220 },
      {
        title: "邮箱",
        dataIndex: "email",
        key: "email",
        width: 220,
        render: (value?: string) => value || "-",
      },
      {
        title: "姓名",
        key: "name",
        width: 160,
        render: (_value, record) => `${record.firstName || "-"} ${record.lastName || ""}`.trim(),
      },
      {
        title: "手机号",
        dataIndex: "phone",
        key: "phone",
        width: 160,
        render: (value?: string) => value || "-",
      },
      {
        title: "国籍",
        dataIndex: "nationality",
        key: "nationality",
        width: 120,
        render: (value?: string) => value || "-",
      },
      {
        title: "地址国家",
        dataIndex: "addressCountry",
        key: "addressCountry",
        width: 120,
        render: (value?: string) => value || "-",
      },
      {
        title: "审核状态",
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (value: number) => getStatusTag(value),
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
      {
        title: "失败原因",
        dataIndex: "failureReason",
        key: "failureReason",
        width: 220,
        render: (value: string | undefined, record: TenantAppUserKyc) => value || record.rejectReason || "-",
      },
      {
        title: "操作员",
        key: "operator",
        width: 180,
        render: (_value, record) => buildOperatorLabel(record),
      },
      {
        title: "操作",
        key: "actions",
        width: 260,
        fixed: "right",
        render: (_value, record) => (
          <Space wrap size={[4, 4]}>
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => void handleView(record.id)}>
              查看详情
            </Button>
            {canManageKyc && isPendingStatus(record.status) ? (
              <>
                <Button
                  size="small"
                  type="text"
                  icon={<CheckCircleOutlined />}
                  onClick={() => openReviewModal("approve", record)}
                >
                  通过
                </Button>
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => openReviewModal("reject", record)}
                >
                  驳回
                </Button>
              </>
            ) : null}
            {!canManageKyc ? <Tag>只读</Tag> : null}
          </Space>
        ),
      },
    ],
    [canManageKyc, level],
  );

  return (
    <div className="space-y-6 p-6">
      <Card bordered={false} className="rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.24em] text-sky-700/70">KYC Review Desk</div>
            <Title level={2} style={{ marginTop: 12, marginBottom: 8 }}>
              KYC 分层审核中心
            </Title>
            <Paragraph style={{ marginBottom: 0, color: "#475569" }}>
              将 L1 内部审核和 L2 人脸核验拆开处理。当前列表、详情和审核动作都会跟随所选层级联动。
            </Paragraph>
          </div>
          <Space direction="vertical" size="middle" style={{ minWidth: 280 }}>
            <Segmented
              block
              options={levelOptions as any}
              value={level}
              onChange={(value) => setLevel(value as KycLevel)}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void loadData(pagination.current, pagination.pageSize)} loading={loading}>
              刷新列表
            </Button>
          </Space>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "当前层级", value: getLevelTitle(level), helper: "切换后会同步刷新列表" },
            { label: "记录总数", value: String(summary.total), helper: "当前筛选结果" },
            { label: "待审核", value: String(summary.pending), helper: "待人工处理" },
            { label: "已通过 / 已驳回", value: `${summary.approved} / ${summary.rejected}`, helper: "本页状态分布" },
          ].map((item, index) => (
            <div
              key={item.label}
              className={`rounded-[24px] border px-4 py-4 ${
                index === 0 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className={`text-xs uppercase tracking-[0.14em] ${index === 0 ? "text-slate-300" : "text-slate-500"}`}>
                {item.label}
              </div>
              <div className={`mt-3 text-2xl font-semibold ${index === 0 ? "text-white" : "text-slate-900"}`}>
                {item.value}
              </div>
              <div className={`mt-1 text-xs ${index === 0 ? "text-slate-300" : "text-slate-500"}`}>
                {item.helper}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card bordered={false} className="rounded-[30px] border border-slate-200 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-500">Filter Console</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">筛选条件</div>
            <div className="mt-2 text-sm text-slate-600">基础条件与时间范围共用同一套逻辑，仅按照当前层级生效。</div>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
            当前审核层级：{getLevelTitle(level)}
          </div>
        </div>

        <Form form={filterForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item name="search" label="综合搜索">
                <Input
                  allowClear
                  prefix={<SearchOutlined className="text-slate-400" />}
                  placeholder="用户名、业务 ID、邮箱、姓名、手机号、操作员"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={4}>
              <Form.Item name="status" label="审核状态">
                <Select allowClear options={kycStatusOptions} placeholder="全部状态" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={4}>
              <Form.Item name="userName" label="用户名">
                <Input allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item name="submittedRange" label="提交时间">
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12} lg={4}>
              <Form.Item name="businessId" label="业务 ID">
                <Input allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Form.Item name="email" label="邮箱">
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
            <Col xs={24} md={12} lg={6}>
              <Form.Item name="operator" label="操作员">
                <Input allowClear />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="primary" icon={<SearchOutlined />} onClick={() => void handleSearch()}>
              搜索
            </Button>
            <Button onClick={() => void handleReset()}>重置</Button>
          </div>
        </Form>
      </Card>

      <Card bordered={false} className="rounded-[30px] border border-slate-200 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-500">Review Queue</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {getLevelTitle(level)}记录列表
            </div>
            <div className="mt-2 text-sm text-slate-600">
              列表、详情和审核按钮全部跟随当前层级切换，避免 L1 / L2 状态混看。
            </div>
          </div>
          <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-medium text-sky-700">
            支持横向滚动查看完整字段
          </div>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{ x: 2200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Drawer
        title={`${getLevelTitle(level)}详情`}
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
                <Descriptions.Item label="审核状态">{getStatusTag(Number(detailItem.status))}</Descriptions.Item>
                <Descriptions.Item label="提交时间">
                  {formatDateTime(detailItem.submittedAt || detailItem.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="通过时间">{formatDateTime(detailItem.approvedAt)}</Descriptions.Item>
                <Descriptions.Item label="驳回时间">{formatDateTime(detailItem.rejectedAt)}</Descriptions.Item>
                <Descriptions.Item label="失败原因">
                  {detailItem.failureReason || detailItem.rejectReason || "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="基础信息" size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="用户名">{detailItem.userName || "-"}</Descriptions.Item>
                <Descriptions.Item label="用户 ID">{detailItem.userId || "-"}</Descriptions.Item>
                <Descriptions.Item label="业务 ID">{detailItem.businessId || "-"}</Descriptions.Item>
                <Descriptions.Item label="证件类型">{detailItem.documentType || "-"}</Descriptions.Item>
                <Descriptions.Item label="证件国家">{detailItem.documentCountry || "-"}</Descriptions.Item>
                <Descriptions.Item label="名字">{detailItem.firstName || "-"}</Descriptions.Item>
                <Descriptions.Item label="姓氏">{detailItem.lastName || "-"}</Descriptions.Item>
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
                <Descriptions.Item label="税务居民国">{detailItem.taxResidenceCountry || "-"}</Descriptions.Item>
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

            <Card title="证件与核验资料" size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="证件正面">
                  {detailItem.idCardFrontUrl ? <Text copyable>{detailItem.idCardFrontUrl}</Text> : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="证件反面">
                  {detailItem.idCardBackUrl ? <Text copyable>{detailItem.idCardBackUrl}</Text> : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="L2 自拍 / 活体资源">
                  {detailItem.selfieUrl ? <Text copyable>{detailItem.selfieUrl}</Text> : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="操作员">{buildOperatorLabel(detailItem)}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title={reviewMode === "approve" ? `通过${getLevelTitle(level)}` : `驳回${getLevelTitle(level)}`}
        open={reviewOpen}
        onCancel={() => {
          setReviewOpen(false);
          setReviewingItem(null);
          reviewForm.resetFields();
        }}
        onOk={handleReviewSubmit}
        confirmLoading={submittingReview}
        destroyOnClose
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Card size="small" className="border-slate-200 bg-slate-50">
            <Space direction="vertical" size={4}>
              <Text strong>{reviewingItem?.userName || "-"}</Text>
              <Text type="secondary">业务 ID：{reviewingItem?.businessId || "-"}</Text>
              <Text type="secondary">当前状态：{reviewingItem ? getStatusTag(reviewingItem.status) : "-"}</Text>
              <Text type="secondary">审核层级：{getLevelTitle(level)}</Text>
            </Space>
          </Card>

          <Form form={reviewForm} layout="vertical">
            <Form.Item
              name="rejectReason"
              label="驳回原因"
              rules={reviewMode === "reject" ? [{ required: true, message: "请填写驳回原因" }] : []}
            >
              <Input.TextArea
                rows={4}
                placeholder={reviewMode === "reject" ? "请填写具体驳回原因" : "审核通过时无需填写"}
                disabled={reviewMode !== "reject"}
              />
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </div>
  );
};

export default KycListPage;
