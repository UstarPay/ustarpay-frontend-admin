import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Card, 
  Row, 
  Col, 
  Descriptions, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Tabs,
  Table,
  Statistic,
  Progress,
  Alert,
  Tooltip,
  Badge
} from 'antd'
import { 
  WalletOutlined, 
  FireOutlined,
  EyeOutlined,
  CopyOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SettingOutlined,
  TransactionOutlined,
  BookOutlined
} from '@ant-design/icons'
import { walletService } from '@/services'
import dayjs from 'dayjs'
import { Status } from '@shared/types'

const { Title, Text } = Typography
const { TabPane } = Tabs

interface WalletDetail {
  id: string
  name: string
  type: 'hot' | 'cold'
  chain: string
  symbol: string
  balance: string
  lockedBalance: string
  availableBalance: string
  addressCount: number
  status: Status
  createdAt: string
  lastActivity?: string
  settings: WalletSettings
}

interface WalletSettings {
  autoCollection: boolean
  collectionThreshold: number
  withdrawalLimit: number
  dailyWithdrawalLimit: number
  requiresApproval: boolean
  approvers: string[]
}

interface WalletAddress {
  id: string
  address: string
  label?: string
  balance: string
  isUsed: boolean
  lastUsedAt?: string
  createdAt: string
}

interface WalletTransaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'transfer' | 'collection'
  amount: string
  status: 'pending' | 'completed' | 'failed'
  txHash?: string
  blockNumber?: number
  confirmations?: number
  createdAt: string
  fromAddress?: string
  toAddress?: string
}

const WalletDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [wallet, setWallet] = useState<WalletDetail | null>(null)
  const [addresses, setAddresses] = useState<WalletAddress[]>([])
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) {
      loadWalletData()
    }
  }, [id])

  const loadWalletData = async () => {
    try {
      setLoading(true)
      
      // TODO: API不满足需求，使用mock数据
      // 后续需要实现正确的API接口
      const mockWallet: WalletDetail = {
        id: id!,
        name: '测试钱包',
        type: 'hot',
        chain: 'ETH',
        symbol: 'ETH',
        balance: '1.23456789',
        lockedBalance: '0.1',
        availableBalance: '1.13456789',
        addressCount: 5,
        status: Status.ACTIVE,
        createdAt: '2024-01-01T00:00:00Z',
        lastActivity: '2024-12-01T12:00:00Z',
        settings: {
          autoCollection: true,
          collectionThreshold: 0.1,
          withdrawalLimit: 10,
          dailyWithdrawalLimit: 100,
          requiresApproval: false,
          approvers: []
        }
      }
      
      const mockAddresses: WalletAddress[] = [
        {
          id: '1',
          address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          label: '主地址',
          balance: '0.5',
          isUsed: true,
          lastUsedAt: '2024-12-01T10:00:00Z',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          address: '0x8ba1f109551bA432bDfF596e6d3eDc6c6F6E1d3c7',
          label: '备用地址',
          balance: '0.3',
          isUsed: true,
          lastUsedAt: '2024-12-01T09:00:00Z',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          address: '0x9cA8E8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8',
          label: '冷存储',
          balance: '0.4',
          isUsed: false,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ]
      
      const mockTransactions: WalletTransaction[] = [
        {
          id: '1',
          type: 'deposit',
          amount: '0.5',
          status: 'completed',
          txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 12345678,
          confirmations: 12,
          createdAt: '2024-12-01T10:00:00Z',
          fromAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          toAddress: '0x8ba1f109551bA432bDfF596e6d3eDc6c6F6E1d3c7'
        },
        {
          id: '2',
          type: 'withdrawal',
          amount: '0.2',
          status: 'completed',
          txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          blockNumber: 12345679,
          confirmations: 8,
          createdAt: '2024-12-01T09:00:00Z',
          fromAddress: '0x8ba1f109551bA432bDfF596e6d3eDc6c6F6E1d3c7',
          toAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
        },
        {
          id: '3',
          type: 'collection',
          amount: '0.1',
          status: 'pending',
          createdAt: '2024-12-01T08:00:00Z'
        }
      ]
      
      setWallet(mockWallet)
      setAddresses(mockAddresses)
      setTransactions(mockTransactions)
      
      // TODO: 实现真实的API调用
      // try {
      //   const [walletData, transactionsData] = await Promise.all([
      //     walletService.getWallet(id!),
      //     walletService.getWalletTransactions(id!)
      //   ])
      //   
      //   // 处理真实数据...
      // } catch (error) {
      //   console.error('API调用失败:', error)
      // }
      
    } catch (error) {
      console.error('加载钱包详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hot': return 'red'
      case 'cold': return 'blue'
      default: return 'default'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'hot': return '热钱包'
      case 'cold': return '冷钱包'
      default: return type
    }
  }

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.ACTIVE: return 'success'
      case Status.INACTIVE: return 'default'
      case Status.DELETED: return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status: Status) => {
    switch (status) {
      case Status.ACTIVE: return '正常'
      case Status.INACTIVE: return '未激活'
      case Status.DELETED: return '已删除'
      default: return '未知'
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'green'
      case 'withdrawal': return 'red'
      case 'transfer': return 'blue'
      case 'collection': return 'orange'
      default: return 'default'
    }
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'deposit': return '充值'
      case 'withdrawal': return '提现'
      case 'transfer': return '转账'
      case 'collection': return '归集'
      default: return type
    }
  }

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'processing'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const getTransactionStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'pending': return '处理中'
      case 'failed': return '失败'
      default: return status
    }
  }

  const addressColumns = [
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => (
        <Space>
          <Text code style={{ fontSize: '12px' }}>
            {address.slice(0, 8)}...{address.slice(-8)}
          </Text>
          <Tooltip title="复制地址">
            <Button type="text" size="small" icon={<CopyOutlined />} />
          </Tooltip>
          <Tooltip title="查看二维码">
            <Button type="text" size="small" icon={<QrcodeOutlined />} />
          </Tooltip>
        </Space>
      )
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label',
      render: (label: string) => label || '-'
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: string) => (
        <Text strong>{balance}</Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'isUsed',
      key: 'isUsed',
      render: (isUsed: boolean) => (
        <Tag color={isUsed ? 'green' : 'default'}>
          {isUsed ? '已使用' : '未使用'}
        </Tag>
      )
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (date: string) => (
        date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
      )
    }
  ]

  const transactionColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTransactionTypeColor(type)}>
          {getTransactionTypeText(type)}
        </Tag>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string) => (
        <Text strong>{amount}</Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getTransactionStatusColor(status)}>
          {getTransactionStatusText(status)}
        </Tag>
      )
    },
    {
      title: '交易哈希',
      dataIndex: 'txHash',
      key: 'txHash',
      render: (hash: string) => (
        hash ? (
          <Tooltip title={hash}>
            <Text code style={{ cursor: 'pointer', fontSize: '12px' }}>
              {hash.slice(0, 8)}...{hash.slice(-8)}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: '确认数',
      dataIndex: 'confirmations',
      key: 'confirmations',
      render: (confirmations: number) => (
        <Badge count={confirmations} showZero />
      )
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    }
  ]

  if (loading) {
    return <div>加载中...</div>
  }

  if (!wallet) {
    return <Alert message="无法加载钱包信息" type="error" />
  }

  return (
    <div className="p-6">
      {/* TODO提示 */}
      <Alert
        message="开发中 - 使用Mock数据"
        description="当前页面使用模拟数据进行展示，API接口待实现。后续将替换为真实数据。"
        type="info"
        showIcon
        className="mb-4"
        action={
          <Button size="small" type="link">
            了解更多
          </Button>
        }
      />
      
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>钱包详情</Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadWalletData}
            loading={loading}
          >
            刷新
          </Button>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => navigate(`/wallets/${id}/settings`)}
          >
            钱包设置
          </Button>
        </Space>
      </div>

      {/* 基本信息 */}
      <Card className="mb-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <Text className="text-lg font-medium text-gray-700">钱包信息</Text>
          </div>
        </div>
        <Descriptions column={3} size="small">
          <Descriptions.Item label="钱包名称">
            <Text strong className="text-lg">{wallet.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="类型">
            <Tag 
              color={getTypeColor(wallet.type)} 
              icon={wallet.type === 'hot' ? <FireOutlined /> : <WalletOutlined />}
              className="text-sm px-3 py-1"
            >
              {getTypeText(wallet.type)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag 
              color={getStatusColor(wallet.status)}
              className="text-sm px-3 py-1"
            >
              {getStatusText(wallet.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="链">
            <Text className="text-blue-600 font-medium">{wallet.chain}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="币种">
            <Text className="text-purple-600 font-medium">{wallet.symbol.toUpperCase()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="地址数量">
            <Badge count={wallet.addressCount} showZero className="text-sm" />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 余额统计 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="border-blue-200 bg-blue-50/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <Text className="text-sm text-blue-600">总余额</Text>
            </div>
            <Statistic
              title=""
              value={wallet.balance}
              suffix={wallet.symbol.toUpperCase()}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="border-green-200 bg-green-50/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <Text className="text-sm text-green-600">可用余额</Text>
            </div>
            <Statistic
              title=""
              value={wallet.availableBalance}
              suffix={wallet.symbol.toUpperCase()}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="border-orange-200 bg-orange-50/30">
            <div className="flex items-center justify-between mb-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <Text className="text-sm text-orange-600">锁定余额</Text>
            </div>
            <Statistic
              title=""
              value={wallet.lockedBalance}
              suffix={wallet.symbol.toUpperCase()}
              valueStyle={{ color: '#faad14', fontSize: '24px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细信息标签页 */}
      <Card>
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <Text className="text-lg font-medium text-gray-700">详细信息</Text>
          </div>
        </div>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={
            <span className="flex items-center gap-2">
              <EyeOutlined />
              概览
            </span>
          } key="overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <div className="flex items-center gap-2">
                      <SettingOutlined className="text-blue-500" />
                      <span>钱包设置</span>
                    </div>
                  } 
                  size="small"
                  className="border-blue-100 bg-blue-50/30"
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="自动归集">
                      <Tag color={wallet.settings.autoCollection ? 'success' : 'default'}>
                        {wallet.settings.autoCollection ? '开启' : '关闭'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="归集阈值">
                      <Text className="text-blue-600 font-medium">
                        {wallet.settings.collectionThreshold} {wallet.symbol.toUpperCase()}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="提现限额">
                      <Text className="text-green-600 font-medium">
                        {wallet.settings.withdrawalLimit} {wallet.symbol.toUpperCase()}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="日提现限额">
                      <Text className="text-purple-600 font-medium">
                        {wallet.settings.dailyWithdrawalLimit} {wallet.symbol.toUpperCase()}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="需要审批">
                      <Tag color={wallet.settings.requiresApproval ? 'warning' : 'default'}>
                        {wallet.settings.requiresApproval ? '是' : '否'}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card 
                  title={
                    <div className="flex items-center gap-2">
                      <TransactionOutlined className="text-green-500" />
                      <span>使用统计</span>
                    </div>
                  } 
                  size="small"
                  className="border-green-100 bg-green-50/30"
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title="总交易数"
                        value={transactions.length}
                        prefix={<TransactionOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="活跃地址"
                        value={addresses.filter(addr => addr.isUsed).length}
                        prefix={<BookOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                  </Row>
                  <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <Text type="secondary">创建时间: {dayjs(wallet.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                      </div>
                      {wallet.lastActivity && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <Text type="secondary">最后活动: {dayjs(wallet.lastActivity).format('YYYY-MM-DD HH:mm:ss')}</Text>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={
            <span className="flex items-center gap-2">
              <BookOutlined />
              地址管理
            </span>
          } key="addresses">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <Text className="text-sm text-gray-600">地址管理</Text>
                </div>
                <Button type="primary" icon={<BookOutlined />} size="large">
                  生成新地址
                </Button>
              </div>
            </div>
            <Table
              columns={addressColumns}
              dataSource={addresses}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }}
            />
          </TabPane>

          <TabPane tab={
            <span className="flex items-center gap-2">
              <TransactionOutlined />
              交易记录
            </span>
          } key="transactions">
            <Table
              columns={transactionColumns}
              dataSource={transactions}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default WalletDetailPage 