import React, { useState } from 'react'
import {
  Card,
  Form,
  Switch,
  Button,
  Typography,
  Row,
  Col,
  message,
  Alert,
  Space,
  InputNumber,
  Tag
} from 'antd'
import {
  SettingOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { walletService } from '@/services'


const { Title, Text } = Typography

interface HotWalletSettingsProps {
  walletId: string
  onBack: () => void
}

const HotWalletSettings: React.FC<HotWalletSettingsProps> = ({
  walletId,
  onBack
}) => {
  const [form] = Form.useForm()
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  // 获取钱包详情
  const { data: walletResponse, isLoading, refetch } = useQuery({
    queryKey: ['wallet-detail', walletId],
    queryFn: () => walletService.getWallet(walletId)
  })

  const wallet = walletResponse?.data

  // 更新钱包设置
  const updateWalletMutation = useMutation({
    mutationFn: async (values: any) => {
      // TODO: 实现更新钱包设置的API调用
      return Promise.resolve({ success: true })
    },
    onSuccess: () => {
      message.success('设置更新成功')
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['wallet-detail', walletId] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '设置更新失败')
    }
  })

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      await updateWalletMutation.mutateAsync(values)
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  // 开始编辑
  const handleEdit = () => {
    setIsEditing(true)
    form.setFieldsValue({
      autoCollection: wallet?.settings?.autoCollection,
      collectionThreshold: wallet?.settings?.collectionThreshold,
      withdrawalLimit: wallet?.settings?.withdrawalLimit,
      dailyWithdrawalLimit: wallet?.settings?.dailyWithdrawalLimit,
      requiresApproval: wallet?.settings?.requiresApproval,
      maxAddresses: 100,
      gasLimit: 21000,
      gasPrice: 20
    })
  }

  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false)
    form.resetFields()
  }

  if (isLoading) {
    return <div>加载中...</div>
  }

  if (!wallet) {
    return <div>钱包不存在</div>
  }

  return (
    <div>
      {/* 页面头部 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className="mr-4"
          >
            返回详情
          </Button>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <SettingOutlined className="mr-2" style={{ color: '#1890ff' }} />
              {wallet.name} - 设置
            </Title>
            <Text type="secondary">配置热钱包的各种参数和设置</Text>
          </div>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
          >
            刷新
          </Button>
          {!isEditing ? (
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={handleEdit}
            >
              编辑设置
            </Button>
          ) : (
            <Space>
              <Button onClick={handleCancel}>
                取消
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => form.submit()}
                loading={updateWalletMutation.isPending}
              >
                保存设置
              </Button>
            </Space>
          )}
        </Space>
      </div>

      {/* 设置表单 */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={!isEditing}
      >
        {/* 归集设置 */}
        <Card title="归集设置" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="autoCollection"
                label="自动归集"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="collectionThreshold"
                label="归集阈值"
                rules={[{ required: true, message: '请输入归集阈值' }]}
              >
                <InputNumber
                  min={0}
                  step={0.00000001}
                  precision={8}
                  style={{ width: '100%' }}
                  placeholder="0.001"
                />
              </Form.Item>
            </Col>
          </Row>
          <Alert
            message="归集说明"
            description="当钱包地址余额超过归集阈值时，系统会自动将资金归集到主钱包地址"
            type="info"
            showIcon
            className="mt-4"
          />
        </Card>

        {/* 限额设置 */}
        <Card title="限额设置" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="withdrawalLimit"
                label="单笔提现限额"
                rules={[{ required: true, message: '请输入单笔提现限额' }]}
              >
                <InputNumber
                  min={0}
                  step={0.00000001}
                  precision={8}
                  style={{ width: '100%' }}
                  placeholder="1.0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="dailyWithdrawalLimit"
                label="日提现限额"
                rules={[{ required: true, message: '请输入日提现限额' }]}
              >
                <InputNumber
                  min={0}
                  step={0.00000001}
                  precision={8}
                  style={{ width: '100%' }}
                  placeholder="10.0"
                />
              </Form.Item>
            </Col>
          </Row>
          <Alert
            message="限额说明"
            description="设置提现限额可以控制资金流出，提高账户安全性"
            type="warning"
            showIcon
            className="mt-4"
          />
        </Card>

        {/* 审批设置 */}
        <Card title="审批设置" className="mb-6">
          <Form.Item
            name="requiresApproval"
            label="需要审批"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="是"
              unCheckedChildren="否"
            />
          </Form.Item>
          <Alert
            message="审批说明"
            description="启用审批后，所有提现操作都需要管理员审批才能执行"
            type="info"
            showIcon
            className="mt-4"
          />
        </Card>

        {/* 高级设置 */}
        <Card title="高级设置" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="maxAddresses"
                label="最大地址数量"
                rules={[{ required: true, message: '请输入最大地址数量' }]}
              >
                <InputNumber
                  min={1}
                  max={1000}
                  style={{ width: '100%' }}
                  placeholder="100"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="gasLimit"
                label="Gas限制"
                rules={[{ required: true, message: '请输入Gas限制' }]}
              >
                <InputNumber
                  min={21000}
                  max={1000000}
                  style={{ width: '100%' }}
                  placeholder="21000"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="gasPrice"
                label="Gas价格 (Gwei)"
                rules={[{ required: true, message: '请输入Gas价格' }]}
              >
                <InputNumber
                  min={1}
                  max={1000}
                  style={{ width: '100%' }}
                  placeholder="20"
                />
              </Form.Item>
            </Col>
          </Row>
          <Alert
            message="高级设置说明"
            description="这些设置影响交易费用和性能，请谨慎调整"
            type="warning"
            showIcon
            className="mt-4"
          />
        </Card>
      </Form>

      {/* 当前设置预览 */}
      {!isEditing && (
        <Card title="当前设置预览" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card size="small" title="归集设置">
                <div className="space-y-2">
                  <div>自动归集: <Tag color={wallet.settings?.autoCollection ? 'green' : 'orange'}>
                    {wallet.settings?.autoCollection ? '启用' : '禁用'}
                  </Tag></div>
                  <div>归集阈值: {wallet.settings?.collectionThreshold || '-'}</div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small" title="限额设置">
                <div className="space-y-2">
                  <div>单笔提现限额: {wallet.settings?.withdrawalLimit || '-'}</div>
                  <div>日提现限额: {wallet.settings?.dailyWithdrawalLimit || '-'}</div>
                  <div>需要审批: <Tag color={wallet.settings?.requiresApproval ? 'red' : 'green'}>
                    {wallet.settings?.requiresApproval ? '是' : '否'}
                  </Tag></div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  )
}

export default HotWalletSettings
