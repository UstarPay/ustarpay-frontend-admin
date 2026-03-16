import React, { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  WalletOutlined
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { chainService, collectionService } from '@/services'
import {
  CollectionConfigQueryParams,
  CollectionConfigType,
  Status,
  TenantCollectionConfig
} from '@shared/types'
import { CollectionConfigForm } from './components'

const { Text } = Typography
const { Option } = Select

const CollectionConfigPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editingConfig, setEditingConfig] = useState<TenantCollectionConfig | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [searchParams, setSearchParams] = useState<CollectionConfigQueryParams>({
    page: 1,
    pageSize: 10,
    status: undefined,
    chainCode: undefined,
    symbol: undefined
  })

  const { data: chainsData, isLoading: chainsLoading } = useQuery({
    queryKey: ['chains', 'active'],
    queryFn: async () => {
      try {
        const result = await chainService.getActiveChains()
        return result.success ? result.data : null
      } catch (error) {
        console.error('获取链数据失败:', error)
        return null
      }
    }
  })

  const { data: configData, isLoading, refetch } = useQuery({
    queryKey: ['collection-configs', searchParams],
    queryFn: () => collectionService.getConfigs(searchParams)
  })

  const { data: configStats } = useQuery({
    queryKey: ['collection-config-stats'],
    queryFn: () => collectionService.getConfigStats()
  })

  const deleteConfigMutation = useMutation({
    mutationFn: collectionService.deleteConfig,
    onSuccess: () => {
      message.success('归集配置删除成功')
      queryClient.invalidateQueries({ queryKey: ['collection-configs'] })
      queryClient.invalidateQueries({ queryKey: ['collection-config-stats'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除失败')
    }
  })

  const executeCollectionMutation = useMutation({
    mutationFn: collectionService.executeCollection,
    onSuccess: (res) => {
      if (res?.code === 'TASK_ALREADY_EXISTS' || res?.code === 'NO_FUNDS_AVAILABLE') {
        message.info(res?.message || '执行完成')
      } else if (res?.data != null) {
        message.success('执行成功')
      } else {
        message.info(res?.message || '执行完成')
      }
      queryClient.invalidateQueries({ queryKey: ['collection-configs'] })
      queryClient.invalidateQueries({ queryKey: ['collection-tasks'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '执行失败')
    }
  })

  const allCurrencies = (chainsData?.items as any[])?.flatMap((chain: any) => {
    if (!chain?.chainCode || !chain?.chainName || !Array.isArray(chain.currencies)) {
      return []
    }

    return chain.currencies
      .filter((currency: any) => currency?.symbol && currency?.name)
      .map((currency: any) => ({
        ...currency,
        chainCode: chain.chainCode,
        chainName: chain.chainName
      }))
  }) || []

  const filteredCurrencies = searchParams.chainCode
    ? allCurrencies.filter(currency => currency.chainCode === searchParams.chainCode)
    : allCurrencies

  const configList = configData?.data?.items || []
  const stats = configStats?.data
  const latestExecution = useMemo(() => {
    const executions = configList
      .map(item => item.lastExecution)
      .filter(Boolean)
      .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())

    return executions[0]
  }, [configList])

  const handleChainCodeChange = (value: string) => {
    setSearchParams(prev => ({
      ...prev,
      page: 1,
      chainCode: value,
      symbol: undefined
    }))
  }

  const handleCreate = () => {
    setEditingConfig(null)
    setFormVisible(true)
  }

  const handleEdit = (config: TenantCollectionConfig) => {
    setEditingConfig(config)
    setFormVisible(true)
  }

  const handleDelete = async (configId: string) => {
    try {
      await deleteConfigMutation.mutateAsync(configId)
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleExecute = async (configId: string) => {
    try {
      await executeCollectionMutation.mutateAsync(configId)
    } catch (error) {
      console.error('执行失败:', error)
    }
  }

  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingConfig(null)
    queryClient.invalidateQueries({ queryKey: ['collection-configs'] })
    queryClient.invalidateQueries({ queryKey: ['collection-config-stats'] })
  }

  const resetFilters = () => {
    setSearchParams({
      page: 1,
      pageSize: 10,
      status: undefined,
      chainCode: undefined,
      symbol: undefined
    })
  }

  const getStatusConfig = (status: Status) => {
    const statusConfig = {
      [Status.ACTIVE]: { text: '活跃', color: 'green' },
      [Status.INACTIVE]: { text: '非活跃', color: 'orange' },
      [Status.DELETED]: { text: '冻结', color: 'red' }
    }
    return statusConfig[status] || { text: '未知', color: 'default' }
  }

  const getConfigTypeConfig = (type: CollectionConfigType) => {
    const typeConfig = {
      [CollectionConfigType.FULL_CHAIN]: { text: '全链', color: 'blue' },
      [CollectionConfigType.PARTIAL_CHAIN]: { text: '部分链', color: 'cyan' },
      [CollectionConfigType.FULL_SYMBOL]: { text: '全币种', color: 'purple' },
      [CollectionConfigType.PARTIAL_SYMBOL]: { text: '部分币种', color: 'geekblue' }
    }
    return typeConfig[type] || { text: '未知', color: 'default' }
  }

  const columns = [
    {
      title: '配置名称',
      key: 'name',
      render: (_: any, record: TenantCollectionConfig) => (
        <Space align="start">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <WalletOutlined />
          </div>
          <div>
            <div className="font-medium text-slate-900">
              归集到: {record.toAddress.slice(0, 6)}...{record.toAddress.slice(-4)}
            </div>
            <Text type="secondary" className="text-xs">
              ID: {record.id}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '支持的链',
      key: 'chainCodes',
      render: (_: any, record: TenantCollectionConfig) => (
        <div>
          {record.chainCodes && record.chainCodes.length > 0 ? (
            record.chainCodes.map((code: string) => (
              <Tag key={code} color="blue" className="mb-1">
                {code.toUpperCase()}
              </Tag>
            ))
          ) : (
            <Tag color="orange">全部</Tag>
          )}
          <div className="mt-1">
            <Tag color={getConfigTypeConfig(record.configChainType).color}>
              {getConfigTypeConfig(record.configChainType).text}
            </Tag>
          </div>
        </div>
      )
    },
    {
      title: '支持的代币',
      key: 'symbols',
      render: (_: any, record: TenantCollectionConfig) => (
        <div>
          {record.symbols && record.symbols.length > 0 ? (
            record.symbols.map((symbol: string) => (
              <Tag key={symbol} color="green" className="mb-1">
                {symbol}
              </Tag>
            ))
          ) : (
            <Tag color="orange">全部</Tag>
          )}
          <div className="mt-1">
            <Tag color={getConfigTypeConfig(record.configCurrencyType).color}>
              {getConfigTypeConfig(record.configCurrencyType).text}
            </Tag>
          </div>
        </div>
      )
    },
    {
      title: '触发条件',
      key: 'trigger',
      render: (_: any, record: TenantCollectionConfig) => (
        <div>
          <div className="font-medium text-slate-900">阈值: {record.triggerThreshold}</div>
          <Text type="secondary" className="text-xs">
            最小归集: {record.minCollectAmount} | Gas余额: {record.minGasBalance}
          </Text>
        </div>
      )
    },
    {
      title: '调度设置',
      key: 'schedule',
      render: (_: any, record: TenantCollectionConfig) => (
        <div>
          <div className="font-medium text-slate-900">
            <ClockCircleOutlined className="mr-1" />
            {record.scheduleCron}
          </div>
          <Text type="secondary" className="text-xs">
            上次执行: {record.lastExecution ? new Date(record.lastExecution).toLocaleString('zh-CN') : '从未执行'}
          </Text>
        </div>
      )
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: TenantCollectionConfig) => {
        const statusConfig = getStatusConfig(record.status)
        return (
          <div>
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            <div className="mt-1">
              <Text type="secondary" className="text-xs">
                创建: {new Date(record.createdAt).toLocaleDateString('zh-CN')}
              </Text>
            </div>
          </div>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: TenantCollectionConfig) => (
        <Space size="small">
          <Tooltip title="立即执行">
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handleExecute(record.id)}
              disabled={record.status !== Status.ACTIVE}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个归集配置吗？"
            description="删除后无法恢复，请谨慎操作！"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="space-y-6 p-6">
      <Card
        bordered={false}
        className="overflow-hidden rounded-[32px] border border-[#dbe8f6] bg-[linear-gradient(135deg,#f8fbff_0%,#edf5ff_46%,#ffffff_100%)] shadow-[0_24px_60px_rgba(37,99,235,0.08)]"
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative overflow-hidden px-6 py-6 lg:px-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2563eb_0%,#0ea5e9_45%,#93c5fd_100%)]" />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr_0.8fr]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.34em] text-sky-700/70">Collection Orchestration</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">归集配置</div>
              <div className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                用于维护归集地址、触发阈值、Cron 调度、支持链路与币种配置，并查看归集任务运行情况。
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading} className="h-10 rounded-full px-5">
                  刷新配置
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} className="h-10 rounded-full bg-[#2563eb] px-5 shadow-none hover:!bg-[#1d4ed8]">
                  新建归集配置
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_55%,#0f172a_100%)] p-5 text-white shadow-[0_22px_50px_rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-sky-100/70">Task Center</div>
                  <div className="mt-2 text-2xl font-semibold">归集任务</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <SyncOutlined className="text-xl text-sky-100" />
                </div>
              </div>
              <div className="mt-4 text-sm leading-6 text-slate-200">
                用于查看归集任务的执行进度、积压数量、最近调度与异常反馈。
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 px-4 py-4">
                  <div className="text-xs text-sky-100/70">待执行</div>
                  <div className="mt-1 text-3xl font-semibold">{stats?.pendingCollections || 0}</div>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-4">
                  <div className="text-xs text-sky-100/70">已完成</div>
                  <div className="mt-1 text-3xl font-semibold">{stats?.completedCollections || 0}</div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="primary"
                  size="large"
                  icon={<SyncOutlined />}
                  onClick={() => navigate('/collection/tasks')}
                  className="h-11 rounded-full bg-white px-6 text-slate-900 shadow-none hover:!bg-sky-50 hover:!text-slate-900"
                >
                  打开归集任务
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: '活跃配置',
                  value: stats?.activeConfigs || 0,
                  helper: `总数 ${stats?.totalConfigs || 0}`,
                  tone: 'bg-emerald-50',
                  icon: <CheckCircleOutlined className="text-emerald-600" />
                },
                {
                  label: '待执行任务',
                  value: stats?.pendingCollections || 0,
                  helper: '当前积压',
                  tone: 'bg-amber-50',
                  icon: <ClockCircleOutlined className="text-amber-500" />
                },
                {
                  label: '总归集次数',
                  value: stats?.totalCollections || 0,
                  helper: `今日 ${stats?.todayCollections || 0} 次`,
                  tone: 'bg-sky-50',
                  icon: <ReloadOutlined className="text-sky-600" />
                },
                {
                  label: '最近执行',
                  value: latestExecution ? new Date(latestExecution).toLocaleDateString('zh-CN') : '暂无',
                  helper: latestExecution ? '最新调度时间' : '尚未触发',
                  tone: 'bg-violet-50',
                  icon: <SyncOutlined className="text-violet-600" />
                }
              ].map(item => (
                <div key={item.label} className={`rounded-[22px] border border-slate-200 ${item.tone} px-4 py-4`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-3 break-all text-2xl font-semibold text-slate-900">{item.value}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.helper}</div>
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
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.8fr] xl:items-center">
          <div>
            <div className="text-sm font-medium text-slate-500">配置工作台</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">配置筛选与任务联动面板</div>
            <div className="mt-2 text-sm text-slate-600">
              首页风格强调任务入口，下面保留配置筛选、任务跳转和批量排查能力。
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: '总归集金额', value: stats?.totalAmount || '0', tone: 'bg-slate-100 text-slate-700' },
              { label: '今日金额', value: stats?.todayAmount || '0', tone: 'bg-sky-50 text-sky-700' },
              { label: '已完成任务', value: stats?.completedCollections || 0, tone: 'bg-emerald-50 text-emerald-700' }
            ].map(item => (
              <div key={item.label} className={`rounded-2xl px-4 py-3 ${item.tone}`}>
                <div className="text-xs">{item.label}</div>
                <div className="mt-1 text-xl font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.7fr_auto_auto]">
          <Input
            placeholder="搜索目标地址"
            prefix={<SearchOutlined />}
            allowClear
            value={searchParams.search || ''}
            onChange={(e) => setSearchParams(prev => ({ ...prev, page: 1, search: e.target.value }))}
          />
          <Select
            placeholder="选择链"
            allowClear
            value={searchParams.chainCode || undefined}
            onChange={handleChainCodeChange}
            loading={chainsLoading}
          >
            {chainsData?.items?.map((chain: any) => (
              <Option key={chain.chainCode} value={chain.chainCode}>
                {chain.chainName}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="选择代币"
            allowClear
            value={searchParams.symbol || undefined}
            onChange={(value) => setSearchParams(prev => ({ ...prev, page: 1, symbol: value }))}
            disabled={chainsLoading}
          >
            {filteredCurrencies.map((currency: any) => (
              <Option key={`${currency.chainCode}-${currency.symbol}`} value={currency.symbol}>
                {currency.symbol} ({currency.chainName})
              </Option>
            ))}
          </Select>
          <Select
            placeholder="选择状态"
            allowClear
            value={searchParams.status || undefined}
            onChange={(value) => setSearchParams(prev => ({ ...prev, page: 1, status: value as Status }))}
          >
            <Option value={Status.ACTIVE}>活跃</Option>
            <Option value={Status.INACTIVE}>非活跃</Option>
            <Option value={Status.DELETED}>冻结</Option>
          </Select>
          <Button onClick={resetFilters}>重置</Button>
        </div>

        <Table
          columns={columns}
          dataSource={configList}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: configData?.data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={(pagination) => {
            setSearchParams(prev => ({
              ...prev,
              page: pagination.current || 1,
              pageSize: pagination.pageSize || 10
            }))
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <CollectionConfigForm
        visible={formVisible}
        editingConfig={editingConfig}
        onCancel={() => {
          setFormVisible(false)
          setEditingConfig(null)
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}

export default CollectionConfigPage
