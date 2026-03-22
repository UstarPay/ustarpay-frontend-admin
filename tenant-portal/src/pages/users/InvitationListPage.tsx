import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tree,
  Typography,
  message,
} from "antd";
import type { DataNode } from "antd/es/tree";
import {
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShareAltOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { TENANT_PERMISSION } from "@/constants/rbac";
import {
  tenantUserService,
  type TenantInvitationDetail,
  type TenantInvitationGroup,
  type TenantInvitationListParams,
  type TenantInvitationRelation,
  type TenantInvitationUserSummary,
} from "@/services/tenantUserService";
import { useAuthStore } from "@/stores/authStore";

const { Paragraph, Text, Title } = Typography;

const bindSourceOptions = [
  { label: "全部来源", value: "" },
  { label: "手动输入", value: "manual_input" },
  { label: "扫码绑定", value: "qr_scan" },
  { label: "邀请链接", value: "invite_link" },
];

const bindSourceText: Record<string, string> = {
  manual_input: "手动输入",
  qr_scan: "扫码绑定",
  invite_link: "邀请链接",
};

const searchPlaceholder = "搜索邀请人、被邀请用户、邮箱或邀请码";

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function renderBindSourceTag(value?: string) {
  return <Tag color="blue">{bindSourceText[value || ""] || value || "-"}</Tag>;
}

function renderKycTag(value?: number) {
  return <Tag color={value === 1 ? "success" : "default"}>{value === 1 ? "已 KYC" : "未 KYC"}</Tag>;
}

function toggleExpandedKey(keys: string[], key: string) {
  if (keys.includes(key)) {
    return keys.filter((item) => item !== key);
  }

  return [...keys, key];
}

function normalizeInvitationDetail(detail: TenantInvitationDetail | null): TenantInvitationDetail | null {
  if (!detail) {
    return null;
  }

  return {
    ...detail,
    invitees: Array.isArray(detail.invitees) ? detail.invitees : [],
  };
}

const InvitationListPage: React.FC = () => {
  const canView = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TENANT_USERS_VIEW));
  const [items, setItems] = useState<TenantInvitationRelation[]>([]);
  const [treeGroups, setTreeGroups] = useState<TenantInvitationGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [bindSource, setBindSource] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [treePage, setTreePage] = useState(1);
  const [treePageSize, setTreePageSize] = useState(10);
  const [treeTotal, setTreeTotal] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<TenantInvitationDetail | null>(null);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<string[]>([]);
  const [expandedDetailKeys, setExpandedDetailKeys] = useState<string[]>([]);

  const loadInvitations = useCallback(
    async (
      nextPage = page,
      nextPageSize = pageSize,
      overrides?: {
        search?: string;
        bindSource?: string;
      },
    ) => {
      if (!canView) {
        return;
      }

      try {
        setLoading(true);
        const nextSearch = overrides?.search ?? search;
        const nextBindSource = overrides?.bindSource ?? bindSource;
        const params: TenantInvitationListParams = {
          page: nextPage,
          pageSize: nextPageSize,
          search: nextSearch || undefined,
          bindSource: nextBindSource || undefined,
        };

        const response = await tenantUserService.getInvitations(params);
        setItems(response.data?.items || []);
        setTotal(response.data?.pagination?.total || 0);
        setPage(response.data?.pagination?.page || nextPage);
        setPageSize(response.data?.pagination?.pageSize || nextPageSize);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载邀请关系列表失败");
      } finally {
        setLoading(false);
      }
    },
    [bindSource, canView, page, pageSize, search],
  );

  const loadInvitationGroups = useCallback(
    async (
      nextPage = treePage,
      nextPageSize = treePageSize,
      overrides?: {
        search?: string;
        bindSource?: string;
      },
    ) => {
      if (!canView) {
        return;
      }

      try {
        setTreeLoading(true);
        const nextSearch = overrides?.search ?? search;
        const nextBindSource = overrides?.bindSource ?? bindSource;
        const params: TenantInvitationListParams = {
          page: nextPage,
          pageSize: nextPageSize,
          search: nextSearch || undefined,
          bindSource: nextBindSource || undefined,
        };

        const response = await tenantUserService.getInvitationGroups(params);
        setTreeGroups(response.data?.items || []);
        setTreeTotal(response.data?.pagination?.total || 0);
        setTreePage(response.data?.pagination?.page || nextPage);
        setTreePageSize(response.data?.pagination?.pageSize || nextPageSize);
        setExpandedGroupKeys([]);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "加载邀请关系树失败");
      } finally {
        setTreeLoading(false);
      }
    },
    [bindSource, canView, search, treePage, treePageSize],
  );

  useEffect(() => {
    if (!canView) {
      return;
    }

    void loadInvitations(1, pageSize, { search: "", bindSource: "" });
    void loadInvitationGroups(1, treePageSize, { search: "", bindSource: "" });
  }, [canView]);

  const handleOpenDetail = useCallback(async (userId: string) => {
    if (!userId) {
      return;
    }

    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const response = await tenantUserService.getUserInvitations(userId);
      setDetail(normalizeInvitationDetail(response.data || null));
    } catch (error) {
      message.error(error instanceof Error ? error.message : "加载邀请详情失败");
      setDetailOpen(false);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!detail) {
      setExpandedDetailKeys([]);
      return;
    }

    const keys: string[] = [`current-${detail.user.id}`];
    if (detail.inviter) {
      keys.unshift(`inviter-${detail.inviter.id}`);
    }
    setExpandedDetailKeys(keys);
  }, [detail]);

  const summary = useMemo(
    () => ({
      relationCount: total,
      inviterCount: treeTotal,
      currentPageKycPassed: treeGroups.reduce((count, group) => count + group.kycPassedCount, 0),
      currentPageInvitees: treeGroups.reduce((count, group) => count + group.inviteeCount, 0),
    }),
    [total, treeGroups, treeTotal],
  );

  const handleSearchSubmit = () => {
    void loadInvitations(1, pageSize);
    void loadInvitationGroups(1, treePageSize);
  };

  const handleReset = () => {
    setSearch("");
    setBindSource("");
    void loadInvitations(1, pageSize, { search: "", bindSource: "" });
    void loadInvitationGroups(1, treePageSize, { search: "", bindSource: "" });
  };

  const handleRefresh = () => {
    void loadInvitations(page, pageSize);
    void loadInvitationGroups(treePage, treePageSize);
  };

  const treeData = useMemo<DataNode[]>(
    () =>
      treeGroups.map((group) => {
        const nodeKey = `group-${group.inviterId}`;

        return {
          key: nodeKey,
          selectable: false,
          title: (
            <div
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
              onClick={() => setExpandedGroupKeys((current) => toggleExpandedKey(current, nodeKey))}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Space direction="vertical" size={4}>
                  <Space size={8} wrap>
                    <Text strong>{group.inviterUserName}</Text>
                    <Badge count={group.inviteeCount} color="#1677ff" />
                  </Space>
                  <Text type="secondary">{group.inviterEmail}</Text>
                  <Text type="secondary">最近绑定：{formatDateTime(group.latestBoundAt)}</Text>
                </Space>

                <Space size={[8, 8]} wrap>
                  <Tag color="processing">邀请 {group.inviteeCount}</Tag>
                  <Tag color="success">已 KYC {group.kycPassedCount}</Tag>
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleOpenDetail(group.inviterId);
                    }}
                  >
                    查看详情
                  </Button>
                </Space>
              </div>
            </div>
          ),
          children: group.invitees.map((relation) => ({
            key: `relation-${relation.id}`,
            selectable: false,
            isLeaf: true,
            title: (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Space direction="vertical" size={4}>
                    <Text strong>{relation.inviteeUserName}</Text>
                    <Text type="secondary">{relation.inviteeEmail}</Text>
                    <Text type="secondary">绑定时间：{formatDateTime(relation.boundAt)}</Text>
                  </Space>

                  <Space size={[8, 8]} wrap>
                    {renderBindSourceTag(relation.bindSource)}
                    {renderKycTag(relation.inviteeKycStatus)}
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleOpenDetail(relation.inviteeId);
                      }}
                    >
                      查看详情
                    </Button>
                  </Space>
                </div>
              </div>
            ),
          })),
        };
      }),
    [handleOpenDetail, treeGroups],
  );

  const detailTreeData = useMemo<DataNode[]>(() => {
    if (!detail) {
      return [];
    }

    const inviteeChildren: DataNode[] = detail.invitees.map((invitee) => ({
      key: `invitee-${invitee.id}`,
      selectable: false,
      isLeaf: true,
      title: (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Space direction="vertical" size={4}>
              <Text strong>{invitee.userName}</Text>
              <Text type="secondary">{invitee.email}</Text>
            </Space>
            <Space size={[8, 8]} wrap>
              {renderKycTag(invitee.isKycInternal)}
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleOpenDetail(invitee.id);
                }}
              >
                查看详情
              </Button>
            </Space>
          </div>
        </div>
      ),
    }));

    const currentUserKey = `current-${detail.user.id}`;
    const currentUserNode: DataNode = {
      key: currentUserKey,
      selectable: false,
      title: (
        <div
          className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
          onClick={() => setExpandedDetailKeys((current) => toggleExpandedKey(current, currentUserKey))}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Space direction="vertical" size={4}>
              <Text strong>{detail.user.userName}</Text>
              <Text type="secondary">{detail.user.email}</Text>
            </Space>
            <Space size={[8, 8]} wrap>
              {renderKycTag(detail.user.isKycInternal)}
              <Tag color="gold">当前用户</Tag>
            </Space>
          </div>
        </div>
      ),
      children: inviteeChildren,
    };

    if (!detail.inviter) {
      return [currentUserNode];
    }

    const inviterKey = `inviter-${detail.inviter.id}`;

    return [
      {
        key: inviterKey,
        selectable: false,
        title: (
          <div
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
            onClick={() => setExpandedDetailKeys((current) => toggleExpandedKey(current, inviterKey))}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Space direction="vertical" size={4}>
                <Text strong>{detail.inviter.userName}</Text>
                <Text type="secondary">{detail.inviter.email}</Text>
              </Space>
              <Space size={[8, 8]} wrap>
                <Tag color="purple">上游邀请人</Tag>
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleOpenDetail(detail.inviter!.id);
                  }}
                >
                  查看详情
                </Button>
              </Space>
            </div>
          </div>
        ),
        children: [currentUserNode],
      },
    ];
  }, [detail, handleOpenDetail]);

  const tableColumns = useMemo(
    () => [
      {
        title: "邀请人",
        key: "inviter",
        render: (_: unknown, record: TenantInvitationRelation) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.inviterUserName}</Text>
            <Text type="secondary">{record.inviterEmail}</Text>
          </Space>
        ),
      },
      {
        title: "被邀请用户",
        key: "invitee",
        render: (_: unknown, record: TenantInvitationRelation) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.inviteeUserName}</Text>
            <Text type="secondary">{record.inviteeEmail}</Text>
          </Space>
        ),
      },
      {
        title: "邀请码",
        dataIndex: "inviteCode",
        key: "inviteCode",
        render: (value: string) => value || "-",
      },
      {
        title: "绑定来源",
        dataIndex: "bindSource",
        key: "bindSource",
        render: (value: string) => renderBindSourceTag(value),
      },
      {
        title: "绑定时间",
        dataIndex: "boundAt",
        key: "boundAt",
        render: (value: string) => formatDateTime(value),
      },
      {
        title: "KYC",
        dataIndex: "inviteeKycStatus",
        key: "inviteeKycStatus",
        render: (value: number) => renderKycTag(value),
      },
      {
        title: "操作",
        key: "actions",
        width: 120,
        render: (_: unknown, record: TenantInvitationRelation) => (
          <Button type="link" icon={<EyeOutlined />} onClick={() => void handleOpenDetail(record.inviteeId)}>
            查看详情
          </Button>
        ),
      },
    ],
    [handleOpenDetail],
  );

  const inviteeColumns = useMemo(
    () => [
      { title: "用户名", dataIndex: "userName", key: "userName" },
      { title: "邮箱", dataIndex: "email", key: "email" },
      {
        title: "邀请码",
        dataIndex: "invitationCode",
        key: "invitationCode",
        render: (value?: string) => value || "-",
      },
      {
        title: "注册时间",
        dataIndex: "registerTime",
        key: "registerTime",
        render: (value: string) => formatDateTime(value),
      },
      {
        title: "绑定来源",
        dataIndex: "bindSource",
        key: "bindSource",
        render: (value?: string) => renderBindSourceTag(value),
      },
      {
        title: "绑定时间",
        dataIndex: "boundAt",
        key: "boundAt",
        render: (value?: string) => formatDateTime(value),
      },
      {
        title: "KYC",
        dataIndex: "isKycInternal",
        key: "isKycInternal",
        render: (value: number) => renderKycTag(value),
      },
      {
        title: "操作",
        key: "actions",
        width: 120,
        render: (_: unknown, record: TenantInvitationUserSummary) => (
          <Button type="link" icon={<EyeOutlined />} onClick={() => void handleOpenDetail(record.id)}>
            查看详情
          </Button>
        ),
      },
    ],
    [handleOpenDetail],
  );

  return (
    <div className="space-y-6 p-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[32px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_48%,#0ea5e9_100%)] text-white shadow-[0_28px_70px_rgba(14,165,233,0.22)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_26%)]" />
          <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.34em] text-sky-100/80">Invitation Network</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-white">邀请关系</div>
              <div className="mt-2 text-sm leading-6 text-sky-50/90">
                左侧按邀请人聚合查看网络结构，右侧保留逐条明细，详情抽屉用于核对单个用户的上下游链路。
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Input.Search
                  allowClear
                  placeholder={searchPlaceholder}
                  title={searchPlaceholder}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onSearch={handleSearchSubmit}
                  className="w-full max-w-[340px]"
                />
                <Select
                  value={bindSource}
                  options={bindSourceOptions}
                  style={{ width: 170 }}
                  onChange={setBindSource}
                />
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchSubmit}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
                <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading || treeLoading}>
                  刷新
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "关系总数",
                  value: summary.relationCount,
                  helper: "当前筛选结果",
                  icon: <ShareAltOutlined className="text-sky-700" />,
                },
                {
                  label: "邀请人",
                  value: summary.inviterCount,
                  helper: "树视图分页总量",
                  icon: <UserOutlined className="text-indigo-700" />,
                },
                {
                  label: "当前页邀请用户",
                  value: summary.currentPageInvitees,
                  helper: "左侧聚合结果",
                  icon: <TeamOutlined className="text-cyan-700" />,
                },
                {
                  label: "当前页已 KYC",
                  value: summary.currentPageKycPassed,
                  helper: "用于快速核对认证覆盖",
                  icon: <EyeOutlined className="text-emerald-700" />,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-sky-100/80">{item.label}</div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">{item.value}</div>
                  <div className="mt-1 text-xs text-sky-100/80">{item.helper}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card
            bordered={false}
            className="h-full rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-sm"
            bodyStyle={{ padding: 24, minHeight: 620, height: "100%" }}
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-500">Tree View</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">邀请网络树</div>
                <div className="mt-2 text-sm text-slate-600">
                  默认收起，按邀请人分组展示。点击节点只展开当前链路，不改变原有分页和详情逻辑。
                </div>
              </div>
              <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-medium text-sky-700">
                按邀请人聚合
              </div>
            </div>

            {treeData.length === 0 ? (
              <Empty description="暂无邀请关系数据" />
            ) : (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Tree
                  blockNode
                  showLine
                  selectable={false}
                  expandedKeys={expandedGroupKeys}
                  onExpand={(keys) => setExpandedGroupKeys(keys as string[])}
                  treeData={treeData}
                  style={{ background: "transparent" }}
                />
                <div className="flex justify-end">
                  <Pagination
                    current={treePage}
                    pageSize={treePageSize}
                    total={treeTotal}
                    showSizeChanger
                    onChange={(nextPage, nextPageSize) => void loadInvitationGroups(nextPage, nextPageSize)}
                  />
                </div>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card
            bordered={false}
            className="h-full rounded-[30px] border border-slate-200 bg-white shadow-sm"
            bodyStyle={{ padding: 24, minHeight: 620, height: "100%" }}
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-500">Relation Ledger</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">邀请关系明细</div>
                <div className="mt-2 text-sm text-slate-600">
                  保留逐条记录视图，用于搜索校对、导出前核查和快速打开单个用户详情。
                </div>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                表格逻辑保持不变
              </div>
            </div>

            <Table
              rowKey="id"
              loading={loading}
              columns={tableColumns}
              dataSource={items}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                onChange: (nextPage, nextPageSize) => void loadInvitations(nextPage, nextPageSize),
              }}
              scroll={{ x: 920 }}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title="邀请关系详情"
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
        width={980}
      >
        {detailLoading ? (
          <Text type="secondary">加载中...</Text>
        ) : !detail ? (
          <Empty description="暂无详情数据" />
        ) : (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="当前用户" size="small">
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="用户名">{detail.user.userName}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{detail.user.email}</Descriptions.Item>
                    <Descriptions.Item label="邀请码">{detail.user.invitationCode || "-"}</Descriptions.Item>
                    <Descriptions.Item label="注册时间">{formatDateTime(detail.user.registerTime)}</Descriptions.Item>
                    <Descriptions.Item label="KYC">{renderKycTag(detail.user.isKycInternal)}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="上游邀请人" size="small">
                  {detail.inviter ? (
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="用户名">{detail.inviter.userName}</Descriptions.Item>
                      <Descriptions.Item label="邮箱">{detail.inviter.email}</Descriptions.Item>
                      <Descriptions.Item label="邀请码">{detail.inviter.invitationCode || "-"}</Descriptions.Item>
                      <Descriptions.Item label="绑定来源">{renderBindSourceTag(detail.inviter.bindSource)}</Descriptions.Item>
                      <Descriptions.Item label="绑定时间">{formatDateTime(detail.inviter.boundAt)}</Descriptions.Item>
                    </Descriptions>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前用户没有上游邀请人" />
                  )}
                </Card>
              </Col>
            </Row>

            <Card
              title="邀请链路"
              size="small"
              extra={<Text type="secondary">在树中查看该用户的上下游关系结构</Text>}
            >
              <Tree
                blockNode
                showLine
                selectable={false}
                expandedKeys={expandedDetailKeys}
                onExpand={(keys) => setExpandedDetailKeys(keys as string[])}
                treeData={detailTreeData}
              />
            </Card>

            <Card
              title={`下游邀请用户 (${detail.inviteeCount})`}
              size="small"
              extra={<Text type="secondary">一个用户只会有一个上游邀请人，但可以有多个下游邀请用户</Text>}
            >
              {detail.invitees.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前用户还没有下游邀请记录" />
              ) : (
                <Table
                  rowKey="id"
                  pagination={false}
                  dataSource={detail.invitees}
                  columns={inviteeColumns}
                  scroll={{ x: 760 }}
                />
              )}
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default InvitationListPage;
