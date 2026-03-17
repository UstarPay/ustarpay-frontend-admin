import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Popconfirm,
  Badge,
  Switch,
  Modal,
  Form,
  message
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  FilterOutlined
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collectionService, chainService } from '@/services'
import { 
  TenantCollectionConfig, 
  Status, 
  CollectionConfigType,
  CollectionConfigQueryParams 
} from '@shared/types'
import { CollectionConfigForm } from './components'

const { Title, Text } = Typography
const { Option } = Select

interface CollectionStats {
  totalConfigs: number
  activeConfigs: number
  totalCollections: number
  totalAmount: string
  todayCollections: number
  todayAmount: string
  pendingCollections: number
  completedCollections: number
}

const CollectionConfigPage: React.FC = () => {
  const queryClient = useQueryClient()
  
  // 状态管理
  const [editingConfig, setEditingConfig] = useState<TenantCollectionConfig | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [searchParams, setSearchParams] = useState<CollectionConfigQueryParams>({
    page: 1,
    pageSize: 10,
    status: undefined,
    chainCode: undefined,
    symbol: undefined
  })

  // 获取链列表
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

  // 从 chains 数据中提取所有代币
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

  // 根据已选择的链筛选代币
  const filteredCurrencies = searchParams.chainCode
    ? allCurrencies.filter(currency => currency.chainCode === searchParams.chainCode)
    : allCurrencies

  // 处理链选择变化
  const handleChainCodeChange = (value: string) => {
    setSearchParams(prev => ({ 
      ...prev, 
      chainCode: value,
      symbol: undefined
    }))
  }

  // 获取归集配置列表
  const { data: configData, isLoading, refetch } = useQuery({
    queryKey: ['collection-configs', searchParams],
    queryFn: () => collectionService.getConfigs(searchParams)
  })

  // 获取配置统计
  const { data: configStats } = useQuery({
    queryKey: ['collection-config-stats'],
    queryFn: () => collectionService.getConfigStats()
  })

  // 删除归集配置
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

  // 立即执行归集
  const executeCollectionMutation = useMutation({
    mutationFn: collectionService.executeCollection,
    onSuccess: (res) => {
      // TASK_ALREADY_EXISTS / NO_FUNDS_AVAILABLE 时展示 message；data 有任务对象时展示执行成功
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

  // 处理创建
  const handleCreate = () => {
    setEditingConfig(null)
    setFormVisible(true)
  }

  // 处理编辑
  const handleEdit = (config: TenantCollectionConfig) => {
    setEditingConfig(config)
    setFormVisible(true)
  }

  // 处理删除
  const handleDelete = async (configId: string) => {
    try {
      await deleteConfigMutation.mutateAsync(configId)
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 处理立即执行
  const handleExecute = async (configId: string) => {
    try {
      await executeCollectionMutation.mutateAsync(configId)
    } catch (error) {
      console.error('执行失败:', error)
    }
  }

  // 处理设置
  const handleSettings = (configId: string) => {
    // TODO: 实现设置页面路由
    message.info('设置功能待实现')
  }

  // 处理表单成功
  const handleFormSuccess = () => {
    setFormVisible(false)
    setEditingConfig(null)
    queryClient.invalidateQueries({ queryKey: ['collection-configs'] })
    queryClient.invalidateQueries({ queryKey: ['collection-config-stats'] })
  }

  // 获取状态配置
  const getStatusConfig = (status: Status) => {
    const statusConfig = {
      [Status.ACTIVE]: { text: '活跃', color: 'green' },
      [Status.INACTIVE]: { text: '非活跃', color: 'orange' },
      [Status.DELETED]: { text: '冻结', color: 'red' }
    }
    return statusConfig[status] || { text: '未知', color: 'default' }
  }

  // 获取配置类型配置
  const getConfigTypeConfig = (type: CollectionConfigType) => {
    const typeConfig = {
      [CollectionConfigType.FULL_CHAIN]: { text: '全链', color: 'blue' },
      [CollectionConfigType.PARTIAL_CHAIN]: { text: '部分链', color: 'cyan' },
      [CollectionConfigType.FULL_SYMBOL]: { text: '全币种', color: 'purple' },
      [CollectionConfigType.PARTIAL_SYMBOL]: { text: '部分币种', color: 'geekblue' }
    }
    return typeConfig[type] || { text: '未知', color: 'default' }
  }

  // 表格列定义
  const columns = [
    {
      title: '配置名称',
      key: 'name',
      render: (_: any, record: TenantCollectionConfig) => (
        <Space>
          <WalletOutlined style={{ color: '#1890ff' }} />
          <div>
            <div className="font-medium">
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
      render: (chainCodes: string[], record: TenantCollectionConfig) => (
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
      render: (symbols: string[], record: TenantCollectionConfig) => (
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
          <div className="font-medium">
            阈值: {record.triggerThreshold}
          </div>
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
          <div className="font-medium">
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
      render: (status: Status, record: TenantCollectionConfig) => {
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
          <Tooltip title="设置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              size="small"
              onClick={() => handleSettings(record.id)}
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
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ margin: 0 }}>
          <WalletOutlined className="mr-2" style={{ color: '#1890ff' }} />
          自动归集配置
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleCreate}
          >
            新建归集配置
          </Button>
        </Space>
      </div>

      {/* 总体概览 */}
      {configStats?.data && (
        <Card className="mb-6" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <div className="text-white">
                <div className="text-lg font-medium mb-1">归集配置总览</div>
                <div className="text-sm opacity-80">
                  共 {configStats.data.totalConfigs || 0} 个配置，{configStats.data.activeConfigs || 0} 个活跃
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="text-white text-center">
                <div className="text-2xl font-bold mb-1">
                  {configStats.data.totalCollections || 0}
                </div>
                <div className="text-sm opacity-80">总归集次数</div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="text-white text-right">
                <div className="text-2xl font-bold mb-1">
                  {configStats.data.totalAmount || '0'}
                </div>
                <div className="text-sm opacity-80">总归集金额</div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 统计信息 */}
      {configStats?.data && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={6}>
            <Card 
              className="relative overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              {/* 顶部彩色条 */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: '#1890ff' }}
              />
              <Statistic
                title="总配置数"
                value={configStats.data.totalConfigs || 0}
                valueStyle={{ color: '#1890ff' }}
                prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
              />
              <div className="mt-2 text-xs text-gray-500">
                非活跃: {configStats.data.inactiveConfigs || 0} | 冻结: {configStats.data.frozenConfigs || 0}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              className="relative overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              {/* 顶部彩色条 */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: '#52c41a' }}
              />
              <Statistic
                title="活跃配置"
                value={configStats.data.activeConfigs || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
              <div className="mt-2 text-xs text-gray-500">
                占比: {configStats.data.totalConfigs ? Math.round((configStats.data.activeConfigs / configStats.data.totalConfigs) * 100) : 0}%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              className="relative overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              {/* 顶部彩色条 */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: '#faad14' }}
              />
              <Statistic
                title="总归集次数"
                value={configStats.data.totalCollections || 0}
                valueStyle={{ color: '#faad14' }}
                prefix={<ReloadOutlined style={{ color: '#faad14' }} />}
              />
              <div className="mt-2 text-xs text-gray-500">
                今日: {configStats.data.todayCollections || 0} 次
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              className="relative overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              {/* 顶部彩色条 */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: '#722ed1' }}
              />
              <Statistic
                title="总归集金额"
                value={configStats.data.totalAmount || '0'}
                valueStyle={{ color: '#722ed1' }}
                prefix={<WalletOutlined style={{ color: '#722ed1' }} />}
              />
              <div className="mt-2 text-xs text-gray-500">
                今日: {configStats.data.todayAmount || '0'}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 今日统计 */}
      {configStats?.data && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card 
              className="relative overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              {/* 顶部彩色条 */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: '#1890ff' }}
              />
              <Statistic
                title="今日归集"
                value={configStats.data.todayCollections || 0}
                suffix={`次 / ${configStats.data.todayAmount || 0}`}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ReloadOutlined style={{ color: '#1890ff' }} />}
              />
              <div className="mt-2 text-xs text-gray-500">
                总归集: {configStats.data.totalCollections || 0} 次
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              className="relative overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              {/* 顶部彩色条 */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: '#faad14' }}
              />
              <Statistic
                title="待执行"
                value={configStats.data.pendingCollections || 0}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              />
              <div className="mt-2 text-xs text-gray-500">
                已完成: {configStats.data.completedCollections || 0} 次
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              className="relative overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              {/* 顶部彩色条 */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: '#52c41a' }}
              />
              <Statistic
                title="已完成"
                value={configStats.data.completedCollections || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
              <div className="mt-2 text-xs text-gray-500">
                成功率: {configStats.data.totalCollections ? Math.round((configStats.data.completedCollections / configStats.data.totalCollections) * 100) : 0}%
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 链和代币分布统计 */}
      {configStats?.data && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12}>
            <Card 
              title={
                <div className="flex items-center">
                  <FilterOutlined className="mr-2" style={{ color: '#1890ff' }} />
                  按链分布
                </div>
              }
              className="h-full"
            >
              {Object.keys(configStats.data.configsByChain || {}).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(configStats.data.configsByChain || {})
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([chainCode, count]) => (
                      <div key={chainCode} className="flex justify-between items-center">
                        <span className="font-medium">{chainCode}</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ 
                                width: `${configStats.data.totalConfigs ? (count / configStats.data.totalConfigs) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">暂无链分布数据</div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card 
              title={
                <div className="flex items-center">
                  <WalletOutlined className="mr-2" style={{ color: '#52c41a' }} />
                  按代币分布
                </div>
              }
              className="h-full"
            >
              {Object.keys(configStats.data.configsBySymbol || {}).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(configStats.data.configsBySymbol || {})
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([symbol, count]) => (
                      <div key={symbol} className="flex justify-between items-center">
                        <span className="font-medium">{symbol}</span>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ 
                                width: `${configStats.data.totalConfigs ? (count / configStats.data.totalConfigs) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">暂无代币分布数据</div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* 性能指标 */}
      {configStats?.data && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card 
              title={
                <div className="flex items-center">
                  <CheckCircleOutlined className="mr-2" style={{ color: '#52c41a' }} />
                  活跃率
                </div>
              }
              className="text-center"
            >
              <div className="text-3xl font-bold" style={{ color: '#52c41a' }}>
                {configStats.data.totalConfigs ? Math.round((configStats.data.activeConfigs / configStats.data.totalConfigs) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {configStats.data.activeConfigs || 0} / {configStats.data.totalConfigs || 0}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              title={
                <div className="flex items-center">
                  <ReloadOutlined className="mr-2" style={{ color: '#1890ff' }} />
                  今日归集率
                </div>
              }
              className="text-center"
            >
              <div className="text-3xl font-bold" style={{ color: '#1890ff' }}>
                {configStats.data.totalCollections ? Math.round((configStats.data.todayCollections / configStats.data.totalCollections) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {configStats.data.todayCollections || 0} / {configStats.data.totalCollections || 0}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              title={
                <div className="flex items-center">
                  <CheckCircleOutlined className="mr-2" style={{ color: '#faad14' }} />
                  完成率
                </div>
              }
              className="text-center"
            >
              <div className="text-3xl font-bold" style={{ color: '#faad14' }}>
                {configStats.data.totalCollections ? Math.round((configStats.data.completedCollections / configStats.data.totalCollections) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {configStats.data.completedCollections || 0} / {configStats.data.totalCollections || 0}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="搜索目标地址"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
            onChange={(e) => setSearchParams(prev => ({ ...prev, search: e.target.value }))}
          />
          <Select
            placeholder="选择链"
            style={{ width: 120 }}
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
            style={{ width: 120 }}
            allowClear
            value={searchParams.symbol || undefined}
            onChange={(value) => setSearchParams(prev => ({ ...prev, symbol: value }))}
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
            style={{ width: 120 }}
            allowClear
            value={searchParams.status || undefined}
            onChange={(value) => setSearchParams(prev => ({ ...prev, status: value as Status }))}
          >
            <Option value={Status.ACTIVE}>活跃</Option>
            <Option value={Status.INACTIVE}>非活跃</Option>
            <Option value={Status.DELETED}>冻结</Option>
          </Select>
          <Button onClick={() => {
            setSearchParams({
              page: 1,
              pageSize: 10,
              status: undefined,
              chainCode: undefined,
              symbol: undefined
            })
          }}>
            重置
          </Button>
        </div>
      </Card>

      {/* 归集配置列表 */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Text strong>归集配置列表</Text>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            刷新
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={configData?.data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: configData?.data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
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

      {/* 创建/编辑表单模态框 */}
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
