import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
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
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { TENANT_PERMISSION } from '@/constants/rbac'
import {
  tenantUserService,
  type TenantAppUserKyc,
  type TenantUserKycListParams,
  type TenantUserKycReviewPayload,
} from '@/services/tenantUserService'
import { useAuthStore } from '@/stores/authStore'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const kycStatusOptions = [
  { label: '待审核', value: '0' },
  { label: '已通过', value: '1' },
  { label: '已驳回', value: '2' },
]

type ReviewMode = 'approve' | 'reject'

interface KycSearchFormValues {
  search?: string
  status?: string
  userName?: string
  businessId?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  nationality?: string
  addressCountry?: string
  operator?: string
  submittedRange?: [Dayjs, Dayjs]
  approvedRange?: [Dayjs, Dayjs]
  rejectedRange?: [Dayjs, Dayjs]
}

interface PaginationState {
  current: number
  pageSize: number
  total: number
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value
}

function isPendingStatus(status: number) {
  return Number(status) === 0
}

function getStatusTag(status: number) {
  const option = kycStatusOptions.find((item) => Number(item.value) === status)
  const color = status === 1 ? 'success' : status === 2 ? 'error' : 'processing'
  return <Tag color={color}>{option?.label || status}</Tag>
}

function buildOperatorLabel(record: TenantAppUserKyc) {
  if (!record.operatorUsername && !record.operatorDisplayName) {
    return '-'
  }
  if (record.operatorUsername && record.operatorDisplayName) {
    return `${record.operatorUsername} / ${record.operatorDisplayName}`
  }
  return record.operatorUsername || record.operatorDisplayName || '-'
}

function buildQueryParams(values: KycSearchFormValues, page: number, pageSize: number): TenantUserKycListParams {
  const params: TenantUserKycListParams = {
    page,
    pageSize,
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
  }

  if (values.submittedRange) {
    params.submittedFrom = values.submittedRange[0].format('YYYY-MM-DD')
    params.submittedTo = values.submittedRange[1].format('YYYY-MM-DD')
  }
  if (values.approvedRange) {
    params.approvedFrom = values.approvedRange[0].format('YYYY-MM-DD')
    params.approvedTo = values.approvedRange[1].format('YYYY-MM-DD')
  }
  if (values.rejectedRange) {
    params.rejectedFrom = values.rejectedRange[0].format('YYYY-MM-DD')
    params.rejectedTo = values.rejectedRange[1].format('YYYY-MM-DD')
  }

  return params
}

const KycListPage: React.FC = () => {
  const [filterForm] = Form.useForm<KycSearchFormValues>()
  const [reviewForm] = Form.useForm<{ rejectReason?: string }>()
  const [items, setItems] = useState<TenantAppUserKyc[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<any>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewMode, setReviewMode] = useState<ReviewMode>('approve')
  const [reviewingItem, setReviewingItem] = useState<TenantAppUserKyc | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const canManageKyc = useAuthStore((state) => state.hasPermission(TENANT_PERMISSION.TENANT_USER_KYC_MANAGE))

  const loadData = useCallback(async (page: number, pageSize: number) => {
    const values = filterForm.getFieldsValue()

    try {
      setLoading(true)
      const response = await tenantUserService.getKycs(buildQueryParams(values, page, pageSize))
      const nextItems = response.data?.items || []
      const nextPagination = response.data?.pagination

      setItems(nextItems)
      setPagination({
        current: nextPagination?.page || page,
        pageSize: nextPagination?.pageSize || pageSize,
        total: nextPagination?.total || nextItems.length,
      })
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载 KYC 列表失败')
    } finally {
      setLoading(false)
    }
  }, [filterForm])

  useEffect(() => {
    void loadData(1, 10)
  }, [loadData])

  const handleSearch = async () => {
    await loadData(1, pagination.pageSize)
  }

  const handleReset = async () => {
    filterForm.resetFields()
    await loadData(1, pagination.pageSize)
  }

  const handleTableChange = async (nextPagination: TablePaginationConfig) => {
    await loadData(nextPagination.current || 1, nextPagination.pageSize || pagination.pageSize)
  }

  const handleView = async (id: string) => {
    try {
      const response = await tenantUserService.getKyc(id)
      setDetailItem(response.data || null)
      setDetailOpen(true)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载 KYC 详情失败')
    }
  }

  const openReviewModal = (mode: ReviewMode, item: TenantAppUserKyc) => {
    if (!canManageKyc) {
      message.warning('当前账号只有查看权限')
      return
    }

    setReviewMode(mode)
    setReviewingItem(item)
    reviewForm.resetFields()
    setReviewOpen(true)
  }

  const handleReviewSubmit = async () => {
    if (!reviewingItem) {
      return
    }

    try {
      setSubmittingReview(true)
      const values = await reviewForm.validateFields()
      const payload: TenantUserKycReviewPayload = {
        action: reviewMode,
        rejectReason: values.rejectReason?.trim() || undefined,
      }

      await tenantUserService.reviewKyc(reviewingItem.id, payload)
      message.success(reviewMode === 'approve' ? 'KYC 审核已通过' : 'KYC 已驳回')
      setReviewOpen(false)
      setReviewingItem(null)
      await loadData(pagination.current, pagination.pageSize)
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setSubmittingReview(false)
    }
  }

  const columns = useMemo<ColumnsType<TenantAppUserKyc>>(() => [
    { title: '用户名', dataIndex: 'userName', key: 'userName', width: 140, fixed: 'left' },
    { title: '业务 ID', dataIndex: 'businessId', key: 'businessId', width: 220 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 220, render: (value?: string) => value || '-' },
    { title: '名', dataIndex: 'firstName', key: 'firstName', width: 120, render: (value?: string) => value || '-' },
    { title: '姓', dataIndex: 'lastName', key: 'lastName', width: 120, render: (value?: string) => value || '-' },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 160, render: (value?: string) => value || '-' },
    { title: '国籍', dataIndex: 'nationality', key: 'nationality', width: 110, render: (value?: string) => value || '-' },
    { title: '居住国家', dataIndex: 'addressCountry', key: 'addressCountry', width: 120, render: (value?: string) => value || '-' },
    {
      title: '审核状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: number) => getStatusTag(value),
    },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 180, render: (value?: string) => formatDateTime(value) },
    { title: '通过时间', dataIndex: 'approvedAt', key: 'approvedAt', width: 180, render: (value?: string) => formatDateTime(value) },
    { title: '驳回时间', dataIndex: 'rejectedAt', key: 'rejectedAt', width: 180, render: (value?: string) => formatDateTime(value) },
    {
      title: '失败原因',
      dataIndex: 'failureReason',
      key: 'failureReason',
      width: 220,
      render: (value?: string) => value || '-',
    },
    {
      title: '操作员',
      key: 'operator',
      width: 180,
      render: (_value, record) => buildOperatorLabel(record),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_value, record) => (
        <Space wrap size={[4, 4]}>
          <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>
            详情
          </Button>
          {canManageKyc && isPendingStatus(record.status) ? (
            <>
              <Button size="small" type="text" icon={<CheckCircleOutlined />} onClick={() => openReviewModal('approve', record)}>
                通过
              </Button>
              <Button size="small" type="text" danger icon={<CloseCircleOutlined />} onClick={() => openReviewModal('reject', record)}>
                驳回
              </Button>
            </>
          ) : null}
          {!canManageKyc ? <Tag>只读</Tag> : null}
        </Space>
      ),
    },
  ], [canManageKyc])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <Title level={2}>KYC 审核管理</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void loadData(pagination.current, pagination.pageSize)} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      <Card className="mb-6">
        <Form form={filterForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12} lg={6}>
              <Form.Item name="search" label="综合搜索">
                <Input placeholder="用户名/业务ID/邮箱/姓名/手机号/操作员" allowClear />
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
              <Form.Item name="addressCountry" label="居住国家">
                <Input allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={4}>
              <Form.Item name="operator" label="操作员">
                <Input allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="submittedRange" label="提交时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="approvedRange" label="通过时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="rejectedRange" label="驳回时间">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={24}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                <Button type="primary" icon={<SearchOutlined />} onClick={() => void handleSearch()}>
                  搜索
                </Button>
                <Button onClick={() => void handleReset()}>
                  重置
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{ x: 2400 }}
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
        title="KYC 详情"
        open={detailOpen}
        width={720}
        destroyOnClose
        onClose={() => {
          setDetailOpen(false)
          setDetailItem(null)
        }}
      >
        {detailItem ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title="审核信息" column={1} bordered size="small">
              <Descriptions.Item label="审核状态">
                {getStatusTag(Number(detailItem.status))}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {formatDateTime(detailItem.submittedAt || detailItem.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="通过时间">
                {formatDateTime(detailItem.approvedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="驳回时间">
                {formatDateTime(detailItem.rejectedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="失败原因">
                {detailItem.failureReason || detailItem.rejectReason || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="基础信息" column={1} bordered size="small">
              <Descriptions.Item label="用户 ID">{detailItem.userId || '-'}</Descriptions.Item>
              <Descriptions.Item label="业务 ID">{detailItem.businessId || '-'}</Descriptions.Item>
              <Descriptions.Item label="名">{detailItem.firstName || '-'}</Descriptions.Item>
              <Descriptions.Item label="姓">{detailItem.lastName || '-'}</Descriptions.Item>
              <Descriptions.Item label="全名">{detailItem.fullName || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别">{detailItem.gender || '-'}</Descriptions.Item>
              <Descriptions.Item label="生日">{detailItem.dob ? String(detailItem.dob).slice(0, 10) : '-'}</Descriptions.Item>
              <Descriptions.Item label="出生国家">{detailItem.countryOfBirth || '-'}</Descriptions.Item>
              <Descriptions.Item label="国籍">{detailItem.nationality || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{detailItem.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{detailItem.phone || '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="地址信息" column={1} bordered size="small">
              <Descriptions.Item label="居住国家">{detailItem.addressCountry || '-'}</Descriptions.Item>
              <Descriptions.Item label="街道">{detailItem.addressStreet || '-'}</Descriptions.Item>
              <Descriptions.Item label="城市">{detailItem.addressTown || '-'}</Descriptions.Item>
              <Descriptions.Item label="省/州">{detailItem.addressState || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮编">{detailItem.addressPostCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="楼栋号">{detailItem.addressBuildingNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="房间号">{detailItem.addressFlatNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="完整地址">{detailItem.addressFormattedAddress || '-'}</Descriptions.Item>
              <Descriptions.Item label="TIN">{detailItem.tin || '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="证件资料" column={1} bordered size="small">
              <Descriptions.Item label="证件正面">
                {detailItem.idCardFrontUrl ? <Text copyable>{detailItem.idCardFrontUrl}</Text> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="证件反面">
                {detailItem.idCardBackUrl ? <Text copyable>{detailItem.idCardBackUrl}</Text> : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title={reviewMode === 'approve' ? '审核通过' : '审核驳回'}
        open={reviewOpen}
        onCancel={() => {
          setReviewOpen(false)
          setReviewingItem(null)
          reviewForm.resetFields()
        }}
        onOk={handleReviewSubmit}
        confirmLoading={submittingReview}
        destroyOnClose
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>
            当前记录：{reviewingItem?.userName || '-'} / {reviewingItem?.businessId || '-'}
          </Text>
          <Form form={reviewForm} layout="vertical">
            <Form.Item
              name="rejectReason"
              label="驳回原因"
              rules={reviewMode === 'reject' ? [{ required: true, message: '请填写驳回原因' }] : []}
            >
              <Input.TextArea
                rows={4}
                placeholder={reviewMode === 'reject' ? '请填写具体驳回原因' : '通过审核时无需填写'}
                disabled={reviewMode !== 'reject'}
              />
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </div>
  )
}

export default KycListPage
