import React, { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Switch, Row, Col } from 'antd'
import type { Chain, UpdateChainRequest } from '@shared/types/chain'

const { TextArea } = Input

interface ChainEditModalProps {
  visible: boolean
  loading: boolean
  chain: Chain | null
  onCancel: () => void
  onSubmit: (id: number, values: UpdateChainRequest) => void
}

const ChainEditModal: React.FC<ChainEditModalProps> = ({
  visible,
  loading,
  chain,
  onCancel,
  onSubmit
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible && chain) {
      const formValues = {
        ...chain,
        rpcUrlsText: chain.rpcUrls?.join('\n') || '',
        explorerUrlText: chain.explorerUrl || '',
        status: chain.status === 1
      }
      form.setFieldsValue(formValues)
    }
  }, [form, visible, chain])

  const handleSubmit = async () => {
    if (!chain) return
    
    try {
      const values = await form.validateFields()
      const rpcUrls = values.rpcUrlsText
        ? values.rpcUrlsText.split('\n').map((url: string) => url.trim()).filter((url: string) => url)
        : []
      const explorerUrl = values.explorerUrlText
        ? values.explorerUrlText.split('\n').map((url: string) => url.trim()).find((url: string) => url) || ''
        : ''

      const processedValues = {
        chainName: values.chainName,
        nativeSymbol: values.nativeSymbol,
        rpcUrls,
        explorerUrl,
        confirmationBlocks: values.confirmationBlocks,
        scanHeight: values.scanHeight,
        scanInterval: values.scanInterval,
        status: values.status ? 1 : 0
      }

      onSubmit(chain.id, processedValues)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="编辑区块链网络"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={800}
      confirmLoading={loading}
      okText="更新"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="chainId"
              label="链ID"
              rules={[{ required: true, message: '请输入链ID' }]}
            >
              <InputNumber 
                min={1} 
                style={{ width: '100%' }} 
                placeholder="如: 1 (以太坊主网)"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="chainCode"
              label="链代码"
              rules={[{ required: true, message: '请输入链代码' }]}
            >
              <Input placeholder="如: ETH, BSC, BTC" maxLength={20} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="chainName"
              label="链名称"
              rules={[{ required: true, message: '请输入链名称' }]}
            >
              <Input placeholder="如: Ethereum, Binance Smart Chain" maxLength={50} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="nativeSymbol"
              label="原生币符号"
              rules={[{ required: true, message: '请输入原生币符号' }]}
            >
              <Input placeholder="如: ETH, BNB, BTC" maxLength={10} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="rpcUrlsText"
          label="RPC地址"
          rules={[{ required: true, message: '请输入至少一个RPC地址' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="每行一个RPC地址&#10;https://eth-mainnet.g.alchemy.com/v2/your-api-key&#10;https://rpc.ankr.com/eth"
          />
        </Form.Item>

        <Form.Item
          name="explorerUrlText"
          label="区块浏览器地址"
        >
          <TextArea 
            rows={2} 
            placeholder="https://etherscan.io&#10;https://cn.etherscan.com"
          />
        </Form.Item>
 

        <Row gutter={16}> 
          <Col span={8}>
            <Form.Item
              name="confirmationBlocks"
              label="确认块数"
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="scanHeight"
              label="扫描高度"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="lastScanHeight"
              label="最新扫描高度"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="status"
              label="启用状态"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="启用" 
                unCheckedChildren="禁用" 
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default ChainEditModal
