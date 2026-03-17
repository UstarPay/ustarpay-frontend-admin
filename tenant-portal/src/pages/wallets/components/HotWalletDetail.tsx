import React from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Button,
  Space,
  Spin,
  Tabs,
  Row,
  Col,
  Statistic,
  Table,
  Tooltip
} from 'antd'
import {
  WalletOutlined,
  FireOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { hotWalletService, withdrawalRiskConfigService, transactionService } from '@/services'
import type { WithdrawalRiskConfig } from '@/services/withdrawalRiskConfigService'
import type { HotWallet } from '@shared/types'
import { WalletStatus } from '@shared/types'

const { Title, Text } = Typography

/** 单个链+币种配置详情面板 */
const ConfigDetailPanel: React.FC<{ config: WithdrawalRiskConfig | null }> = ({ config }) => {
  const singleLimit = config ? (Number(config.singleLimit) > 0 ? config.singleLimit : '不限制') : '-'
  const dailyLimit = config ? (Number(config.dailyLimit) > 0 ? config.dailyLimit : '不限制') : '-'
  const requireApproval = config?.requireApproval ?? false

  return (
    <div className="pt-4">
      <Row gutter={[24, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" className="h-full" style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="单笔提现限额"
              value={singleLimit}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#262626', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" className="h-full" style={{ borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="日提现限额"
              value={dailyLimit}
              prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#262626', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card size="small" className="h-full" style={{ borderLeft: `4px solid ${requireApproval ? '#ff4d4f' : '#52c41a'}` }}>
            <div className="flex items-center gap-2">
              <SafetyCertificateOutlined style={{ fontSize: 24, color: requireApproval ? '#ff4d4f' : '#52c41a' }} />
              <div>
                <div className="text-gray-500 text-sm">需要审批</div>
                <div className="flex items-center gap-1 mt-0.5">
                  {requireApproval ? (
                    <>
                      <Tag color="error" icon={<ExclamationCircleOutlined />}>是</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>超出限额需人工审核</Text>
                    </>
                  ) : (
                    <>
                      <Tag color="success" icon={<CheckCircleOutlined />}>否</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>自动通过</Text>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

interface HotWalletDetailProps {
  walletId: string
  onSettings: (wallet: HotWallet) => void
  onBack: () => void
}

const HotWalletDetail: React.FC<HotWalletDetailProps> = ({
  walletId,
  onSettings,
  onBack
}) => {
  // 获取热钱包详情
  const { data: walletResponse, isLoading } = useQuery({
    queryKey: ['hot-wallet-detail', walletId],
    queryFn: () => hotWalletService.getHotWallet(walletId)
  })

  const wallet = walletResponse

  // 加载该钱包链+币种对应的风控配置
  const { data: riskConfigs, isLoading: riskLoading } = useQuery({
    queryKey: ['withdrawal-risk-config', walletId, wallet?.chainCodes, wallet?.symbols],
    queryFn: () =>
      withdrawalRiskConfigService.listRiskConfigs({
        chainCodes: wallet?.chainCodes,
        symbols: wallet?.symbols,
      }),
    enabled: !!wallet,
  })

  // 加载该钱包地址最近 10 条 tenant_transactions 交易记录（仅 deposit/withdraw，排除 collect 归集）
  const { data: txListRes, isLoading: txLoading } = useQuery({
    queryKey: ['hot-wallet-transactions', walletId, wallet?.address],
    queryFn: () =>
      transactionService.getTransactions({
        address: wallet?.address,
        page: 1,
        pageSize: 10,
        txTypeExclude: 'collect',
      }),
    enabled: !!wallet && !!wallet.address,
  })

  const recentTxList = (txListRes?.data as any)?.transactions ?? []

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
              <WalletOutlined className="mr-2" style={{ color: '#1890ff' }} />
              {wallet.name}
            </Title>
            <Text type="secondary">{wallet.description || '暂无描述'}</Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => onSettings(wallet)}
        >
          设置
        </Button>
      </div>

      {/* 基本信息 */}
      <Card title="基本信息" className="mb-6">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="钱包名称">
            {wallet.name}
          </Descriptions.Item>
          <Descriptions.Item label="钱包地址" span={2}>
            <Typography.Text
              copyable={{
                icon: [<CopyOutlined key="copy" />, <CopyOutlined key="copied" />],
                tooltips: ['复制地址', '已复制'],
              }}
              code
              style={{ fontSize: 13 }}
            >
              {wallet.address || '-'}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="支持的链">
            <div>
              {wallet.chainCodes?.length > 0 ? (
                wallet.chainCodes.map((code) => (
                  <Tag key={code} color="blue" className="mr-1 mb-1">
                    {code.toUpperCase()}
                  </Tag>
                ))
              ) : (
                <Tag color="orange">全部</Tag>
              )}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="支持的代币">
            <div>
              {wallet.symbols?.length > 0 ? (
                wallet.symbols.map((symbol) => (
                  <Tag key={symbol} color="green" className="mr-1 mb-1">
                    {symbol}
                  </Tag>
                ))
              ) : (
                <Tag color="orange">全部</Tag>
              )}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusConfig.color}>
              {statusConfig.text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="钱包类型">
            <Tag color="orange" icon={<FireOutlined />}>
              热钱包
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="总余额">
            <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
              {(wallet as any).balance || '0'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {wallet.description || '暂无描述'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {wallet.createdAt ? new Date(wallet.createdAt).toLocaleString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {wallet.updatedAt ? new Date(wallet.updatedAt).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 配置信息 */}
      <Card
        title={
          <Space>
            <SettingOutlined style={{ color: '#1890ff' }} />
            <span>配置信息</span>
          </Space>
        }
        className="mb-6"
      >
        {riskLoading ? (
          <div className="text-center py-8">
            <Spin size="large" tip="加载配置中..." />
          </div>
        ) : riskConfigs && riskConfigs.length > 0 ? (
          <Tabs
            defaultActiveKey={riskConfigs[0] ? `${riskConfigs[0].chainCode}-${riskConfigs[0].symbol}` : '0'}
            type="card"
            size="middle"
            items={riskConfigs.map((cfg) => ({
              key: `${cfg.chainCode}-${cfg.symbol}`,
              label: (
                <Space size={6}>
                  <Tag color="blue">{cfg.chainCode?.toUpperCase()}</Tag>
                  <Tag color="green">{cfg.symbol?.toUpperCase()}</Tag>
                </Space>
              ),
              children: (
                <ConfigDetailPanel config={cfg} />
              ),
            }))}
          />
        ) : (
          <ConfigDetailPanel config={null} />
        )}
      </Card>

      {/* 操作历史 - tenant_transactions 最近 10 条 */}
      <Card
        title={
          <Space>
            <HistoryOutlined style={{ color: '#1890ff' }} />
            <span>操作历史</span>
            <Tooltip title="仅展示该钱包地址相关的最近 10 条交易记录">
              <Tag color="default">仅展示最近 10 条记录</Tag>
            </Tooltip>
          </Space>
        }
        className="mb-6"
      >
        {txLoading ? (
          <div className="text-center py-8">
            <Spin size="default" tip="加载交易记录中..." />
          </div>
        ) : (
          <Table
            size="small"
            rowKey={(r) => r.id || `${r.tx_hash}-${r.symbol}-${r.created_at}`}
            dataSource={recentTxList}
            pagination={false}
            columns={[
              {
                title: '类型',
                dataIndex: 'tx_type',
                key: 'tx_type',
                width: 100,
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
                  return <Tag color={colorMap[type] || 'default'}>{textMap[type] || type}</Tag>
                },
              },
              {
                title: '链/币种',
                key: 'chain_symbol',
                width: 120,
                render: (_: any, r: any) => (
                  <Space size={4}>
                    <Tag color="blue">{r.chain_code || '-'}</Tag>
                    <Tag color="green">{r.symbol || '-'}</Tag>
                  </Space>
                ),
              },
              {
                title: '金额',
                dataIndex: 'amount',
                key: 'amount',
                render: (amount: string, r: any) => (
                  <Text strong>
                    {Number(amount || 0).toFixed(8)} {r.symbol || ''}
                  </Text>
                ),
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 90,
                render: (status: number) => {
                  const s = Number(status)
                  if (s === 0) return <Tag color="processing">待确认</Tag>
                  if (s === 1 || s === 3) return <Tag color="success">成功</Tag>
                  if (s === 2 || s === 4) return <Tag color="error">失败</Tag>
                  if (s === 5) return <Tag color="default">已取消</Tag>
                  return <Tag>{status}</Tag>
                },
              },
              {
                title: '时间',
                dataIndex: 'created_at',
                key: 'created_at',
                width: 170,
                render: (t: string) => (t ? new Date(t).toLocaleString() : '-'),
              },
              {
                title: '交易哈希',
                dataIndex: 'tx_hash',
                key: 'tx_hash',
                ellipsis: true,
                render: (hash: string) =>
                  hash ? (
                    <Typography.Text copyable code style={{ fontSize: 12 }}>
                      {hash}
                    </Typography.Text>
                  ) : (
                    '-'
                  ),
              },
            ]}
            locale={{ emptyText: '暂无交易记录' }}
          />
        )}
      </Card>
    </div>
  )
}

export default HotWalletDetail
