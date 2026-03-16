import React, { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  InputNumber,
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
  ClockCircleOutlined,
  EditOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { collectionService, chainService, coldWalletService } from '@/services'
import { 
  TenantCollectionConfig, 
  CreateCollectionConfigRequest, 
  UpdateCollectionConfigRequest,
  Status,
  CollectionConfigType 
} from '@shared/types'

const { Option } = Select
const { Text } = Typography

interface CollectionConfigFormData {
  chainCodes: string[]
  symbols: string[]
  toAddress: string
  triggerThreshold: string
  minCollectAmount: string
  minGasBalance: string
  scheduleCron: string
}

interface CollectionConfigFormProps {
  visible: boolean
  editingConfig: TenantCollectionConfig | null
  onCancel: () => void
  onSuccess: () => void
}

const CollectionConfigForm: React.FC<CollectionConfigFormProps> = ({
  visible,
  editingConfig,
  onCancel,
  onSuccess
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [selectedChainCodes, setSelectedChainCodes] = useState<string[]>([])
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([])

  // 获取链列表
  const { data: chainsData, isLoading: chainsLoading } = useQuery({
    queryKey: ['chains', 'active'],
    queryFn: async () => {
      try {
        const result = await chainService.getActiveChains()
        return result.success ? result.data : null
      } catch (error) {
        console.error('获取链数据失败:', error)
        return null
      }
    }
  })

  // 获取冷钱包下拉选项（GET /cold-wallets/options，无分页）
  const { data: coldWalletsData, isLoading: coldWalletsLoading } = useQuery({
    queryKey: ['cold-wallets', 'options', visible],
    queryFn: async () => {
      try {
        return await coldWalletService.getColdWalletOptions()
      } catch (error) {
        console.error('获取冷钱包选项失败:', error)
        return []
      }
    },
    enabled: visible
  })

  const coldWallets = (coldWalletsData ?? []) as { id: string; name?: string; address: string }[]
  // 编辑时若当前 toAddress 不在冷钱包列表中，补充为选项以正确回显
  const toAddressOptions = React.useMemo(() => {
    const list = coldWallets.map((item) => ({
      address: item.address,
      name: item.name || '未命名',
      id: item.id
    }))
    if (editingConfig?.toAddress && !list.some((w) => w.address.toLowerCase() === editingConfig.toAddress?.toLowerCase())) {
      list.unshift({ address: editingConfig.toAddress, name: `(当前配置) ${editingConfig.toAddress.slice(0, 8)}...`, id: '' })
    }
    return list
  }, [coldWallets, editingConfig?.toAddress])

  // 从 chains 数据中提取所有代币
  const allCurrencies = (chainsData?.items as any[])?.flatMap((chain: any) => {
    if (!chain?.chainCode || !chain?.chainName || !Array.isArray(chain.currencies)) {
      return []
    }
    return chain.currencies
      .filter((currency: any) => currency?.symbol && currency?.name)
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
    setSelectedSymbols([])
  }

  // 处理代币选择变化
  const handleSymbolsChange = (values: string[]) => {
    setSelectedSymbols(values)
  }

  // 创建/更新归集配置
  const createConfigMutation = useMutation({
    mutationFn: collectionService.createConfig,
    onSuccess: () => {
      message.success(editingConfig ? '归集配置更新成功' : '归集配置创建成功')
      onSuccess()
      form.resetFields()
      setSelectedChainCodes([])
      setSelectedSymbols([])
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || (editingConfig ? '更新失败' : '创建失败'))
    }
  })

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, config }: { id: number; config: UpdateCollectionConfigRequest }) => 
      collectionService.updateConfig(id, config),
    onSuccess: () => {
      message.success('归集配置更新成功')
      onSuccess()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '更新失败')
    }
  })

  // 表单提交
  const handleSubmit = async (values: CollectionConfigFormData) => {
    try {
      if (editingConfig) {
        await updateConfigMutation.mutateAsync({
          id: editingConfig.id,
          config: {
            chainCodes: values.chainCodes?.filter(Boolean) || [],
            symbols: values.symbols?.filter(Boolean) || [],
            toAddress: values.toAddress,
            triggerThreshold: values.triggerThreshold,
            minCollectAmount: values.minCollectAmount,
            minGasBalance: values.minGasBalance,
            scheduleCron: values.scheduleCron
          }
        })
      } else {
        await createConfigMutation.mutateAsync({
          chainCodes: values.chainCodes?.filter(Boolean) || [],
          symbols: values.symbols?.filter(Boolean) || [],
          toAddress: values.toAddress,
          triggerThreshold: values.triggerThreshold,
          minCollectAmount: values.minCollectAmount,
          minGasBalance: values.minGasBalance,
          scheduleCron: values.scheduleCron || '0 */6 * * *'
        })
      }
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  // 当编辑配置变化时，设置表单值
  useEffect(() => {
    if (visible && editingConfig) {
      const chainCodes = editingConfig.chainCodes?.filter(Boolean) || []
      const symbols = editingConfig.symbols?.filter(Boolean) || []
      
      form.setFieldsValue({
        chainCodes: chainCodes,
        symbols: symbols,
        toAddress: editingConfig.toAddress || '',
        triggerThreshold: editingConfig.triggerThreshold || '',
        minCollectAmount: editingConfig.minCollectAmount || '',
        minGasBalance: editingConfig.minGasBalance || '',
        scheduleCron: editingConfig.scheduleCron || '0 */6 * * *'
      })
      
      setSelectedChainCodes(chainCodes)
      setSelectedSymbols(symbols)
    } else if (visible && !editingConfig) {
      form.setFieldsValue({
        chainCodes: [],
        symbols: [],
        toAddress: '',
        triggerThreshold: '',
        minCollectAmount: '',
        minGasBalance: '',
        scheduleCron: '0 */6 * * *'
      })
      
      setSelectedChainCodes([])
      setSelectedSymbols([])
    }
  }, [visible, editingConfig, form])

  const modalTitle = editingConfig ? '编辑归集配置' : '创建归集配置'
  const isLoading = createConfigMutation.isPending || updateConfigMutation.isPending

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          chainCodes: [],
          symbols: [],
          toAddress: '',
          triggerThreshold: '',
          minCollectAmount: '',
          minGasBalance: '',
          scheduleCron: '0 */6 * * *'
        }}
        className="space-y-4"
      >
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
                    <Tag color="blue" className="ml-2 text-xs">可选</Tag>
                  </div>
                }
                rules={[]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择支持的链（为空表示支持全部链）"
                  allowClear
                  showSearch
                  loading={chainsLoading}
                  size="large"
                  className="w-full"
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={handleChainCodesChange}
                >
                  {chainsLoading ? (
                    <Option disabled>加载中...</Option>
                  ) : !chainsData?.items || chainsData.items.length === 0 ? (
                    <Option disabled>暂无数据</Option>
                  ) : (
                    chainsData.items
                      .filter((chain: any) => chain.chainCode && chain.chainName)
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
                    <Tag color="green" className="ml-2 text-xs">可选</Tag>
                  </div>
                }
              >
                <Select
                  mode="multiple"
                  placeholder="请选择支持的代币（为空表示支持全部）"
                  allowClear
                  showSearch
                  loading={chainsLoading}
                  size="large"
                  className="w-full"
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={handleSymbolsChange}
                >
                  {chainsLoading ? (
                    <Option disabled>加载中...</Option>
                  ) : filteredCurrencies.length === 0 ? (
                    <Option disabled>暂无代币数据</Option>
                  ) : (
                    filteredCurrencies
                      .filter((currency: any) => currency.symbol && currency.name && currency.chainCode)
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

        {/* 目标地址配置区域 */}
        <Card 
          title={
            <div className="flex items-center">
              <WalletOutlined className="mr-2 text-purple-500" />
              <span className="font-medium">目标地址配置</span>
            </div>
          }
          size="small"
          className="border-purple-100 bg-purple-50/30 mb-4"
        >
          <Form.Item
            name="toAddress"
            label={
              <div className="flex items-center">
                <span className="font-medium">目标钱包地址</span>
                <Tag color="red" className="ml-2 text-xs">必填</Tag>
              </div>
            }
            rules={[{ required: true, message: '请选择目标钱包地址' }]}
          >
            <Select
              placeholder="请选择目标钱包地址（来自冷钱包）"
              size="large"
              loading={coldWalletsLoading}
              showSearch
              allowClear
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              className="font-mono"
              notFoundContent={coldWalletsLoading ? '加载中...' : '暂无冷钱包，请先在冷钱包管理中创建'}
            >
              {toAddressOptions.map((item) => (
                <Option
                  key={item.id || item.address}
                  value={item.address}
                  label={`${item.address} ${item.name || '未命名'}`}
                >
                  <div>
                    <div className="font-mono font-medium text-sm">{item.address}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.name || '未命名'}</div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2">
              <InfoCircleOutlined style={{ color: '#722ed1' }} />
              <Text type="secondary" className="text-sm text-purple-700">
                从冷钱包列表中选择归集目标地址
              </Text>
            </div>
          </div>
        </Card>

        {/* 归集参数配置区域 */}
        <Card 
          title={
            <div className="flex items-center">
              <SettingOutlined className="mr-2 text-orange-500" />
              <span className="font-medium">归集参数配置</span>
            </div>
          }
          size="small"
          className="border-orange-100 bg-orange-50/30 mb-4"
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="triggerThreshold"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">触发阈值</span>
                    <Tag color="red" className="ml-2 text-xs">必填</Tag>
                  </div>
                }
                rules={[{ required: true, message: '请输入触发阈值' }]}
              >
                <InputNumber
                  placeholder="触发阈值"
                  min={0}
                  precision={8}
                  size="large"
                  className="w-full"
                  addonAfter="代币"
                />
              </Form.Item>
              <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                <Text type="secondary" className="text-xs text-orange-700">
                  达到此金额时触发归集
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minCollectAmount"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">最小归集金额</span>
                    <Tag color="red" className="ml-2 text-xs">必填</Tag>
                  </div>
                }
                rules={[{ required: true, message: '请输入最小归集金额' }]}
              >
                <InputNumber
                  placeholder="最小归集金额"
                  min={0}
                  precision={8}
                  size="large"
                  className="w-full"
                  addonAfter="代币"
                />
              </Form.Item>
              <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                <Text type="secondary" className="text-xs text-orange-700">
                  单次归集的最小金额
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minGasBalance"
                label={
                  <div className="flex items-center">
                    <span className="font-medium">最小Gas余额</span>
                    <Tag color="red" className="ml-2 text-xs">必填</Tag>
                  </div>
                }
                rules={[{ required: true, message: '请输入最小Gas余额' }]}
              >
                <InputNumber
                  placeholder="最小Gas余额"
                  min={0}
                  precision={8}
                  size="large"
                  className="w-full"
                  addonAfter="代币"
                />
              </Form.Item>
              <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                <Text type="secondary" className="text-xs text-orange-700">
                  保留在源地址的Gas余额
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 调度配置区域 */}
        <Card 
          title={
            <div className="flex items-center">
              <ClockCircleOutlined className="mr-2 text-cyan-500" />
              <span className="font-medium">调度配置</span>
            </div>
          }
          size="small"
          className="border-cyan-100 bg-cyan-50/30 mb-4"
        >
          <Form.Item
            name="scheduleCron"
            label={
              <div className="flex items-center">
                <span className="font-medium">定时调度</span>
                <Tag color="blue" className="ml-2 text-xs">可选</Tag>
              </div>
            }
          >
            <Input 
              placeholder="0 */6 * * *" 
              size="large"
              className="font-mono"
            />
          </Form.Item>
          <div className="mt-2 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
            <div className="flex items-center gap-2">
              <InfoCircleOutlined style={{ color: '#13c2c2' }} />
              <Text type="secondary" className="text-sm text-cyan-700">
                Cron表达式，默认为每6小时执行一次。格式：分钟 小时 日期 月份 星期
              </Text>
            </div>
          </div>
        </Card>

        {/* 操作按钮区域 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button 
            size="large"
            onClick={onCancel}
            className="px-8"
          >
            取消
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isLoading}
            size="large"
            className="px-8"
            icon={editingConfig ? <EditOutlined /> : <PlusOutlined />}
          >
            {editingConfig ? '更新配置' : '创建配置'}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default CollectionConfigForm
