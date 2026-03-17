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
  FireOutlined,
  SettingOutlined,
  CopyOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { hotWalletService } from '@/services'
import type { HotWalletWithBalance, HotWallet, WalletQueryParams, Status } from '@shared/types'
import { WalletStatus } from '@shared/types'

// 临时类型定义，匹配实际 API 响应
interface ActualHotWalletWithBalance {
  wallet: HotWallet
  balanceByChain: any
}

const { Title, Text } = Typography
const { Option } = Select

interface HotWalletListProps {
  onCreate: () => void
  onEdit: (wallet: ActualHotWalletWithBalance) => void
  onDelete: (walletId: string) => void
  onViewDetail: (walletId: string) => void
  onSettings: (walletId: string) => void
}

const HotWalletList: React.FC<HotWalletListProps> = ({
  onCreate,
  onEdit,
  onDelete,
  onViewDetail,
  onSettings
}) => {

  const initialSearchParams = {
    page: 1,
    pageSize: 10,
    search: undefined as string |undefined,
    chainCode: undefined as string | undefined,
    symbol: undefined as string | undefined,
    status: undefined as Status | undefined
  }
  const [searchParams, setSearchParams] = useState<WalletQueryParams>(initialSearchParams)

  // 获取热钱包列表
  const { data: walletData, isLoading, refetch } = useQuery({
    queryKey: ['hot-wallets', searchParams],
    queryFn: () => hotWalletService.getHotWallets({
      ...searchParams,
    })
  })

  // 调试信息
  console.log('HotWalletList - walletData:', walletData)
  console.log('HotWalletList - walletData?.items:', walletData?.data.items)

  // 获取热钱包统计
  const { data: walletStats } = useQuery({
    queryKey: ['hot-wallet-stats'],
    queryFn: () => hotWalletService.getHotWalletStats()
  })

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
              <Tag key={code} color="blue" className="mb-1">
                {code.toUpperCase()}
              </Tag>
            ))
          ) : (
            <Tag color="orange">全部</Tag>
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
              <Tag key={symbol} color="green" className="mb-1">
                {symbol}
              </Tag>
            ))
          ) : (
            <Tag color="orange">全部</Tag>
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
      title: '余额信息',
      key: 'balance',
      render: (_: any, record: any) => {
        const balanceData = record.balanceByChain?.unknown?.unknown
        return (
          <div>
            <div className="font-medium">
              {balanceData?.balance || '0.00000000'}
            </div>
            <Text type="secondary" className="text-xs">
              区块高度: {balanceData?.lastBlockHeight || '未知'}
            </Text>
          </div>
        )
      }
    },
    {
      title: '钱包类型',
      key: 'walletType',
      render: (_: any, record: any) => (
        <div>
          {record.wallet?.isWithdrawalWallet && (
            <Tag color="green" className="mb-1">提现钱包</Tag>
          )}
          {record.wallet?.isGasWallet && (
            <Tag color="blue" className="mb-1">Gas钱包</Tag>
          )}
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
            title="确定要删除这个热钱包吗？"
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
              title="总热钱包数"
              value={walletStats?.totalWallets || 0}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="活跃钱包"
              value={walletStats?.activeWallets || 0}
              prefix={<FireOutlined style={{ color: '#fa541c' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="总余额"
              value={walletStats?.totalBalance || '0'}
              precision={8}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="今日交易"
              value={walletStats?.todayTransactions || 0}
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
            创建热钱包
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
            onChange={(value) => setSearchParams(prev => ({ ...prev, chainCode: value }))}
          >
            <Option value="bitcoin">Bitcoin</Option>
            <Option value="ethereum">Ethereum</Option>
            <Option value="bsc">BSC</Option>
            <Option value="polygon">Polygon</Option>
          </Select>
          <Select
            placeholder="选择代币"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setSearchParams(prev => ({ ...prev, symbol: value }))}
          >
            <Option value="BTC">BTC</Option>
            <Option value="ETH">ETH</Option>
            <Option value="USDT">USDT</Option>
            <Option value="USDC">USDC</Option>
          </Select>
          <Select
            placeholder="选择状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setSearchParams(prev => ({ ...prev, status: value }))}
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
          <Text strong>热钱包列表</Text>
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
          dataSource={walletData?.data.items || []}
          rowKey={(record) => record.wallet?.id || record.id}
          loading={isLoading}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: walletData?.data.total || 0,
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

export default HotWalletList
