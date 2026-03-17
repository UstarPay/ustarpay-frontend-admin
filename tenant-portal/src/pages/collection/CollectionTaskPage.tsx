import React, { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { message } from 'antd'
import { collectionService } from '@/services'
import {
  CollectionTaskQueryParams,
  CollectionTaskStatus,
  TenantCollectionTask
} from '@shared/types'

const { Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const CollectionTaskPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useState<CollectionTaskQueryParams>({
    page: 1,
    pageSize: 10,
    status: undefined,
    configId: undefined,
    startDate: undefined,
    endDate: undefined
  })
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<TenantCollectionTask | null>(null)

  const { data: taskData, isLoading, refetch } = useQuery({
    queryKey: ['collection-tasks', searchParams],
    queryFn: () => collectionService.getTasks(searchParams)
  })

  const { data: taskStats } = useQuery({
    queryKey: ['collection-task-stats', searchParams.startDate, searchParams.endDate],
    queryFn: () => collectionService.getTaskStats({
      startDate: searchParams.startDate,
      endDate: searchParams.endDate
    })
  })

  const reExecuteMutation = useMutation({
    mutationFn: (configId: string) => collectionService.executeCollection(configId),
    onSuccess: (res) => {
      if (res?.code === 'TASK_ALREADY_EXISTS' || res?.code === 'NO_FUNDS_AVAILABLE') {
        message.info(res?.message || '执行完成')
      } else if (res?.data != null) {
        message.success('执行成功')
      } else {
        message.info(res?.message || '执行完成')
      }
      queryClient.invalidateQueries({ queryKey: ['collection-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['collection-task-stats'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '执行失败')
    }
  })

  const handleTableChange = (pagination: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setSearchParams(prev => ({
        ...prev,
        startDate: dates[0]?.format('YYYY-MM-DD'),
        endDate: dates[1]?.format('YYYY-MM-DD'),
        page: 1
      }))
      return
    }

    setSearchParams(prev => ({
      ...prev,
      startDate: undefined,
      endDate: undefined,
      page: 1
    }))
  }

  const handleViewDetail = (record: TenantCollectionTask) => {
    setDetailRecord(record)
    setDetailOpen(true)
  }

  const resetFilters = () => {
    setSearchParams({
      page: 1,
      pageSize: 10,
      status: undefined,
      configId: undefined,
      startDate: undefined,
      endDate: undefined
    })
  }

  const getStatusConfig = (status: number) => {
    const statusConfig: Record<number, { text: string; color: string; icon: React.ReactNode }> = {
      [CollectionTaskStatus.PENDING]: { text: '待执行', color: 'warning', icon: <ClockCircleOutlined /> },
      [CollectionTaskStatus.RUNNING]: { text: '执行中', color: 'processing', icon: <SyncOutlined spin /> },
      [CollectionTaskStatus.PARTIAL_SUCCESS]: { text: '部分成功', color: 'processing', icon: <CheckCircleOutlined /> },
      [CollectionTaskStatus.SUCCESS]: { text: '成功', color: 'success', icon: <CheckCircleOutlined /> },
      [CollectionTaskStatus.FAILED]: { text: '失败', color: 'error', icon: <CloseCircleOutlined /> },
      [CollectionTaskStatus.CANCELLED]: { text: '已取消', color: 'default', icon: <CloseCircleOutlined /> },
    }
    return statusConfig[status] ?? { text: '未知', color: 'default', icon: <ClockCircleOutlined /> }
  }

  const successRate = taskStats?.data?.successRate != null
    ? taskStats.data.successRate
    : (() => {
        const completed = taskStats?.data?.completedTasks ?? 0
        const failed = taskStats?.data?.failedTasks ?? 0
        const finished = completed + failed
        return finished > 0 ? Math.round((completed / finished) * 100) : 0
      })()

  const columns = [
    {
      title: '任务信息',
      key: 'taskInfo',
      render: (_: any, record: TenantCollectionTask) => (
        <div>
          <div className="font-medium text-slate-900">任务ID: {record.id.slice(0, 8)}...</div>
          <Text type="secondary" className="text-xs">
            配置ID: {record.configId.slice(0, 8)}...
          </Text>
        </div>
      )
    },
    {
      title: '归集地址',
      key: 'addresses',
      render: (_: any, record: TenantCollectionTask) => (
        <div>
          <div className="font-medium text-slate-900">
            目标: {record.toAddress.slice(0, 6)}...{record.toAddress.slice(-4)}
          </div>
          <Text type="secondary" className="text-xs">
            {record.fromAddressCount} / {record.expectedFromAddressCount}
          </Text>
        </div>
      )
    },
    {
      title: '支持的链和代币',
      key: 'chainAndSymbols',
      render: (_: any, record: TenantCollectionTask) => (
        <div>
          <div className="mb-1">
            {record.chainCodes.map((code: string) => (
              <Tag key={code} color="blue">
                {code.toUpperCase()}
              </Tag>
            ))}
          </div>
          <div>
            {record.symbols.map((symbol: string) => (
              <Tag key={symbol} color="green">
                {symbol}
              </Tag>
            ))}
          </div>
        </div>
      )
    },
    {
      title: '归集金额',
      key: 'amounts',
      render: (_: any, record: TenantCollectionTask) => (
        <div className="font-medium text-slate-900">
          {Object.entries(record.expectedAmount).map(([symbol, amount]) => (
            <span key={symbol} className="mr-2">
              {symbol}: {amount}
            </span>
          ))}
        </div>
      )
    },
    {
      title: '执行状态',
      key: 'execution',
      render: (_: any, record: TenantCollectionTask) => {
        const statusConfig = getStatusConfig(record.status)
        return <Badge status={statusConfig.color as any} text={statusConfig.text} />
      }
    },
    {
      title: '时间信息',
      key: 'timing',
      render: (_: any, record: TenantCollectionTask) => (
        <div>
          <div className="font-medium text-slate-900">
            计划: {dayjs(record.scheduledAt).format('MM-DD HH:mm')}
          </div>
          <Text type="secondary" className="text-xs">
            {record.executedAt && `执行: ${dayjs(record.executedAt).format('MM-DD HH:mm')}`}
            {record.completedAt && ` | 完成: ${dayjs(record.completedAt).format('MM-DD HH:mm')}`}
          </Text>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: TenantCollectionTask) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 1 && (
            <Tooltip title="重新执行">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                size="small"
                loading={reExecuteMutation.isPending}
                onClick={() => reExecuteMutation.mutate(record.configId)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="space-y-6 p-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[30px] border border-[rgba(30,64,175,0.10)] bg-[linear-gradient(130deg,rgba(15,23,42,0.96)_0%,rgba(30,64,175,0.95)_38%,rgba(8,47,73,0.94)_100%)] shadow-[0_24px_70px_rgba(30,64,175,0.18)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-5 lg:px-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1e3a8a_0%,#2563eb_45%,#38bdf8_100%)]" />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
            <div>
              <div className="text-[11px] uppercase tracking-[0.34em] text-[#dbeafe]">Collection Task Monitor</div>
              <div className="mt-2 text-[30px] font-semibold tracking-tight text-white">归集任务监控</div>
              <div className="mt-2 max-w-2xl text-sm leading-6 text-[#eff6ff]/90">
                用于查看归集任务的执行状态、时间进度、完成情况和失败反馈。
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/collection/configs')} className="h-10 rounded-full border-white/20 bg-white/10 px-5 text-[#eff6ff] shadow-none hover:!border-sky-300 hover:!bg-white/15 hover:!text-white">
                  返回归集配置
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading} className="h-10 rounded-full border-white/20 bg-white/10 px-5 text-[#eff6ff] shadow-none hover:!border-sky-300 hover:!bg-white/15 hover:!text-white">
                  刷新任务
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2">
              {[
                { label: '总任务数', value: taskStats?.data?.totalTasks || 0, helper: '当前筛选范围', icon: <PlayCircleOutlined className="text-[#dbeafe]" /> },
                { label: '已完成', value: taskStats?.data?.completedTasks || 0, helper: '完成归集', icon: <CheckCircleOutlined className="text-[#dbeafe]" /> },
                { label: '待执行', value: (taskStats?.data?.pendingTasks ?? 0) + (taskStats?.data?.executingTasks ?? 0), helper: '含执行中', icon: <SyncOutlined className="text-[#dbeafe]" /> },
                { label: '成功率', value: `${successRate}%`, helper: '完成/失败比值', icon: <CheckCircleOutlined className="text-[#dbeafe]" /> }
              ].map(item => (
                <div key={item.label} className="rounded-[20px] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.20)_0%,rgba(219,234,254,0.14)_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-[#dbeafe]">{item.label}</div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-2 break-all text-xl font-semibold text-white">{item.value}</div>
                  <div className="mt-1 text-[11px] text-[#dbeafe]">{item.helper}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card
        bordered={false}
        className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_58%,#dbeafe_100%)] shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">监控工作台</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">按状态、时间与配置维度筛选任务</div>
            <div className="mt-1 text-sm text-slate-600">
              支持按任务、配置、状态和日期范围排查执行记录，并可直接查看任务详情。
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 xl:w-[360px]">
            {[
              { label: '失败任务', value: taskStats?.data?.failedTasks || 0, tone: 'bg-[#eff6ff] text-sky-700 border border-sky-100' },
              { label: '执行中', value: taskStats?.data?.executingTasks || 0, tone: 'bg-[#ecfeff] text-cyan-700 border border-cyan-100' },
              { label: '已中止/失效', value: taskStats?.data?.frozenTasks || 0, tone: 'bg-[#dbeafe] text-sky-700 border border-sky-100' }
            ].map(item => (
              <div key={item.label} className={`rounded-2xl px-3 py-3 ${item.tone}`}>
                <div className="text-[11px]">{item.label}</div>
                <div className="mt-1 text-lg font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_0.9fr_0.7fr_1fr_auto]">
          <Input
            placeholder="搜索任务ID或配置ID"
            prefix={<SearchOutlined />}
            allowClear
            value={searchParams.search || ''}
            onChange={(e) => setSearchParams(prev => ({ ...prev, search: e.target.value, page: 1 }))}
          />
          <Input
            placeholder="配置ID"
            allowClear
            value={searchParams.configId || ''}
            onChange={(e) => setSearchParams(prev => ({ ...prev, configId: e.target.value, page: 1 }))}
          />
          <Select
            placeholder="选择状态"
            allowClear
            value={searchParams.status ?? undefined}
            onChange={(value) => setSearchParams(prev => ({ ...prev, status: value as number, page: 1 }))}
          >
            <Option value={CollectionTaskStatus.PENDING}>待执行</Option>
            <Option value={CollectionTaskStatus.RUNNING}>执行中</Option>
            <Option value={CollectionTaskStatus.PARTIAL_SUCCESS}>部分成功</Option>
            <Option value={CollectionTaskStatus.SUCCESS}>成功</Option>
            <Option value={CollectionTaskStatus.FAILED}>失败</Option>
            <Option value={CollectionTaskStatus.CANCELLED}>已取消</Option>
          </Select>
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
          />
          <Button onClick={resetFilters}>重置</Button>
        </div>

        <div className="mb-4 rounded-[18px] border border-sky-100 bg-[#eff6ff] px-4 py-3 text-xs text-slate-500">
          结果区仅保留任务列表，统计与筛选已压缩到上方，便于直接进入排查。
        </div>

        <Table
          columns={columns}
          dataSource={taskData?.data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: taskData?.data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer
        title="归集任务详情"
        placement="right"
        width={560}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detailRecord && (
          <>
            <Descriptions title="任务信息" column={1} bordered size="small">
              <Descriptions.Item label="任务 ID">
                <Text code copyable style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {detailRecord.id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="配置 ID">
                <Text code copyable style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {detailRecord.configId}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="执行状态">
                <Badge
                  status={(getStatusConfig(detailRecord.status).color as any) || 'default'}
                  text={getStatusConfig(detailRecord.status).text}
                />
              </Descriptions.Item>
              {detailRecord.failureReason && (
                <Descriptions.Item label="失败原因">
                  <Text type="danger">{detailRecord.failureReason}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <Descriptions title="归集地址" column={1} bordered size="small">
              <Descriptions.Item label="目标地址">
                <Text code copyable style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {detailRecord.toAddress}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="源地址数量">
                {detailRecord.fromAddressCount} / {detailRecord.expectedFromAddressCount}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="链与代币" column={1} bordered size="small">
              <Descriptions.Item label="链">
                <Space wrap size={[4, 4]}>
                  {detailRecord.chainCodes.map((code: string) => (
                    <Tag key={code} color="blue">{code.toUpperCase()}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="代币">
                <Space wrap size={[4, 4]}>
                  {detailRecord.symbols.map((symbol: string) => (
                    <Tag key={symbol} color="green">{symbol}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="归集金额" column={1} bordered size="small">
              <Descriptions.Item label="预期金额">
                {Object.entries(detailRecord.expectedAmount).map(([symbol, amount]) => (
                  <div key={symbol}>
                    <Text strong>{symbol}: {amount}</Text>
                  </div>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="实际金额">
                {Object.entries(detailRecord.amount).length > 0
                  ? Object.entries(detailRecord.amount).map(([symbol, amount]) => (
                      <div key={symbol}>
                        <Text>{symbol}: {amount}</Text>
                      </div>
                    ))
                  : <Text type="secondary">-</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="手续费">
                {detailRecord.blockFee}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="时间信息" column={1} bordered size="small">
              <Descriptions.Item label="计划执行时间">
                {dayjs(detailRecord.scheduledAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="实际执行时间">
                {detailRecord.executedAt
                  ? dayjs(detailRecord.executedAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {detailRecord.completedAt
                  ? dayjs(detailRecord.completedAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detailRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(detailRecord.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default CollectionTaskPage
