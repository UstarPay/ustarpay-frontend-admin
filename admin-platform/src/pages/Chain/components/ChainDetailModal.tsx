import React from 'react'
import { Modal, Descriptions, Tag, Badge } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import type { Chain } from '@shared/types/chain'

interface ChainDetailModalProps {
  visible: boolean
  chain: Chain | null
  onCancel: () => void
}

const ChainDetailModal: React.FC<ChainDetailModalProps> = ({
  visible,
  chain,  
  onCancel
}) => { 

  return (
    <Modal
      title="区块链网络详情"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      {chain && (
        <Descriptions column={2} bordered>
          <Descriptions.Item label="ID">{chain.id}</Descriptions.Item>
          <Descriptions.Item label="链ID">{chain.chainId}</Descriptions.Item>
          
          <Descriptions.Item label="链代码">{chain.chainCode}</Descriptions.Item>
          <Descriptions.Item label="链名称">{chain.chainName}</Descriptions.Item>
          
          <Descriptions.Item label="原生币">{chain.nativeSymbol}</Descriptions.Item>
          
          <Descriptions.Item label="确认块数">{chain.confirmationBlocks}</Descriptions.Item>
          <Descriptions.Item label="扫描高度">
            {chain.scanHeight.toLocaleString()}
          </Descriptions.Item>
          
          <Descriptions.Item label="状态" span={2}>
            <Badge
              status={chain.status === 1 ? 'success' : 'error'}
              text={chain.status === 1 ? '启用' : '禁用'}
            />
          </Descriptions.Item>
          
          <Descriptions.Item label="RPC地址" span={2}>
            <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
              {chain.rpcUrls?.map((url, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  <LinkOutlined style={{ marginRight: '4px' }} />
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </Descriptions.Item>
          
          {chain.explorerUrl && (
            <Descriptions.Item label="区块浏览器" span={2}>
              <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                <LinkOutlined style={{ marginRight: '4px' }} />
                <a href={chain.explorerUrl} target="_blank" rel="noopener noreferrer">
                  {chain.explorerUrl}
                </a> 
              </div>
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="创建时间">
            {new Date(chain.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(chain.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  )
}

export default ChainDetailModal
