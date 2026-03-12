import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Tooltip,
  message,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  ArrowLeftOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  SwapOutlined,
  LinkOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { transactionService } from '@/services'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

const STATUS_MAP: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  0: { label: '待确认', color: 'processing', icon: <ClockCircleOutlined /> },
  1: { label: '确认成功', color: 'success', icon: <CheckCircleOutlined /> },
  2: { label: '确认失败', color: 'error', icon: <CloseCircleOutlined /> },
  3: { label: '交易成功', color: 'success', icon: <CheckCircleOutlined /> },
  4: { label: '交易失败', color: 'error', icon: <CloseCircleOutlined /> },
  5: { label: '已取消', color: 'default', icon: <StopOutlined /> },
}

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  deposit: { label: '充值', color: 'green' },
  withdraw: { label: '提现', color: 'red' },
  withdrawal: { label: '提现', color: 'red' },
  collect: { label: '归集', color: 'orange' },
  collection: { label: '归集', color: 'orange' },
  internal: { label: '内部转账', color: 'purple' },
  transfer: { label: '转账', color: 'blue' },
}

const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tx, setTx] = useState<any>(null)

  useEffect(() => {
    if (id) loadTransaction()
  }, [id])

  const loadTransaction = async () => {
    try {
      setLoading(true)
      const res = await transactionService.getTransaction(id!)
      setTx((res.data as any) || res)
    } catch (error) {
      console.error('加载交易详情失败:', error)
      message.error('加载交易详情失败')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  }

  const renderAddress = (addr: string | undefined) => {
    if (!addr) return <Text type="secondary">-</Text>
    return (
      <Space>
        <Text code style={{ fontSize: 13 }}>{addr}</Text>
        <Tooltip title="复制地址">
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(addr)} />
        </Tooltip>
      </Space>
    )
  }

  if (loading) {
    return (
      <div className="p-6" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="p-6">
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Title level={4} type="secondary">交易记录不存在</Title>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/transactions/list')}>
              返回交易列表
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const status = STATUS_MAP[tx.status] || STATUS_MAP[0]
  const txType = TYPE_MAP[tx.tx_type] || TYPE_MAP[tx.type] || { label: tx.tx_type || tx.type || '-', color: 'default' }
  const txHash = tx.tx_hash || tx.hash || ''
  const chainCode = tx.chain_code || tx.chainCode || ''
  const amount = tx.amount || '0'
  const symbol = tx.symbol || ''
  const fee = tx.block_fee || tx.fee || '0'
  const blockHeight = tx.block_height || tx.blockHeight
  const confirmations = tx.confirmations || 0
  const fromAddr = tx.from_address || tx.fromAddress || ''
  const toAddr = tx.to_address || tx.toAddress || ''
  const memo = tx.memo || ''
  const createdAt = tx.created_at || tx.createdAt
  const updatedAt = tx.updated_at || tx.updatedAt
  const confirmedAt = tx.confirmed_at || tx.confirmedAt

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Space align="center">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/transactions/list')}>返回</Button>
          <Title level={2} style={{ margin: 0 }}>交易详情</Title>
        </Space>
      </div>

      {/* 概览卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="交易金额"
              value={parseFloat(amount)}
              suffix={symbol.toUpperCase()}
              precision={6}
              valueStyle={{ color: txType.color === 'red' ? '#cf1322' : '#3f8600', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="手续费"
              value={parseFloat(fee)}
              suffix={symbol.toUpperCase()}
              precision={6}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">状态</Text>
            </div>
            <Space size="middle">
              <Tag color={status.color} icon={status.icon} style={{ fontSize: 16, padding: '4px 16px' }}>
                {status.label}
              </Tag>
              <Tag color={txType.color} style={{ fontSize: 14, padding: '2px 12px' }}>
                {txType.label}
              </Tag>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 基本信息 */}
      <Card title="基本信息" className="mb-6">
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="middle">
          <Descriptions.Item label="交易ID">
            <Space>
              <Text code style={{ fontSize: 13 }}>{tx.id}</Text>
              <Tooltip title="复制">
                <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(tx.id)} />
              </Tooltip>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="交易类型">
            <Tag color={txType.color}>{txType.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="链">
            <Tag>{chainCode}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="币种">
            <Tag color="blue">{symbol.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="金额">
            <Text strong>{amount} {symbol.toUpperCase()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="手续费">
            <Text>{fee} {symbol.toUpperCase()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={status.color} icon={status.icon}>{status.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="确认数">
            <Text>{confirmations}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 地址信息 */}
      <Card title={<Space><SwapOutlined />地址信息</Space>} className="mb-6">
        <Descriptions column={1} bordered size="middle">
          <Descriptions.Item label="发送地址">
            {renderAddress(fromAddr)}
          </Descriptions.Item>
          <Descriptions.Item label="接收地址">
            {renderAddress(toAddr)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 链上信息 */}
      <Card title={<Space><LinkOutlined />链上信息</Space>} className="mb-6">
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="middle">
          <Descriptions.Item label="交易哈希" span={2}>
            {txHash ? (
              <Space>
                <Text code style={{ fontSize: 13, wordBreak: 'break-all' }}>{txHash}</Text>
                <Tooltip title="复制">
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(txHash)} />
                </Tooltip>
              </Space>
            ) : (
              <Text type="secondary">-</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="区块高度">
            {blockHeight ? <Text code>{blockHeight}</Text> : <Text type="secondary">-</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="确认数">
            <Text>{confirmations}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 时间和备注 */}
      <Card title="其他信息">
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="middle">
          <Descriptions.Item label="创建时间">
            {createdAt ? dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {updatedAt ? dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="确认时间">
            {confirmedAt ? dayjs(confirmedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {memo ? <Paragraph style={{ margin: 0 }}>{memo}</Paragraph> : <Text type="secondary">无</Text>}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default TransactionDetailPage
