import React from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Button,
  Space,
  Alert,
  Table,
  Spin,
  Empty
} from 'antd'
import {
  CloudOutlined,
  EditOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  SafetyOutlined,
  LinkOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { coldWalletService, transactionService } from '@/services'
import type { ColdWallet } from '@shared/types'
import { WalletStatus } from '@shared/types'

// 临时类型定义，匹配实际 API 响应
interface ActualColdWalletWithBalance {
  wallet: ColdWallet
  balanceByChain: any
}

const { Title, Text } = Typography

/** 最近交易表格：查询 tenant_transactions 中 from_address 或 to_address 为指定地址的记录，仅展示最新 8 条 */
const RecentTransactionsTable: React.FC<{ walletAddress: string }> = ({ walletAddress }) => {
  const { data: txListRes, isLoading } = useQuery({
    queryKey: ['cold-wallet-transactions', walletAddress],
    queryFn: () =>
      transactionService.getTransactions({
        address: walletAddress,
        page: 1,
        pageSize: 8,
      }),
    enabled: !!walletAddress,
  })
  const list = (txListRes?.data as any)?.transactions ?? []
  return (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spin size="large" tip="加载交易记录中..." />
        </div>
      ) : list.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无交易记录"
          className="py-8"
        />
      ) : (
        <Table
          size="middle"
          bordered
          rowKey={(r) => r.id || `${r.tx_hash}-${r.symbol}-${r.created_at}`}
          dataSource={list}
          pagination={false}
          scroll={{ x: 720 }}
          className="recent-tx-table"
          rowClassName={(_, index) => (index % 2 === 0 ? 'bg-gray-50/50' : '')}
          columns={[
            {
              title: '类型',
              dataIndex: 'tx_type',
              key: 'tx_type',
              width: 90,
              align: 'center',
              render: (type: string) => {
                const colorMap: Record<string, string> = {
                  deposit: 'green',
                  withdraw: 'red',
                  collect: 'orange',
                  internal: 'purple',
                }
                const textMap: Record<string, string> = {
                  deposit: '充值',
                  withdraw: '提现',
                  collect: '归集',
                  internal: '内部',
                }
                return <Tag color={colorMap[type] || 'default'} className="m-0">{textMap[type] || type}</Tag>
              },
            },
            {
              title: '链/币种',
              key: 'chain_symbol',
              width: 110,
              align: 'center',
              render: (_: any, r: any) => (
                <Space size={4}>
                  <Tag color="blue" className="m-0">{r.chain_code || '-'}</Tag>
                  <Tag color="green" className="m-0">{r.symbol || '-'}</Tag>
                </Space>
              ),
            },
            {
              title: '发送地址',
              key: 'from_address',
              width: 130,
              ellipsis: true,
              render: (_: any, r: any) => {
                const addr = r.from_address || r.fromAddress
                if (!addr) return <span className="text-gray-400">-</span>
                return (
                  <Typography.Text copyable={{ text: addr }} className="font-mono text-xs">
                    {`${addr.slice(0, 8)}...${addr.slice(-6)}`}
                  </Typography.Text>
                )
              },
            },
            {
              title: '接收地址',
              key: 'to_address',
              width: 130,
              ellipsis: true,
              render: (_: any, r: any) => {
                const addr = r.to_address || r.toAddress
                if (!addr) return <span className="text-gray-400">-</span>
                return (
                  <Typography.Text copyable={{ text: addr }} className="font-mono text-xs">
                    {`${addr.slice(0, 8)}...${addr.slice(-6)}`}
                  </Typography.Text>
                )
              },
            },
            {
              title: '金额',
              dataIndex: 'amount',
              key: 'amount',
              width: 140,
              render: (amount: string, r: any) => (
                <Text strong style={{ color: '#1890ff' }}>
                  {Number(amount || 0).toFixed(8)} {r.symbol || ''}
                </Text>
              ),
            },
            {
              title: '时间',
              dataIndex: 'created_at',
              key: 'created_at',
              width: 165,
              render: (t: string) => (
                <span className="text-gray-600 text-sm">
                  {t ? new Date(t).toLocaleString('zh-CN') : '-'}
                </span>
              ),
            },
          ]}
        />
      )}
    </>
  )
}

interface ColdWalletDetailProps {
  walletId: string
  onEdit: (wallet: ActualColdWalletWithBalance) => void
  onSettings: (walletId: string) => void
  onBack: () => void
}

const ColdWalletDetail: React.FC<ColdWalletDetailProps> = ({
  walletId,
  onEdit,
  onSettings,
  onBack
}) => {
  const navigate = useNavigate()
  // 获取冷钱包详情
  const { data: walletResponse, isLoading } = useQuery({
    queryKey: ['cold-wallet-detail', walletId],
    queryFn: () => coldWalletService.getColdWallet(walletId)
  })

  const wallet = walletResponse

  if (isLoading) {
    return <div>加载中...</div>
  }

  if (!wallet) {
    return <div>钱包不存在</div>
  }

  const getStatusConfig = (status: WalletStatus) => {
    const statusConfig = {
      [WalletStatus.ACTIVE]: { text: '活跃', color: 'green' },
      [WalletStatus.INACTIVE]: { text: '非活跃', color: 'orange' },
      [WalletStatus.FROZEN]: { text: '冻结', color: 'red' }
    }
    return statusConfig[status] || { text: '未知', color: 'default' }
  }

  const statusConfig = getStatusConfig(wallet.status)

  return (
    <div>
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className="mr-4"
          >
            返回列表
          </Button>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <CloudOutlined className="mr-2" style={{ color: '#1890ff' }} />
              {wallet.name}
            </Title>
            <Text type="secondary">{wallet.description || '暂无描述'}</Text>
          </div>
        </div>
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit({ wallet, balanceByChain: {} })}
          >
            编辑
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => onSettings(walletId)}
          >
            设置
          </Button>
        </Space>
      </div>

      {/* 归集钱包特性提示 */}
      <Alert
        message="归集钱包特性"
        description="归集钱包不存储私钥，仅用于监控地址余额和交易记录。请确保地址输入正确。"
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        className="mb-6"
      />

      {/* 基本信息 */}
      <Card title="基本信息" className="mb-6">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="钱包名称" span={2}>
            {wallet.name}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {wallet.description || '暂无描述'}
          </Descriptions.Item>
          <Descriptions.Item label="钱包地址" span={2}>
            <div className="font-mono text-sm">
              {wallet.address}
              <Button
                type="link"
                icon={<LinkOutlined />}
                size="small"
                onClick={() => navigator.clipboard.writeText(wallet.address)}
              >
                复制
              </Button>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {wallet.createdAt ? new Date(wallet.createdAt).toLocaleString('zh-CN') : '未知'}
          </Descriptions.Item>
          <Descriptions.Item label="支持的链" span={2}>
            {wallet.chainCodes && wallet.chainCodes.length > 0 ? (
              <div>
                {wallet.chainCodes.map((code: string) => (
                  <Tag key={code} color="blue" className="mb-1">
                    {code.toUpperCase()}
                  </Tag>
                ))}
              </div>
            ) : (
              <Tag color="orange">全部链</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="支持的代币" span={2}>
            {wallet.symbols && wallet.symbols.length > 0 ? (
              <div>
                {wallet.symbols.map((symbol: string) => (
                  <Tag key={symbol} color="green" className="mb-1">
                    {symbol}
                  </Tag>
                ))}
              </div>
            ) : (
              <Tag color="orange">全部代币</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 最近交易：仅展示最新 8 条，可跳转交易管理-交易记录 */}
      <Card
        title={
          <Space size="middle">
            <HistoryOutlined style={{ color: '#1890ff', fontSize: 18 }} />
            <span className="text-base font-medium">最近交易</span>
          </Space>
        }
        extra={
          <Button type="primary" size="small" onClick={() => navigate('/transactions/list')}>
            查看交易记录
          </Button>
        }
        className="mb-6 shadow-sm overflow-hidden"
      >
        <RecentTransactionsTable walletAddress={wallet.address} />
      </Card>

      {/* 安全提醒 */}
      <Card title="安全提醒" className="mb-6">
        <Alert
          message="重要提醒"
          description={
            <div>
              <p>• 归集钱包不存储私钥，仅用于监控地址</p>
              <p>• 请确保输入的地址准确无误</p>
              <p>• 定期检查地址余额和交易记录</p>
              <p>• 如发现异常活动，请及时处理</p>
            </div>
          }
          type="warning"
          showIcon
        />
      </Card>
    </div>
  )
}

export default ColdWalletDetail
