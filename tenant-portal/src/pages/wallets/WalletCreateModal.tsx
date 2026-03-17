import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  InputNumber,
  Alert,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  App
} from 'antd'
import { walletService, chainService } from '@/services'
import { Chain, CreateWalletRequest } from '@shared/types'
import { 
  WalletOutlined, 
  SettingOutlined, 
  PlusOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
 

interface WalletCreateModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
}

const WalletCreateModal: React.FC<WalletCreateModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 加载币种数据
  const loadCurrencyData = async () => {
    try {
      
      // 只加载链数据，币种信息已包含在链数据中
      const chainsResponse = await chainService.getActiveChains()

      // 从链数据中提取所有币种
      const allCurrencies: Array<{
        symbol: string
        name: string
        chainCode: string
      }> = []
      
      chainsResponse.data.items.forEach((chain: Chain) => {
        if (chain.currencies && Array.isArray(chain.currencies)) {
          chain.currencies.forEach(currency => {
            allCurrencies.push({
              symbol: currency.symbol,
              name: currency.name,
              chainCode: currency.chainCode
            })
          })
        }
      })
      
    } catch (error) {
      console.error('加载币种数据失败:', error)
      message.error('加载币种数据失败')
    }
  }

  useEffect(() => {
    if (visible) {
      loadCurrencyData()
    }
  }, [visible])

  const handleSubmit = async (values: CreateWalletRequest) => {
    try {
      setLoading(true)
      
      // 批量创建钱包
      const promises = Array.from({ length: values.quantity }, () =>
        walletService.createWallet({
          quantity: values.quantity,
          name: values.name,
          description: values.description
        })
      )
      
      await Promise.all(promises)

      message.success(`成功创建 ${values.quantity} 个钱包！`)
      form.resetFields()
      onSuccess()
    } catch (error) {
      console.error('创建钱包失败:', error)
      message.error('创建钱包失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title="创建钱包"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <Alert
        message="钱包创建说明"
        description="系统将自动生成钱包地址和私钥，私钥将进行加密存储。支持批量创建多个钱包。"
        type="info"
        showIcon
        className="mb-6"
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          quantity: 1
        }}
        className="space-y-4"
      >
        {/* 基本信息区域 */}
        <Card 
          title={
            <div className="flex items-center">
              <WalletOutlined className="mr-2 text-green-500" />
              <span className="font-medium">基本信息</span>
            </div>
          }
          size="small"
          className="border-green-100 bg-green-50/30 mb-4"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">创建数量</span>
                    <Tag color="red" className="ml-2 text-xs">必填</Tag>
                  </div>
                }
                rules={[
                  { required: true, message: '请输入创建数量' },
                  { type: 'number', min: 1, max: 100, message: '创建数量应在1-100之间' }
                ]}
              >
                <InputNumber
                  placeholder="请输入创建数量"
                  min={1}
                  max={100}
                  size="large"
                  className="w-full"
                />
              </Form.Item>
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <InfoCircleOutlined style={{ color: '#52c41a' }} />
                  <span className="text-sm font-medium text-green-700">批量创建说明</span>
                </div>
                <Typography.Text type="secondary" className="text-xs text-green-600">
                  支持批量创建1-100个钱包，系统将自动生成地址和私钥
                </Typography.Text>
              </div>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">钱包名称</span>
                    <Tag color="blue" className="ml-2 text-xs">可选</Tag>
                  </div>
                }
              >
                <Input 
                  placeholder="请输入钱包名称（可选）"
                  size="large"
                  className="w-full"
                />
              </Form.Item>
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                  <InfoCircleOutlined style={{ color: '#52c41a' }} />
                  <span className="text-sm font-medium text-green-700">命名规则</span>
                </div>
                <Typography.Text type="secondary" className="text-xs text-green-600">
                 不输入则使用默认名称格式：Wallet_序号
                </Typography.Text>
              </div>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="description"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">描述</span>
                    <Tag color="blue" className="ml-2 text-xs">可选</Tag>
                  </div>
                }
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="请输入钱包描述（可选）"
                  maxLength={200}
                  showCount
                  size="large"
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 创建配置区域 */}
        <Card 
          title={
            <div className="flex items-center">
              <SettingOutlined className="mr-2 text-blue-500" />
              <span className="font-medium">创建配置</span>
            </div>
          }
          size="small"
          className="border-blue-100 bg-blue-50/30 mb-4"
        >
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <span className="text-sm font-medium text-blue-700">系统自动处理</span>
            </div>
            <div className="space-y-2 text-xs text-blue-600">
              <div>• 自动生成安全的钱包地址和私钥</div>
              <div>• 私钥将进行加密存储，确保安全性</div>
              <div>• 支持多种区块链网络和代币</div>
              <div>• 批量创建完成后可统一管理</div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Space size="large">
            <Button 
              onClick={handleCancel}
              size="large"
              className="px-6"
            >
              取消
            </Button>
            <Button 
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              className="px-8"
              icon={<PlusOutlined />}
            >
              创建钱包
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  )
}

export default WalletCreateModal 