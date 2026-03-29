import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, Switch, Row, Col } from 'antd'
import type { CreateChainRequest } from '@shared/types/chain'

const { Option } = Select
const { TextArea } = Input
const DEFAULT_CHAIN_NETWORK_OPTIONS = ['EVM', 'Bitcoin', 'Tron', '其他']

interface ChainCreateModalProps {
  visible: boolean
  loading: boolean
  onCancel: () => void
  onSubmit: (values: CreateChainRequest) => void
}

const ChainCreateModal: React.FC<ChainCreateModalProps> = ({
  visible,
  loading,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm()
  const [chainNetworkOptions] = useState<string[]>(
    DEFAULT_CHAIN_NETWORK_OPTIONS
  )

  useEffect(() => {
    if (visible) {
      form.setFieldValue(
        'chainNetwork',
        form.getFieldValue('chainNetwork') || DEFAULT_CHAIN_NETWORK_OPTIONS[0]
      )
    }
  }, [form, visible])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const processedValues = {
        chainId: values.chainId,
        chainCode: values.chainCode?.trim(),
        chainName: values.chainName?.trim(),
        chainNetwork: values.chainNetwork,
        nativeSymbol: values.nativeSymbol?.trim(),
        rpcUrls: values.rpcUrlsText
          ? values.rpcUrlsText
              .split('\n')
              .map((url: string) => url.trim())
              .filter((url: string) => url)
          : [],
        explorerUrls: values.explorerUrlsText
          ? values.explorerUrlsText
              .split('\n')
              .map((url: string) => url.trim())
              .filter((url: string) => url)
          : [],
        confirmationBlocks: values.confirmationBlocks || 6,
        scanHeight: values.scanHeight ?? 1000,
        scanInterval: values.scanInterval || 30,
        status: values.status ? 1 : 0,
      }

      onSubmit(processedValues)
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
      title="创建区块链网络"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={800}
      confirmLoading={loading}
      okText="创建"
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
              <Input
                placeholder="如: Ethereum, Binance Smart Chain"
                maxLength={50}
              />
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="chainNetwork"
              label="网络类型"
              rules={[{ required: true, message: '请选择网络类型' }]}
            >
              <Select placeholder="选择网络类型">
                {chainNetworkOptions.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
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

        <Form.Item name="explorerUrlsText" label="区块浏览器地址">
          <TextArea
            rows={2}
            placeholder="每行一个浏览器地址（可选）&#10;https://etherscan.io&#10;https://cn.etherscan.com"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="confirmationBlocks"
              label="确认块数"
              initialValue={6}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="scanHeight" label="扫描高度" initialValue={1000}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="scanInterval"
              label="扫描间隔(秒)"
              initialValue={30}
            >
              <InputNumber min={1} max={3600} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="status"
          label="启用状态"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ChainCreateModal
