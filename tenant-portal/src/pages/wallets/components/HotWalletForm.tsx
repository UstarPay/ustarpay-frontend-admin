import React, { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  Space,
  Switch,
  Typography,
  Tag,
  Card,
  App
} from 'antd'
import { 
  InfoCircleOutlined, 
  CheckCircleOutlined, 
  FilterOutlined,
  WalletOutlined,
  SettingOutlined,
  EditOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { hotWalletService, chainService } from '@/services'
import type { HotWalletWithBalance, HotWallet } from '@shared/types'
import type { Chain } from '@shared/types'

// 临时类型定义，匹配实际 API 响应
interface ActualHotWalletWithBalance {
  wallet: HotWallet
  balanceByChain: any
}

const { Option } = Select
const { Text } = Typography

interface HotWalletFormData {
  name: string
  description?: string
  chainCodes: string[]
  symbols: string[]
  isWithdrawalWallet: boolean
  isGasWallet: boolean
  status: number
}

interface HotWalletFormProps {
  visible: boolean
  editingWallet: ActualHotWalletWithBalance | null
  onCancel: () => void
  onSuccess: () => void
}

const HotWalletForm: React.FC<HotWalletFormProps> = ({
  visible,
  editingWallet,
  onCancel,
  onSuccess
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [selectedChainCodes, setSelectedChainCodes] = useState<string[]>([])

  // 获取链列表
  const { data: chainsData, isLoading: chainsLoading, error: chainsError } = useQuery({
    queryKey: ['chains', 'active'],
    queryFn: async () => {
      console.log('开始获取活跃 chains 数据...')
      try {
        const result = await chainService.getActiveChains()
        console.log('chains API 调用成功:', result)
        return result.success? result.data : null
      } catch (error) {
        console.error('chains API 调用失败:', error)
        throw error
      }
    }
  })

  // 从 chains 数据中提取所有代币
  const allCurrencies = (chainsData?.items as Chain[])?.flatMap((chain: Chain) => {
    if (!chain?.chainCode || !chain?.chainName || !Array.isArray(chain.currencies)) {
      return []
    }
    return chain.currencies
      .filter((currency: any) => currency?.symbol && currency?.name) // 过滤掉无效代币
      .map((currency: any) => ({
        ...currency,
        chainCode: chain.chainCode,
        chainName: chain.chainName
      }))
  }) || []

  // 根据已选择的链筛选代币
  const filteredCurrencies = selectedChainCodes.length > 0
    ? allCurrencies.filter(currency => selectedChainCodes.includes(currency.chainCode))
    : allCurrencies

  // 处理链选择变化
  const handleChainCodesChange = (values: string[]) => {
    setSelectedChainCodes(values)
    // 当链选择变化时，清空代币选择，因为代币列表会改变
    form.setFieldValue('symbols', [])
    // 使用 setTimeout 避免循环引用问题
    setTimeout(() => {
      form.setFieldValue('chainCodes', values)
    }, 0)
  }



  // 创建热钱包
  const createWalletMutation = useMutation({
    mutationFn: hotWalletService.createHotWallet,
    onSuccess: () => {
      message.success('热钱包创建成功')
      onSuccess()
      form.setFieldsValue({
        name: '',
        description: '',
        chainCodes: [],
        symbols: [],
        isWithdrawalWallet: true,
        isGasWallet: true,
        status: 1
      })
      setSelectedChainCodes([])
    },
    onError: (error: any) => {
      message.error(error?.message || error.response?.data?.message || '创建失败')
    }
  })

  // 更新热钱包（描述、提现钱包、Gas钱包、状态）
  const updateWalletMutation = useMutation({
    mutationFn: async (params: { id: string; data: { description?: string; isWithdrawalWallet?: boolean; isGasWallet?: boolean; status?: number } }) => {
      const { id, data } = params
      return hotWalletService.updateHotWallet(id, data)
    },
    onSuccess: () => {
      message.success('热钱包更新成功')
      onSuccess()
    },
    onError: (error: any) => {
      message.error(error?.message || error.response?.data?.message || '更新失败')
    }
  })

  // 表单提交
  const handleSubmit = async (values: HotWalletFormData) => {
    try {
      if (editingWallet) {
        await updateWalletMutation.mutateAsync({
          id: editingWallet.wallet.id,
          data: {
            description: values.description,
            isWithdrawalWallet: values.isWithdrawalWallet,
            isGasWallet: values.isGasWallet,
            status: values.status
          }
        })
      } else {
        await createWalletMutation.mutateAsync({
          name: values.name,
          description: values.description,
          chainCodes: values.chainCodes?.filter(Boolean) || [],
          symbols: values.symbols?.filter(Boolean) || [],
          isWithdrawalWallet: values.isWithdrawalWallet,
          isGasWallet: values.isGasWallet,
          status: values.status
        })
      }
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  // 当编辑钱包变化时，设置表单值
  useEffect(() => {
    if (visible && editingWallet) {
      const chainCodes = editingWallet.wallet?.chainCodes?.filter(Boolean) || []
      const symbols = editingWallet.wallet?.symbols?.filter(Boolean) || []
      
      form.setFieldsValue({
        name: editingWallet.wallet?.name || '',
        description: editingWallet.wallet?.description || '',
        chainCodes: chainCodes,
        symbols: symbols,
        isWithdrawalWallet: editingWallet.wallet?.isWithdrawalWallet ?? true,
        isGasWallet: editingWallet.wallet?.isGasWallet ?? true,
        status: editingWallet.wallet?.status ?? 1
      })
      
      // 同步链选择状态
      setSelectedChainCodes(chainCodes)
    } else if (visible && !editingWallet) {
      form.setFieldsValue({
        name: '',
        description: '',
        chainCodes: [],
        symbols: [],
        isWithdrawalWallet: true,
        isGasWallet: true,
        status: 1
      })
      
      // 重置链选择状态
      setSelectedChainCodes([])
    }
  }, [visible, editingWallet, form])

  const modalTitle = editingWallet ? '热钱包更新' : '创建热钱包'
  const isEditing = !!editingWallet

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: '',
          description: '',
          chainCodes: [],
          symbols: [],
          isWithdrawalWallet: true,
          isGasWallet: true,
          status: 1
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
                name="name"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">钱包名称</span>
                    {!isEditing && <Tag color="red" className="ml-2 text-xs">必填</Tag>}
                  </div>
                }
                rules={isEditing ? [] : [{ required: true, message: '请输入钱包名称' }]}
              >
                <Input 
                  placeholder="请输入钱包名称" 
                  size="large"
                  className="w-full"
                  disabled={isEditing}
                  readOnly={isEditing}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
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
                  placeholder="请输入钱包描述（可选）"
                  rows={3}
                  size="large"
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 链和代币配置区域 */}
        <Card 
          title={
            <div className="flex items-center">
              <FilterOutlined className="mr-2 text-blue-500" />
              <span className="font-medium">链和代币配置</span>
            </div>
          }
          size="small"
          className="border-blue-100 bg-blue-50/30 mb-4"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="chainCodes"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">支持的链</span>
                    {!isEditing && <Tag color="blue" className="ml-2 text-xs">可选</Tag>}
                  </div>
                }
              >
                <Select
                  mode="multiple"
                  placeholder="请选择支持的链（为空表示全部）"
                  allowClear
                  showSearch
                  loading={chainsLoading}
                  value={form.getFieldValue('chainCodes') || []}
                  size="large"
                  className="w-full"
                  disabled={isEditing}
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={isEditing ? undefined : handleChainCodesChange}
                >
                  {chainsLoading ? (
                    <Option disabled>加载中...</Option>
                  ) : chainsError ? (
                    <Option disabled>加载失败</Option>
                  ) : !chainsData?.items || chainsData.items.length === 0 ? (
                    <Option disabled>暂无数据</Option>
                  ) : (
                    chainsData.items
                      .filter((chain: any) => chain.chainCode && chain.chainName) // 过滤掉无效数据
                      .map((chain: any) => (
                        <Option key={chain.chainCode} value={chain.chainCode} label={chain.chainName}>
                          {chain.chainName} ({chain.chainCode})
                        </Option>
                      ))
                  )}
                </Select>
              </Form.Item>
              {selectedChainCodes.length > 0 ? (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FilterOutlined style={{ color: '#1890ff' }} />
                    <span className="text-sm font-medium text-blue-700">已选择 {selectedChainCodes.length} 个链</span>
                  </div>
                  <Text type="secondary" className="text-xs text-blue-600">
                    代币选择将只显示对应链的代币
                  </Text>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <span className="text-sm font-medium text-green-700">支持全部链</span>
                  </div>
                  <Text type="secondary" className="text-xs text-green-600">
                    未选择链时，将支持所有可用的链
                  </Text>
                </div>
              )}
            </Col>
                      <Col span={12}>
              <Form.Item
                name="symbols"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">支持的代币</span>
                    {!isEditing && <Tag color="green" className="ml-2 text-xs">可选</Tag>}
                  </div>
                }
              >
                <Select
                  mode="multiple"
                  placeholder="请选择支持的代币（为空表示全部）"
                  allowClear
                  showSearch
                  loading={chainsLoading}
                  size="large"
                  className="w-full"
                  disabled={isEditing}
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {chainsLoading ? (
                    <Option disabled>加载中...</Option>
                  ) : chainsError ? (
                    <Option disabled>加载失败</Option>
                  ) : filteredCurrencies.length === 0 ? (
                    <Option disabled>暂无代币数据</Option>
                  ) : (
                    filteredCurrencies
                      .filter((currency: any) => currency.symbol && currency.name && currency.chainCode) // 过滤掉无效数据
                      .map((currency: any) => (
                        <Option key={`${currency.chainCode}-${currency.symbol}`} value={currency.symbol} label={currency.name}>
                          {currency.name} ({currency.symbol}) - {currency.chainName}
                        </Option>
                      ))
                  )}
                </Select>
              </Form.Item>
              {selectedChainCodes.length === 0 ? (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <span className="text-sm font-medium text-green-700">显示所有可用代币</span>
                  </div>
                  <Text type="secondary" className="text-xs text-green-600">
                    未选择链时，将显示所有链的代币
                  </Text>
                </div>
                ) : (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    <span className="text-sm font-medium text-blue-700">筛选结果：{filteredCurrencies.length} 个代币</span>
                  </div>
                  <Text type="secondary" className="text-xs text-blue-600">
                    来自 {selectedChainCodes.length} 个选中的链
                  </Text>
                </div>
              )}
            </Col>
          </Row>
        </Card>

        {/* 钱包属性配置区域 */}
        <Card 
          title={
            <div className="flex items-center">
              <SettingOutlined className="mr-2 text-orange-500" />
              <span className="font-medium">钱包属性配置</span>
            </div>
          }
          size="small"
          className="border-orange-100 bg-orange-50/30 mb-4"
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="isWithdrawalWallet"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">提现钱包</span>
                    <Tag color="blue" className="ml-2 text-xs">可选</Tag>
                  </div>
                }
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="是"
                  unCheckedChildren="否"
                />
              </Form.Item>
              <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                <Text type="secondary" className="text-xs text-orange-700">
                  是否作为提现钱包使用
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isGasWallet"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">Gas 钱包</span>
                    <Tag color="blue" className="ml-2 text-xs">可选</Tag>
                  </div>
                }
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="是"
                  unCheckedChildren="否"
                />
              </Form.Item>
              <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                <Text type="secondary" className="text-xs text-orange-700">
                  是否作为Gas费用钱包使用
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">钱包状态</span>
                    <Tag color="blue" className="ml-2 text-xs">可选</Tag>
                  </div>
                }
              >
                <Select size="large" className="w-full">
                  <Option value={1}>正常</Option>
                  <Option value={0}>禁用</Option>
                  <Option value={-1}>冻结</Option>
                </Select>
              </Form.Item>
              <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                <Text type="secondary" className="text-xs text-orange-700">
                  钱包的初始状态设置
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        <Form.Item className="mb-0 text-right">
          <Space size="large">
            <Button 
              onClick={onCancel}
              size="large"
              className="px-6"
            >
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={createWalletMutation.isPending || updateWalletMutation.isPending}
              size="large"
              className="px-8"
              icon={editingWallet ? <EditOutlined /> : <PlusOutlined />}
            >
              {editingWallet ? '更新' : '创建'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default HotWalletForm
