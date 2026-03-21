import React, { useMemo, useState } from 'react'
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd'
import { AuditOutlined, CheckCircleOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { PhysicalCardApplication, PhysicalCardInventory } from '@shared/types'
import { cardService } from '@/services'

const applicationStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待审核', color: 'gold' },
  1: { text: '已通过并绑定', color: 'green' },
  2: { text: '已拒绝', color: 'red' },
  3: { text: '已取消', color: 'default' },
}

const freezeStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '已冻结', color: 'blue' },
  1: { text: '已确认扣费', color: 'green' },
  2: { text: '已释放', color: 'default' },
}

type ModalState =
  | { type: 'approve'; record: PhysicalCardApplication }
  | { type: 'reject'; record: PhysicalCardApplication }
  | { type: 'shipment'; record: PhysicalCardApplication }
  | null

const PhysicalCardApplicationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    pageSize: 20,
    search: '',
  })
  const [modalState, setModalState] = useState<ModalState>(null)
  const [form] = Form.useForm()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['physical-card-applications', searchParams],
    queryFn: () => cardService.getPhysicalApplications(searchParams),
  })

  const { data: inventoryData } = useQuery({
    queryKey: ['physical-card-available-inventories'],
    queryFn: () => cardService.getPhysicalInventories({ page: 1, pageSize: 100, status: 0 }),
  })

  const items = (data as any)?.data?.items || []
  const total = (data as any)?.data?.total ?? 0
  const availableInventories = ((inventoryData as any)?.data?.items || []) as PhysicalCardInventory[]

  const pendingCount = useMemo(() => items.filter((item: PhysicalCardApplication) => item.status === 0).length, [items])
  const approvedCount = useMemo(() => items.filter((item: PhysicalCardApplication) => item.status === 1).length, [items])
  const rejectedCount = useMemo(() => items.filter((item: PhysicalCardApplication) => item.status === 2).length, [items])
  const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0

  const summaryCards = [
    {
      title: '待审核申请',
      value: String(pendingCount),
      description: '优先处理，避免库存匹配延迟',
      icon: <AuditOutlined />,
      iconWrap: 'bg-[#0f2f5f] text-white',
      valueClass: 'text-[#0f172a]',
      borderClass: 'border-l-[6px] border-l-amber-400',
    },
    {
      title: '已通过并绑定',
      value: String(approvedCount),
      description: '已完成审核并成功绑定库存卡',
      icon: <CheckCircleOutlined />,
      iconWrap: 'bg-emerald-500 text-white',
      valueClass: 'text-[#0f172a]',
      borderClass: 'border-l-[6px] border-l-emerald-500',
    },
    {
      title: '已拒绝申请',
      value: String(rejectedCount),
      description: '不满足条件或已人工驳回',
      icon: <StopOutlined />,
      iconWrap: 'bg-rose-500 text-white',
      valueClass: 'text-[#0f172a]',
      borderClass: 'border-l-[6px] border-l-rose-500',
    },
  ]

  const approveMutation = useMutation({
    mutationFn: (values: { id: string; inventoryId: string; remark?: string }) =>
      cardService.approvePhysicalApplication(values.id, { inventoryId: values.inventoryId, remark: values.remark }),
    onSuccess: async () => {
      message.success('审核通过成功')
      setModalState(null)
      form.resetFields()
      await refetch()
    },
    onError: (error: any) => message.error(error?.message || '审核通过失败'),
  })

  const rejectMutation = useMutation({
    mutationFn: (values: { id: string; rejectReason: string; remark?: string }) =>
      cardService.rejectPhysicalApplication(values.id, { rejectReason: values.rejectReason, remark: values.remark }),
    onSuccess: async () => {
      message.success('审核拒绝成功')
      setModalState(null)
      form.resetFields()
      await refetch()
    },
    onError: (error: any) => message.error(error?.message || '审核拒绝失败'),
  })

  const shipmentMutation = useMutation({
    mutationFn: (values: { id: string; courierVendor: string; trackingNo: string; remark?: string }) =>
      cardService.updatePhysicalApplicationShipment(values.id, {
        courierVendor: values.courierVendor,
        trackingNo: values.trackingNo,
        remark: values.remark,
      }),
    onSuccess: async () => {
      message.success('发货信息更新成功')
      setModalState(null)
      form.resetFields()
      await refetch()
    },
    onError: (error: any) => message.error(error?.message || '发货信息更新失败'),
  })

  const columns = [
    {
      title: '申请单号',
      dataIndex: 'application_no',
      key: 'application_no',
      width: 220,
    },
    {
      title: '用户',
      key: 'user',
      width: 200,
      render: (_: unknown, record: PhysicalCardApplication) => (
        <div className="space-y-1">
          <div className="font-medium text-slate-900">{record.user_name || '-'}</div>
          <div className="text-xs text-slate-500">{record.user_email || record.user_phone || '-'}</div>
        </div>
      ),
    },
    {
      title: '费用',
      key: 'fee',
      width: 140,
      render: (_: unknown, record: PhysicalCardApplication) => `${record.fee_symbol || 'USD'} ${record.card_fee || '0.00'}`,
    },
    {
      title: '申请状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: number) => {
        const meta = applicationStatusMap[value] || { text: `未知(${value})`, color: 'default' }
        return <Tag color={meta.color}>{meta.text}</Tag>
      },
    },
    {
      title: '冻结状态',
      dataIndex: 'freeze_status',
      key: 'freeze_status',
      width: 140,
      render: (value: number) => {
        const meta = freezeStatusMap[value] || { text: `未知(${value})`, color: 'default' }
        return <Tag color={meta.color}>{meta.text}</Tag>
      },
    },
    {
      title: '绑定卡信息',
      key: 'card',
      width: 220,
      render: (_: unknown, record: PhysicalCardApplication) => (
        <div className="space-y-1 text-xs text-slate-600">
          <div>卡ID: {record.external_card_id || '-'}</div>
          <div>后四位: {record.card_number_last4 || '-'}</div>
        </div>
      ),
    },
    {
      title: '寄送信息',
      key: 'shipment',
      width: 220,
      render: (_: unknown, record: PhysicalCardApplication) => (
        <div className="space-y-1 text-xs text-slate-600">
          <div>承揽商: {record.courier_vendor || '-'}</div>
          <div>运单号: {record.tracking_no || '-'}</div>
        </div>
      ),
    },
    {
      title: '拒绝原因',
      dataIndex: 'reject_reason',
      key: 'reject_reason',
      width: 180,
      render: (value: string) => value || '-',
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (value: string) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, record: PhysicalCardApplication) => (
        <Space>
          {record.status === 0 ? (
            <>
              <Button size="small" type="primary" onClick={() => openModal({ type: 'approve', record })}>
                审核通过
              </Button>
              <Button size="small" danger onClick={() => openModal({ type: 'reject', record })}>
                审核拒绝
              </Button>
            </>
          ) : null}
          {record.status === 1 ? (
            <Button size="small" onClick={() => openModal({ type: 'shipment', record })}>
              补录发货
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  const openModal = (state: ModalState) => {
    setModalState(state)
    if (!state) {
      form.resetFields()
      return
    }
    if (state.type === 'shipment') {
      form.setFieldsValue({
        courierVendor: state.record.courier_vendor,
        trackingNo: state.record.tracking_no,
      })
      return
    }
    form.resetFields()
  }

  const handleModalOk = async () => {
    const values = await form.validateFields()
    if (!modalState) {
      return
    }
    if (modalState.type === 'approve') {
      approveMutation.mutate({ id: modalState.record.id, inventoryId: values.inventoryId, remark: values.remark })
      return
    }
    if (modalState.type === 'reject') {
      rejectMutation.mutate({ id: modalState.record.id, rejectReason: values.rejectReason, remark: values.remark })
      return
    }
    shipmentMutation.mutate({
      id: modalState.record.id,
      courierVendor: values.courierVendor,
      trackingNo: values.trackingNo,
      remark: values.remark,
    })
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,_#071733_0%,_#0d2852_45%,_#123e7a_100%)] shadow-[0_28px_80px_rgba(7,20,48,0.24)]">
        <div className="relative px-6 py-6 text-white md:px-8 md:py-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(125,211,252,0.14),_transparent_62%)]" />
          <div className="absolute left-0 top-0 h-40 w-40 -translate-x-8 -translate-y-10 rounded-full bg-white/10 blur-3xl" />

          <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_420px]">
            <div className="rounded-[24px] border border-white/[0.12] bg-white/[0.06] p-6 backdrop-blur-sm">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.15] bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-slate-200">
                PREBUILT CARD APPLICATIONS
              </div>
              <div className="mb-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">预制卡申请</div>
              <div className="max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                面向审核流转的工作台。这里更关注申请推进效率、库存绑定节奏和物流补录完成度，而不是库存结构本身。
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.1] bg-[#06142d]/55 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">当前待办</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{pendingCount}</div>
                  <div className="mt-2 text-xs text-slate-300">等待审核动作</div>
                </div>
                <div className="rounded-2xl border border-white/[0.1] bg-[#06142d]/55 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">库存支撑</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{availableInventories.length}</div>
                  <div className="mt-2 text-xs text-slate-300">当前可绑定卡数</div>
                </div>
                <div className="rounded-2xl border border-white/[0.1] bg-[#06142d]/55 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">处理效率</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{approvalRate}%</div>
                  <div className="mt-2 text-xs text-slate-300">通过绑定占比</div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/[0.12] bg-[linear-gradient(180deg,_rgba(255,255,255,0.12)_0%,_rgba(255,255,255,0.04)_100%)] p-5 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">审核漏斗</div>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-[#06142d]/60 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <span>1. 待审核</span>
                    <span className="font-semibold text-white">{pendingCount}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400" style={{ width: `${total > 0 ? Math.max((pendingCount / total) * 100, 8) : 0}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl bg-[#06142d]/60 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <span>2. 审核通过并绑定</span>
                    <span className="font-semibold text-white">{approvedCount}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-300" style={{ width: `${total > 0 ? Math.max((approvedCount / total) * 100, 8) : 0}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl bg-[#06142d]/60 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <span>3. 审核拒绝</span>
                    <span className="font-semibold text-white">{rejectedCount}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-300 to-red-400" style={{ width: `${total > 0 ? Math.max((rejectedCount / total) * 100, 8) : 0}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-slate-100">
                  当前可直接用于审批通过的库存卡：
                  <span className="ml-2 font-semibold text-white">{availableInventories.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1 ${card.borderClass}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-500">{card.title}</div>
                <div className={`mt-4 text-3xl font-semibold tracking-tight ${card.valueClass}`}>{card.value}</div>
                <div className="mt-3 text-xs leading-6 text-slate-500">{card.description}</div>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${card.iconWrap}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card
        className="overflow-hidden rounded-[28px] border border-slate-200/[0.7] shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
        title={
          <div>
            <div className="text-lg font-semibold text-slate-900">预制实体卡申请明细</div>
            <div className="mt-1 text-sm font-normal text-slate-500">统一查看申请状态、绑定卡信息、寄送信息，并支持直接执行审核流转。</div>
          </div>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void refetch()}>
            刷新
          </Button>
        }
      >
        <div className="mb-5 rounded-2xl border border-[#bfd4f6] bg-[linear-gradient(135deg,_rgba(227,238,255,0.9)_0%,_rgba(243,247,255,0.95)_100%)] px-5 py-4 text-sm text-slate-700">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="leading-7">
              当前共有
              <span className="mx-2 inline-flex rounded-full bg-[#0f2f5f] px-3 py-1 text-xs font-semibold text-white">{pendingCount}</span>
              条待审核申请，审核通过后可从可用库存中直接完成绑定，并继续补录物流信息。
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              待审核 {pendingCount}
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              已通过 {approvedCount}
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/[0.7] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-800">快速检索</div>
            <div className="mt-1 text-xs text-slate-500">输入申请单号、用户信息或卡 ID 后回车，即可快速定位目标申请单。</div>
          </div>
          <Input.Search
            allowClear
            placeholder="搜索申请单号 / 用户 / 卡ID"
            onSearch={(value) => setSearchParams((prev) => ({ ...prev, page: 1, search: value }))}
            className="md:max-w-[360px]"
          />
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={isLoading}
          scroll={{ x: 1800 }}
          rowClassName={(_, index) => (index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white')}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total,
            onChange: (page, pageSize) => setSearchParams((prev) => ({ ...prev, page, pageSize })),
          }}
        />
      </Card>

      <Modal
        title={modalState?.type === 'approve' ? '审核通过' : modalState?.type === 'reject' ? '审核拒绝' : '补录发货信息'}
        open={!!modalState}
        onCancel={() => openModal(null)}
        onOk={() => void handleModalOk()}
        confirmLoading={approveMutation.isPending || rejectMutation.isPending || shipmentMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {modalState?.type === 'approve' ? (
            <>
              <Form.Item name="inventoryId" label="绑定库存卡" rules={[{ required: true, message: '请选择库存卡' }]}>
                <Select
                  showSearch
                  placeholder="请选择可绑定库存卡"
                  options={availableInventories.map((item) => ({
                    value: item.id,
                    label: `${item.external_card_id} / ${item.card_number_last4 || '-'} / ${item.currency || 'USD'}`,
                  }))}
                  optionFilterProp="label"
                />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="可选" />
              </Form.Item>
            </>
          ) : null}

          {modalState?.type === 'reject' ? (
            <>
              <Form.Item name="rejectReason" label="拒绝原因" rules={[{ required: true, message: '请输入拒绝原因' }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="可选" />
              </Form.Item>
            </>
          ) : null}

          {modalState?.type === 'shipment' ? (
            <>
              <Form.Item name="courierVendor" label="快递承揽商" rules={[{ required: true, message: '请输入快递承揽商' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="trackingNo" label="快递运单号" rules={[{ required: true, message: '请输入快递运单号' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="可选" />
              </Form.Item>
            </>
          ) : null}
        </Form>
      </Modal>
    </div>
  )
}

export default PhysicalCardApplicationPage
