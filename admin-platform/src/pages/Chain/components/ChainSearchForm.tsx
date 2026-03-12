import React from 'react'
import { Card, Form, Input, Select, Button, Row, Col, Space } from 'antd'
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
  onReset
}) => {
  const [form] = Form.useForm()

  const handleSearch = () => {
    const values = form.getFieldsValue()
    const params: ChainListParams = {
      page: 1,
      page_size: 20,
      ...values
    }
    
    // 过滤空值
    Object.keys(params).forEach(key => {
      if (params[key as keyof ChainListParams] === undefined || params[key as keyof ChainListParams] === '') {
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
    <Card style={{ marginBottom: '16px' }}>
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="chain_name" label="链名称">
              <Input 
                placeholder="搜索链名称" 
                allowClear
                onPressEnter={handleSearch}
              />
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item name="chain_code" label="链代码">
              <Input 
                placeholder="搜索链代码" 
                allowClear
                onPressEnter={handleSearch}
              />
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item name="network_type" label="网络类型">
              <Select placeholder="选择网络类型" allowClear>
                <Option value="evm">EVM</Option>
                <Option value="bitcoin">Bitcoin</Option>
                <Option value="tron">Tron</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item name="is_mainnet" label="网络环境">
              <Select placeholder="选择网络环境" allowClear>
                <Option value={true}>主网</Option>
                <Option value={false}>测试网</Option>
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
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  loading={loading}
                >
                  搜索
                </Button>
                <Button 
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
    </Card>
  )
}

export default ChainSearchForm
