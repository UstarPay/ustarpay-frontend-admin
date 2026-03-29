import React from 'react'
import { Form, Input, Select, Button, Row, Col, Space } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ChainListParams } from '@shared/types/chain'

const { Option } = Select

interface ChainSearchFormProps {
  loading: boolean
  onSearch: (params: ChainListParams) => void
  onReset: () => void
}

const ChainSearchForm: React.FC<ChainSearchFormProps> = ({
  loading,
  onSearch,
  onReset,
}) => {
  const [form] = Form.useForm()

  const handleSearch = () => {
    const values = form.getFieldsValue()
    const params: ChainListParams = {
      page: 1,
      pageSize: 20,
      ...values,
    }

    // 过滤空值
    Object.keys(params).forEach((key) => {
      if (
        params[key as keyof ChainListParams] === undefined ||
        params[key as keyof ChainListParams] === ''
      ) {
        delete params[key as keyof ChainListParams]
      }
    })

    onSearch(params)
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <div className="chain-search-form">
      <Form form={form} layout="vertical" onFinish={handleSearch}>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="chainName" label="链名称">
              <Input
                placeholder="搜索链名称"
                allowClear
                onPressEnter={handleSearch}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="chainCode" label="链代码">
              <Input
                placeholder="搜索链代码"
                allowClear
                onPressEnter={handleSearch}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="chainNetwork" label="网络类型">
              <Select placeholder="选择网络类型" allowClear>
                <Option value="EVM">EVM</Option>
                <Option value="Bitcoin">Bitcoin</Option>
                <Option value="Tron">Tron</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Form.Item name="status" label="状态">
              <Select placeholder="选择状态" allowClear>
                <Option value={1}>启用</Option>
                <Option value={0}>禁用</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={24}>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button
                  type="primary"
                  className="chain-primary-btn"
                  icon={<SearchOutlined />}
                  htmlType="submit"
                  loading={loading}
                >
                  搜索
                </Button>
                <Button
                  className="chain-ghost-btn"
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default ChainSearchForm
