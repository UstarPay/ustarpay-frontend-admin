import React, { useEffect } from 'react'
import { Modal, Form, Input, Select, Switch, InputNumber, Row, Col } from 'antd'
import type { CreateCurrencyRequest } from '@shared/types/currency'
import type { Chain } from '@shared/types/chain'

const { Option } = Select

interface CurrencyCreateModalProps {
  visible: boolean
  onCancel: () => void
  onSubmit: (values: CreateCurrencyRequest) => void
  loading: boolean
  chains: Chain[]
  chainsLoading: boolean
}

const CurrencyCreateModal: React.FC<CurrencyCreateModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  loading,
  chains,
  chainsLoading
}) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible) {
      form.resetFields()
      // 设置默认值
      form.setFieldsValue({
        decimals: 18,
        isNative: false,
        isActive: true
      })
    }
  }, [visible, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      // 根据选择的 chainCode 找到对应的 chain_network
      const selectedChain = chains.find(c => c.chainCode === values.chainCode)
      if (selectedChain) {
        values.chain_network = selectedChain.chainNetwork
      }
      onSubmit(values)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <Modal
      title="创建代币"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="chainCode"
          label="所属链"
          rules={[{ required: true, message: '请选择所属链' }]}
        >
          <Select
            placeholder="选择区块链网络"
            loading={chainsLoading}
            showSearch
            optionFilterProp="children"
          >
            {chains?.map(chain => (
              <Option key={chain.chainCode} value={chain.chainCode}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{chain.chainName}</span> 
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="symbol"
              label="代币符号"
              rules={[
                { required: true, message: '请输入代币符号' },
                { pattern: /^[A-Z0-9]{1,10}$/, message: '符号应为1-10位大写字母或数字' }
              ]}
            >
              <Input placeholder="如: BTC、ETH" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="decimals"
              label="精度"
              rules={[
                { required: true, message: '请输入精度' },
                { type: 'number', min: 0, max: 18, message: '精度应在0-18之间' }
              ]}
            >
              <InputNumber min={0} max={18} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="name"
          label="代币名称"
          rules={[
            { required: true, message: '请输入代币名称' },
            { max: 50, message: '名称不能超过50个字符' }
          ]}
        >
          <Input placeholder="如: Bitcoin、Ethereum" />
        </Form.Item>

        <Form.Item
          name="contractAddress"
          label="合约地址"
        >
          <Input placeholder="合约代币地址（原生币可留空）" />
        </Form.Item>

        <Form.Item
          name="iconUrl"
          label="图标URL"
          rules={[
            { type: 'url', message: '请输入有效的URL地址' }
          ]}
        >
          <Input placeholder="代币图标地址" />
        </Form.Item>

        <Form.Item
          name="coingeckoId"
          label="CoinGecko ID"
        >
          <Input placeholder="用于价格查询的CoinGecko ID" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="isNative" label="原生币" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="isActive" label="启用" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default CurrencyCreateModal
