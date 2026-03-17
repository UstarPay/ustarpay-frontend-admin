import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, Switch, Row, Col, message } from 'antd'
import type { CreateChainRequest } from '@shared/types/chain'
import { configApi } from '@/services/apis/configApi'

const { Option } = Select
const { TextArea } = Input

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
  onSubmit
}) => {
  const [form] = Form.useForm()
  const [chainNetworkOptions, setChainNetworkOptions] = useState<string[]>([])

  // 获取网络类型配置
  useEffect(() => {
    if (visible) {
      configApi.getConfigByKey('chain_network')
        .then(res => {
          if (res.data?.config_value) {
            try {
              const config = JSON.parse(res.data.config_value)
              if (config.chainNetwork && Array.isArray(config.chainNetwork)) {
                setChainNetworkOptions(config.chainNetwork)
              }
            } catch (e) {
              console.error('Failed to parse chain_network config:', e)
              // 使用默认值
              setChainNetworkOptions(['EVM', 'Bitcoin', 'Tron', '其他'])
            }
          }
        })
        .catch(err => {
          console.error('Failed to fetch chain_network config:', err)
          // 使用默认值
          setChainNetworkOptions(['EVM', 'Bitcoin', 'Tron', '其他'])
        })
    }
  }, [visible])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 处理RPC URLs和浏览器URLs，并转换字段名为后端期望的格式
      const processedValues = {
        chainId: values.chain_id,
        chainCode: values.chain_code,
        chainName: values.chain_name,
        chain_network: values.chain_network,
        nativeSymbol: values.native_currency,
        rpcUrls: values.rpc_urls_text ? values.rpc_urls_text.split('\n').filter((url: string) => url.trim()) : [],
        wsUrls: values.ws_urls_text ? values.ws_urls_text.split('\n').filter((url: string) => url.trim()) : [],
        explorerUrls: values.explorer_urls_text ? values.explorer_urls_text.split('\n').filter((url: string) => url.trim()) : [],
        confirmationBlocks: values.confirmation_blocks || 6,
        scanHeight: values.scan_height || 1000,
        blockTime: values.block_time || 15,
        isActive: values.is_active !== undefined ? values.is_active : true,
        isMainnet: values.is_mainnet !== undefined ? values.is_mainnet : true
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
              name="chain_id"
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
              name="chain_code"
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
              name="chain_name"
              label="链名称"
              rules={[{ required: true, message: '请输入链名称' }]}
            >
              <Input placeholder="如: Ethereum, Binance Smart Chain" maxLength={50} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="native_currency"
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
              name="chain_network"
              label="网络类型"
              rules={[{ required: true, message: '请选择网络类型' }]}
            >
              <Select placeholder="选择网络类型">
                {chainNetworkOptions.map(option => (
                  <Option key={option} value={option}>{option}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="is_mainnet"
              label="网络环境"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch
                checkedChildren="主网"
                unCheckedChildren="测试网"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="rpc_urls_text"
          label="RPC地址"
          rules={[{ required: true, message: '请输入至少一个RPC地址' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="每行一个RPC地址&#10;https://eth-mainnet.g.alchemy.com/v2/your-api-key&#10;https://rpc.ankr.com/eth"
          />
        </Form.Item>

        <Form.Item
          name="ws_urls_text"
          label="WebSocket地址"
        >
          <TextArea 
            rows={2} 
            placeholder="每行一个WebSocket地址（可选）&#10;wss://eth-mainnet.ws.alchemy.com/v2/your-api-key"
          />
        </Form.Item>

        <Form.Item
          name="explorer_urls_text"
          label="区块浏览器地址"
        >
          <TextArea 
            rows={2} 
            placeholder="每行一个浏览器地址（可选）&#10;https://etherscan.io&#10;https://cn.etherscan.com"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="block_time"
              label="出块时间(秒)"
              initialValue={15}
            >
              <InputNumber min={1} max={3600} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="confirmation_blocks"
              label="确认块数"
              initialValue={6}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="scan_height"
              label="扫描高度"
              initialValue={1000}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="is_active"
              label="启用状态"
              valuePropName="checked"
              initialValue={true}
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

export default ChainCreateModal
