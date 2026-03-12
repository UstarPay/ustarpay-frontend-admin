import React from 'react'
import { Form, Input, Select, Row, Col, Button, Space } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { CurrencyListParams } from '@shared/types/currency'
import type { Chain } from '@shared/types/chain'

const { Option } = Select

interface CurrencySearchFormProps {
  onSearch: (params: CurrencyListParams) => void
  onReset: () => void
  chains: Chain[]
  chainsLoading: boolean
}

const CurrencySearchForm: React.FC<CurrencySearchFormProps> = ({
  onSearch,
  onReset,
  chains,
  chainsLoading
}) => {
  const [form] = Form.useForm()

  const handleSearch = (values: any) => {
    const params: CurrencyListParams = {
      page: 1, // 搜索时重置到第一页
      pageSize: 20,
      ...values
    }
    onSearch(params)
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSearch}
      autoComplete="off"
    >
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="search"
            label="搜索"
          >
            <Input placeholder="代币符号、名称" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="chainCode"
            label="所属链"
          >
            <Select
              placeholder="选择区块链网络"
              allowClear
              loading={chainsLoading}
              showSearch
              optionFilterProp="children"
            >
              {chains?.map(chain => (
                <Option key={chain.chainCode} value={chain.chainCode}>
                  {chain.chainName} (EVM)
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="isNative"
            label="类型"
          >
            <Select placeholder="选择类型" allowClear>
              <Option value={true}>原生币</Option>
              <Option value={false}>合约代币</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Form.Item
            name="isActive"
            label="状态"
          >
            <Select placeholder="选择状态" allowClear>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Col>
      </Row>
    </Form>
  )
}

export default CurrencySearchForm
