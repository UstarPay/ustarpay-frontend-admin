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
  Badge
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  WalletOutlined,
  CloudOutlined,
  SettingOutlined,
  CopyOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { coldWalletService, chainService } from '@/services'
import type { ColdWalletWithBalance, ColdWallet, Chain, Status, WalletQueryParams } from '@shared/types'
import { WalletStatus } from '@shared/types'

// 临时类型定义，匹配实际 API 响应
interface ActualColdWalletWithBalance {
  wallet: ColdWallet
  balanceByChain: any
}

const { Title, Text } = Typography
const { Option } = Select

interface ColdWalletListProps {
  onCreate: () => void
  onEdit: (wallet: ActualColdWalletWithBalance) => void
  onDelete: (walletId: string) => void
  onViewDetail: (walletId: string) => void
  onSettings: (walletId: string) => void
}


const ColdWalletList: React.FC<ColdWalletListProps> = ({
  onCreate,
  onEdit,
  onDelete,
  onViewDetail,
  onSettings
}) => {

  const initialSearchParams = {
    page: 1,
    pageSize: 10,
    search: undefined as string | undefined,
    chainCodes: undefined as string[] | undefined,
    symbols: undefined as string[] | undefined,
    status: undefined as Status | undefined
  }

  const [searchParams, setSearchParams] = useState<WalletQueryParams>(initialSearchParams)

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
  const allCurrencies = (chainsData?.items as Chain[])?.flatMap((chain: Chain) => {
    if (!chain?.chainCode || !chain?.chainName || !Array.isArray(chain.currencies)) {
      return []
    }
    return chain.currencies
      .filter((currency: any) => currency?.symbol && currency?.name) // 过滤掉无效代币
      .map((currency: any) => ({
        ...currency,
        chainCode: chain.chainCode,
        chainName: chain.chainName
      }))
  }) || []

  // 根据已选择的链筛选代币
  const filteredCurrencies = searchParams.chainCodes?.length
    ? allCurrencies.filter(currency => searchParams.chainCodes!.includes(currency.chainCode))
    : allCurrencies

  // 处理链选择变化
  const handleChainCodeChange = (value: string) => {
    setSearchParams(prev => ({
      ...prev,
      chainCodes: value ? [value] : undefined,
      symbols: undefined // 清空代币选择，因为代币列表会改变
    }))
  }

  // 获取冷钱包列表
  const { data: walletData, isLoading, refetch } = useQuery({
    queryKey: ['cold-wallets', searchParams],
    queryFn: () => coldWalletService.getColdWallets({
      ...searchParams,
    })
  })

  // 获取冷钱包统计
  const { data: walletStats } = useQuery({
    queryKey: ['cold-wallet-stats'],
    queryFn: () => coldWalletService.getColdWallets()
  })

  // 调试信息
  console.log('ColdWalletList - walletData:', walletData)
  console.log('ColdWalletList - walletData?.items:', walletData?.data?.items)

  // 处理分页
  const handleTableChange = (pagination: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  // 表格列定义
  const columns = [
    {
      title: '钱包名称',
      dataIndex: ['wallet', 'name'],
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <WalletOutlined style={{ color: '#1890ff' }} />
          <div>
            <div className="font-medium">{record.wallet?.name || '未知'}</div>
            <Text type="secondary" className="text-xs">
              {record.wallet?.description || '暂无描述'}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '钱包地址',
      dataIndex: ['wallet', 'address'],
      key: 'address',
      render: (_: string, record: any) => {
        const address = record.wallet?.address
        if (!address) return <Text type="secondary">未知地址</Text>
        return (
          <Text
            copyable={{
              text: address,
              icon: [<CopyOutlined key="copy" />, <CopyOutlined key="copied" />],
              tooltips: ['复制地址', '已复制'],
            }}
            className="font-mono text-xs"
          >
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </Text>
        )
      }
    },
    {
      title: '支持的链',
      dataIndex: ['wallet', 'chainCodes'],
      key: 'chainCodes',
      render: (chainCodes: string[], record: any) => (
        <div>
          {record.wallet?.chainCodes?.length > 0 ? (
            record.wallet.chainCodes.map((code: string) => (
              <Tag key={`${record.wallet?.id}-chain-${code}`} color="blue" className="mb-1">
                {code.toUpperCase()}
              </Tag>
            ))
          ) : (
            <Tag key={`${record.wallet?.id}-chain-all`} color="orange">全部</Tag>
          )}
        </div>
      )
    },
    {
      title: '支持的代币',
      dataIndex: ['wallet', 'symbols'],
      key: 'symbols',
      render: (symbols: string[], record: any) => (
        <div>
          {record.wallet?.symbols?.length > 0 ? (
            record.wallet.symbols.map((symbol: string) => (
              <Tag key={`${record.wallet?.id}-symbol-${symbol}`} color="green" className="mb-1">
                {symbol}
              </Tag>
            ))
          ) : (
            <Tag key={`${record.wallet?.id}-symbol-all`} color="orange">全部</Tag>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: ['wallet', 'status'],
      key: 'status',
      render: (status: WalletStatus, record: any) => {
        const statusConfig: Record<number, { text: string; color: string }> = {
          [WalletStatus.ACTIVE]: { text: '活跃', color: 'green' },
          [WalletStatus.INACTIVE]: { text: '非活跃', color: 'orange' },
          [WalletStatus.FROZEN]: { text: '冻结', color: 'red' }
        }
        const config = statusConfig[record.wallet?.status]
        return <Tag color={config?.color || 'default'}>{config?.text || '未知'}</Tag>
      }
    },
    {
      title: '钱包类型',
      key: 'walletType',
      render: (_: any, record: any) => (
        <div>
          <Tag color="cyan" className="mb-1">
            <CloudOutlined /> 冷钱包
          </Tag>
          <Text type="secondary" className="text-xs block">
            无私钥存储
          </Text>
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: ['wallet', 'createdAt'],
      key: 'createdAt',
      render: (createdAt: string, record: any) => (
        <div className="text-xs">
          {record.wallet?.createdAt ?
            new Date(record.wallet.createdAt).toLocaleString('zh-CN') :
            '未知'
          }
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => onViewDetail(record.wallet?.id)}
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
              onClick={() => onSettings(record.wallet?.id)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个冷钱包吗？"
            description="删除后无法恢复，请谨慎操作！"
            onConfirm={() => onDelete(record.wallet?.id)}
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
              title="总冷钱包数"
              value={walletStats?.data?.total || 0}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="活跃钱包"
              value={walletStats?.data?.items?.filter((w: any) => w.wallet?.status === WalletStatus.ACTIVE)?.length || 0}
              prefix={<CloudOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="总余额"
              value="0.00000000"
              precision={8}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="今日交易"
              value={0}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
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
            创建冷钱包
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="搜索钱包名称或描述"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
            onChange={(e) => setSearchParams(prev => ({ ...prev, search: e.target.value }))}
          />
          <Select
            placeholder="选择链"
            style={{ width: 120 }}
            allowClear
            value={searchParams.chainCodes || undefined}
            onChange={(value) => setSearchParams(prev => ({ ...prev, chainCodes: value }))}
            loading={chainsLoading}
          >
            {chainsData?.items?.map((chain: Chain) => (
              <Option key={chain.chainCode} value={chain.chainCode}>
                {chain.chainName}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="选择代币"
            style={{ width: 120 }}
            allowClear
            value={searchParams.symbols || undefined}
            onChange={(value) => setSearchParams(prev => ({ ...prev, symbols: value }))}
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
            <Option value={WalletStatus.ACTIVE}>活跃</Option>
            <Option value={WalletStatus.INACTIVE}>非活跃</Option>
            <Option value={WalletStatus.FROZEN}>冻结</Option>
          </Select>
          <Button onClick={() => {
            setSearchParams(initialSearchParams)
          }}>
            重置
          </Button>
        </div>
      </Card>

      {/* 钱包列表 */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Text strong>冷钱包列表</Text>
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
          dataSource={walletData?.data?.items || []}
          rowKey={(record) => record.wallet?.id || record.id}
          loading={isLoading}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: walletData?.data?.total || 0,
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

export default ColdWalletList
