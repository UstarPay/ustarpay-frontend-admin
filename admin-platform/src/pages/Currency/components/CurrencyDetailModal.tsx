import React from 'react'
import { Modal, Button, Descriptions, Tag, Badge, Avatar, Typography } from 'antd'
import { StarFilled } from '@ant-design/icons'
import type { Currency } from '@shared/types/currency'

const { Text } = Typography

interface CurrencyDetailModalProps {
  visible: boolean
  currency: Currency | null
  onClose: () => void
}

const CurrencyDetailModal: React.FC<CurrencyDetailModalProps> = ({
  visible,
  currency,
  onClose
}) => {
  if (!currency) return null

  // 获取链信息显示
  const getChainDisplay = (currency: Currency) => {
    if (currency.chain) {
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}> 
          <span>{currency.chain.chainName}</span>
        </div>
      )
    }
    return (
      <Tag color="default">{currency.chainCode}</Tag>
    )
  }

  return (
    <Modal
      title="代币详情"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      <Descriptions column={2} bordered>
        <Descriptions.Item label="ID">{currency.id}</Descriptions.Item>
        <Descriptions.Item label="代币符号">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {currency.iconUrl && (
              <Avatar 
                src={currency.iconUrl} 
                size={24} 
                style={{ marginRight: 8 }}
              />
            )}
            <Text strong>{currency.symbol}</Text>
            {currency.isNative && (
              <StarFilled style={{ color: '#faad14', marginLeft: 4 }} />
            )}
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="代币名称" span={2}>
          {currency.name}
        </Descriptions.Item>
        <Descriptions.Item label="所属链" span={2}>
          {getChainDisplay(currency)}
        </Descriptions.Item>
        <Descriptions.Item label="类型">
          <Tag color={currency.isNative ? 'gold' : 'blue'}>
            {currency.isNative ? '原生币' : '合约代币'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="精度">{currency.decimals}</Descriptions.Item>
        {currency.contractAddress && (
          <Descriptions.Item label="合约地址" span={2}>
            <Text code>{currency.contractAddress}</Text>
          </Descriptions.Item>
        )}
        {currency.coingeckoId && (
          <Descriptions.Item label="CoinGecko ID" span={2}>
            {currency.coingeckoId}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="状态">
          <Badge
            status={currency.status === 1 ? 'success' : 'error'}
            text={currency.status === 1 ? '启用' : '禁用'}
          />
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {new Date(currency.createdAt).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间" span={2}>
          {new Date(currency.updatedAt).toLocaleString()}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  )
}

export default CurrencyDetailModal
