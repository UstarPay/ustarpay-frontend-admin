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
  Popconfirm
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
  ClockCircleOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { collectionService, chainService } from '@/services'
import { 
  TenantCollectionConfig, 
  Status, 
  CollectionConfigType,
  CollectionConfigQueryParams 
} from '@shared/types'

const { Title, Text } = Typography
const { Option } = Select

interface CollectionConfigListProps {
  onCreate: () => void
  onEdit: (config: TenantCollectionConfig) => void
  onDelete: (configId: string) => void
  onExecute: (configId: string) => void
  onSettings: (configId: string) => void
}

const CollectionConfigList: React.FC<CollectionConfigListProps> = ({
  onCreate,
  onEdit,
  onDelete,
  onExecute,
  onSettings
}) => {
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

  // 处理分页
  const handleTableChange = (pagination: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize
    }))
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
              onClick={() => onExecute(record.id)}
              disabled={record.status !== Status.ACTIVE}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="设置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              size="small"
              onClick={() => onSettings(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个归集配置吗？"
            description="删除后无法恢复，请谨慎操作！"
            onConfirm={() => onDelete(record.id)}
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
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="总配置数"
              value={configStats?.data?.totalConfigs || 0}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="活跃配置"
              value={configStats?.data?.activeConfigs || 0}
              prefix={<WalletOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="非活跃配置"
              value={configStats?.data?.inactiveConfigs || 0}
              prefix={<WalletOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="冻结配置"
              value={configStats?.data?.frozenConfigs || 0}
              prefix={<WalletOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={4} style={{ margin: 0 }}>搜索筛选</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={onCreate}
          >
            创建归集配置
          </Button>
        </div>
        
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

      {/* 配置列表 */}
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
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}

export default CollectionConfigList 
