import React, { useMemo, useState } from 'react'
import { Button, Card, Input, Switch, Table, Tag, Typography, Upload, message } from 'antd'
import { CheckCircleOutlined, DownloadOutlined, InboxOutlined, ReloadOutlined, StopOutlined, UploadOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UploadProps } from 'antd'
import type { PhysicalCardInventory } from '@shared/types'
import { cardService } from '@/services'

const inventoryStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '未绑定', color: 'blue' },
  1: { text: '已绑定', color: 'green' },
  2: { text: '已作废', color: 'default' },
}

const PhysicalCardInventoryPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useState({
    page: 1,
    pageSize: 20,
    search: '',
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['physical-card-inventories', searchParams],
    queryFn: () => cardService.getPhysicalInventories(searchParams),
  })
  const { data: switchData, isLoading: switchLoading } = useQuery({
    queryKey: ['physical-card-inventory-switch'],
    queryFn: () => cardService.getPrebuiltInventorySwitch(),
  })

  const switchMutation = useMutation({
    mutationFn: (enabled: boolean) => cardService.updatePrebuiltInventorySwitch(enabled),
    onSuccess: async () => {
      message.success('预制库存卡开关更新成功')
      await queryClient.invalidateQueries({ queryKey: ['physical-card-inventory-switch'] })
    },
    onError: (error: any) => message.error(error?.message || '预制库存卡开关更新失败'),
  })

  const items = (data as any)?.data?.items || []
  const total = (data as any)?.data?.total ?? 0

  const availableCount = useMemo(() => items.filter((item: PhysicalCardInventory) => item.status === 0).length, [items])
  const boundCount = useMemo(() => items.filter((item: PhysicalCardInventory) => item.status === 1).length, [items])
  const invalidCount = useMemo(() => items.filter((item: PhysicalCardInventory) => item.status === 2).length, [items])
  const inventoryHealth = total > 0 ? Math.round((availableCount / total) * 100) : 0

  const summaryCards = [
    {
      title: '库存总数',
      value: String(total),
      description: '当前列表查询结果中的全部预制卡',
      icon: <InboxOutlined />,
      accent: 'from-[#143a74] via-[#0f2f5e] to-[#0a1f45]',
    },
    {
      title: '未绑定库存',
      value: String(availableCount),
      description: '可直接用于审核绑定的可用卡',
      icon: <CheckCircleOutlined />,
      accent: 'from-[#184b91] via-[#143a74] to-[#0c234d]',
    },
    {
      title: '已绑定 / 已作废',
      value: `${boundCount} / ${invalidCount}`,
      description: '已使用库存与失效库存的状态分布',
      icon: <StopOutlined />,
      accent: 'from-[#102f63] via-[#0c244d] to-[#081936]',
    },
  ]

  const uploadProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: async (file) => {
      try {
        await cardService.importPhysicalInventories(file)
        message.success('预制实体卡库存导入成功')
        queryClient.invalidateQueries({ queryKey: ['physical-card-inventories'] })
      } catch (error) {
        message.error(error instanceof Error ? error.message : '库存导入失败')
      }
      return false
    },
  }

  const columns = [
    {
      title: '卡ID',
      dataIndex: 'external_card_id',
      key: 'external_card_id',
      width: 220,
      render: (value: string) => (
        <Typography.Text copyable={{ text: value }} className="font-mono text-xs">
          {value}
        </Typography.Text>
      ),
    },
    {
      title: '卡商',
      dataIndex: 'merchant_name',
      key: 'merchant_name',
      width: 140,
      render: (value: string) => value || '-',
    },
    {
      title: '产品编码',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 140,
      render: (value: string) => value || '-',
    },
    {
      title: '后四位',
      dataIndex: 'card_number_last4',
      key: 'card_number_last4',
      width: 100,
      render: (value: string) => value || '-',
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 90,
      render: (value: string) => value || 'USD',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: number) => {
        const meta = inventoryStatusMap[value] || { text: `未知(${value})`, color: 'default' }
        return <Tag color={meta.color}>{meta.text}</Tag>
      },
    },
    {
      title: '导入批次',
      dataIndex: 'import_batch_no',
      key: 'import_batch_no',
      width: 170,
      render: (value: string) => value || '-',
    },
    {
      title: '绑定用户',
      dataIndex: 'bind_user_name',
      key: 'bind_user_name',
      width: 140,
      render: (value: string) => value || '-',
    },
    {
      title: '物流',
      key: 'shipment',
      width: 220,
      render: (_: unknown, record: PhysicalCardInventory) => (
        <div className="space-y-1 text-xs text-slate-600">
          <div>承揽商: {record.courier_vendor || '-'}</div>
          <div>运单号: {record.tracking_no || '-'}</div>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (value: string) => value || '-',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#081a3a] via-[#0c2e63] to-[#174a8d] p-[1px] shadow-[0_24px_80px_rgba(7,20,48,0.24)]">
        <div className="relative overflow-hidden rounded-[27px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_32%),linear-gradient(135deg,_#0a1d42_0%,_#0f2f5f_58%,_#1c4f97_100%)] px-6 py-6 text-white md:px-8 md:py-8">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 translate-x-10 translate-y-10 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.15] bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-slate-200">
                PREBUILT CARD INVENTORY
              </div>
              <div className="mb-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">预制卡库存</div>
              <div className="max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                用统一的库存视图管理导入、状态切换与审核绑定节奏。当前库存开关
                <span className="mx-2 inline-flex items-center rounded-full border border-white/[0.15] bg-white/[0.12] px-3 py-1 text-xs font-semibold text-white">
                  {switchData?.enabled ? '已开启' : '已关闭'}
                </span>
                开启后，APP 端实体卡申请在库存充足时优先进入预制实体卡申请单流程。
              </div>

              <div className="mt-5 inline-flex max-w-full items-center gap-4 rounded-2xl border border-cyan-200/30 bg-[linear-gradient(135deg,_rgba(255,255,255,0.14)_0%,_rgba(103,214,255,0.12)_100%)] px-4 py-3 shadow-[0_12px_28px_rgba(4,17,43,0.18)] backdrop-blur-md">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">核心开关</div>
                  <div className="mt-1 text-sm font-semibold text-white">启用预制库存卡</div>
                </div>
                <div className="hidden h-8 w-px bg-white/10 md:block" />
                <div className="text-xs text-slate-200 md:text-sm">
                  当前状态：
                  <span className="ml-1 font-semibold text-white">{switchData?.enabled ? '已开启' : '已关闭'}</span>
                </div>
                <Switch
                  checked={Boolean(switchData?.enabled)}
                  loading={switchLoading || switchMutation.isPending}
                  onChange={(checked) => switchMutation.mutate(checked)}
                />
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 xl:max-w-[460px] xl:flex-1">
              <div className="rounded-2xl border border-white/[0.12] bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-300">可用率</div>
                <div className="mt-2 text-3xl font-semibold text-white">{inventoryHealth}%</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-200" style={{ width: `${inventoryHealth}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.12] bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-300">绑定库存</div>
                <div className="mt-2 text-3xl font-semibold text-white">{boundCount}</div>
                <div className="mt-2 text-xs text-slate-300">已完成正式卡绑定</div>
              </div>
              <div className="rounded-2xl border border-white/[0.12] bg-white/10 px-4 py-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-300">作废库存</div>
                <div className="mt-2 text-3xl font-semibold text-white">{invalidCount}</div>
                <div className="mt-2 text-xs text-slate-300">需关注异常或已失效记录</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className={`group relative overflow-hidden rounded-[24px] bg-gradient-to-br ${card.accent} p-5 text-white shadow-[0_18px_40px_rgba(15,32,74,0.2)] transition-transform duration-300 hover:-translate-y-1`}
          >
            <div className="absolute right-0 top-0 h-28 w-28 -translate-y-6 translate-x-6 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-slate-200">{card.title}</div>
                <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{card.value}</div>
                <div className="mt-3 text-xs leading-6 text-slate-300">{card.description}</div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.15] bg-white/10 text-lg text-white backdrop-blur-sm">
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
            <div className="text-lg font-semibold text-slate-900">预制实体卡库存明细</div>
            <div className="mt-1 text-sm font-normal text-slate-500">支持按卡 ID、批次号、绑定用户检索，并可直接完成导入与刷新操作。</div>
          </div>
        }
        extra={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button icon={<DownloadOutlined />} onClick={() => void cardService.downloadPhysicalInventoryTemplate()}>
              下载导入模板
            </Button>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>导入库存</Button>
            </Upload>
            <Button icon={<ReloadOutlined />} onClick={() => void refetch()}>
              刷新
            </Button>
          </div>
        }
      >
        <div className="mb-5 rounded-2xl border border-[#bfd4f6] bg-[linear-gradient(135deg,_rgba(227,238,255,0.9)_0%,_rgba(243,247,255,0.95)_100%)] px-5 py-4 text-sm text-slate-700">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="leading-7">
              当前开关
              <span className="mx-2 inline-flex rounded-full bg-[#0f2f5f] px-3 py-1 text-xs font-semibold text-white">
                {switchData?.enabled ? '已开启' : '已关闭'}
              </span>
              开启后优先走预制库存申请单流程；关闭后，实体卡全部回到普通实时开卡流程。
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              可用库存 {availableCount}
              <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
              总库存 {total}
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/[0.7] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-800">快速检索</div>
            <div className="mt-1 text-xs text-slate-500">输入关键字后回车，可筛选卡 ID、导入批次号或绑定用户名。</div>
          </div>
          <Input.Search
            allowClear
            placeholder="搜索卡ID / 批次号 / 用户名"
            onSearch={(value) => setSearchParams((prev) => ({ ...prev, page: 1, search: value }))}
            className="md:max-w-[360px]"
          />
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={isLoading}
          scroll={{ x: 1500 }}
          rowClassName={(_, index) => (index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white')}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total,
            onChange: (page, pageSize) => setSearchParams((prev) => ({ ...prev, page, pageSize })),
          }}
        />
      </Card>
    </div>
  )
}

export default PhysicalCardInventoryPage
