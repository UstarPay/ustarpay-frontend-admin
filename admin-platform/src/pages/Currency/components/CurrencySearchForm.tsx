import React from 'react'
import { Form, Input, Select, Button, Space } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { CurrencyListParams } from '@shared/types/currency'
import type { Chain } from '@shared/types/chain'

const { Option } = Select

interface CurrencySearchFormProps {
  onSearch: (params: CurrencyListParams) => void
  onReset: () => void
  chains: Chain[]
  chainsLoading: boolean
  loading: boolean
}

const CurrencySearchForm: React.FC<CurrencySearchFormProps> = ({
  onSearch,
  onReset,
  chains,
  chainsLoading,
  loading,
}) => {
  const [form] = Form.useForm()

  const handleSearch = (values: any) => {
    const params: CurrencyListParams = {
      page: 1, // 搜索时重置到第一页
      pageSize: 20,
      ...values,
    }
    onSearch(params)
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <div className="currency-search-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSearch}
        autoComplete="off"
      >
        <Form.Item name="keyword" label="搜索">
          <Input placeholder="代币符号、名称" />
        </Form.Item>

        <Form.Item name="chainCode" label="所属链">
          <Select
            placeholder="选择区块链网络"
            allowClear
            loading={chainsLoading}
            showSearch
            optionFilterProp="children"
          >
            {chains?.map((chain) => (
              <Option key={chain.chainCode} value={chain.chainCode}>
                {chain.chainName} ({chain.chainCode})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="isNative" label="类型">
          <Select placeholder="选择类型" allowClear>
            <Option value={true}>原生币</Option>
            <Option value={false}>合约代币</Option>
          </Select>
        </Form.Item>

        <Form.Item name="status" label="状态">
          <Select placeholder="选择状态" allowClear>
            <Option value={1}>启用</Option>
            <Option value={0}>禁用</Option>
          </Select>
        </Form.Item>

        <Form.Item className="currency-search-actions" style={{ marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              className="currency-primary-btn"
              htmlType="submit"
              icon={<SearchOutlined />}
              loading={loading}
            >
              搜索
            </Button>
            <Button
              className="currency-ghost-btn"
              onClick={handleReset}
              icon={<ReloadOutlined />}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

export default CurrencySearchForm
