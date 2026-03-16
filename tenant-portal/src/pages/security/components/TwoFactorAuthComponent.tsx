import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Alert,
  Space,
  Typography,
  Form,
  Input,
  message,
  QRCode,
  Steps,
  Modal,
  Tag,
  Spin,
  Row,
  Col
} from 'antd'
import {
  SafetyCertificateOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  KeyOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { twoFAService } from '@/services'
import type { TenantInfo } from '@/services/tenantService'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps

interface TwoFactorAuthComponentProps {
  // 基础属性
  tenantInfo?: TenantInfo | null
  loading?: boolean
  onUpdate?: () => void

  // 样式控制
  showCard?: boolean           // 是否显示外层卡片
  showHeader?: boolean         // 是否显示标题头部
  showSteps?: boolean         // 是否显示步骤指示器
  showStatusAlerts?: boolean  // 是否显示状态提醒

  // 布局控制
  // layout?: 'card' | 'inline'  // 布局模式 (暂未使用，为未来扩展预留)

  // 自定义样式
  cardProps?: any
  className?: string

  // 跳转控制
  context?: 'security' | 'settings'  // 组件使用上下文，用于确定跳转路径
  onTabChange?: (tabKey: string) => void  // 标签页切换回调 (仅settings上下文使用)
}

const TwoFactorAuthComponent: React.FC<TwoFactorAuthComponentProps> = ({
  tenantInfo,
  loading: parentLoading = false,
  onUpdate,
  showCard = true,
  showHeader = true,
  showSteps = true,
  showStatusAlerts = true,
  // layout = 'card',  // 暂未使用，注释掉避免lint警告
  cardProps = {},
  className = '',
  context = 'security',  // 默认为security上下文
  onTabChange
}) => {
  const queryClient = useQueryClient()
  const [setupLoading, setSetupLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [backupModalVisible, setBackupModalVisible] = useState(false)
  const [secondaryPasswordModalVisible, setSecondaryPasswordModalVisible] = useState(false)
  const [disable2FAModalVisible, setDisable2FAModalVisible] = useState(false)

  // 表单实例
  const [secondaryPasswordForm] = Form.useForm()
  const [verifyForm] = Form.useForm()
  const [disable2FAForm] = Form.useForm()

  // 获取2FA状态
  const { data: twoFAStatus, isLoading: twoFALoading } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: () => twoFAService.get2FAStatus(),
    retry: false
  })

  // 根据状态设置当前步骤
  useEffect(() => {
    if (twoFAStatus?.data) {
      if (twoFAStatus.data.enabled) {
        setCurrentStep(2)
      } else {
        setCurrentStep(1)
      }
    } else {
      setCurrentStep(0)
    }
  }, [twoFAStatus])

  // 生成QR码内容
  const generateQRContent = () => {
    if (!twoFAStatus?.data?.secret) return ''
    const issuer = 'UStarPay'
    const accountName = tenantInfo?.email || 'tenant'
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${twoFAStatus.data.secret}&issuer=${encodeURIComponent(issuer)}`
  }

  // 获取二级密码设置路径
  const getSecondaryPasswordPath = () => {
    return context === 'settings' ? '/settings/profile' : '/security/secondary-password'
  }

  // 处理跳转到二级密码设置
  const handleNavigateToSecondaryPassword = () => {
    if (context === 'settings') {
      // 如果在settings中，切换到二级密码标签页
      if (onTabChange) {
        onTabChange('secondary-password')
        message.success('已切换到二级密码设置')
      } else {
        message.info('请在"二级密码"标签页中设置二级密码')
      }
    } else {
      // 如果在security中，直接跳转
      const path = getSecondaryPasswordPath()
      window.location.href = path
    }
  }

  // 处理启用2FA
  const handleEnable2FA = async () => {
    // 检查是否已设置二级密码
    if (!tenantInfo?.hasSecondaryPassword) {
      Modal.confirm({
        title: '需要先设置二级密码',
        content: '启用2FA需要验证二级密码。您还未设置二级密码，是否前往设置？',
        okText: '前往设置',
        cancelText: '取消',
        onOk: handleNavigateToSecondaryPassword
      })
      return
    }

    setSecondaryPasswordModalVisible(true)
  }

  // 处理二级密码验证并启用2FA
  const handleSecondaryPasswordVerify = async (values: { secondaryPassword: string }) => {
    try {
      setSetupLoading(true)
      const response = await twoFAService.create2FA({
        enabled: true,
        secondaryPassword: values.secondaryPassword  // 改为传递二级密码
      })

      if (response.success) {
        message.success('2FA已启用，请完成验证')
        setSecondaryPasswordModalVisible(false)
        secondaryPasswordForm.resetFields()
        queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
        setCurrentStep(1)
        onUpdate?.()
      }
    } catch (error) {
      console.error('启用2FA失败:', error)
      message.error('二级密码错误或启用2FA失败')
    } finally {
      setSetupLoading(false)
    }
  }

  // 处理验证2FA
  const handleVerify2FA = async (values: { code: string }) => {
    try {
      setVerifyLoading(true)
      const response = await twoFAService.verifyTOTP({
        code: values.code,
      })

      if (response.success) {
        message.success('2FA验证成功')
        verifyForm.resetFields()
        queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
        setCurrentStep(2)
        onUpdate?.()
      } else {
        message.error('验证码错误，请重试')
      }
    } catch (error) {
      console.error('验证2FA失败:', error)
      message.error('验证码错误，请重试')
    } finally {
      setVerifyLoading(false)
    }
  }

  // 处理禁用2FA
  const handleDisable2FA = () => {
    setDisable2FAModalVisible(true)
  }

  // 处理禁用2FA确认
  const handleDisable2FAConfirm = async (values: { secondaryPassword: string; code: string }) => {
    try {
      setDisableLoading(true)
      await twoFAService.delete2FA({
        secondaryPassword: values.secondaryPassword,
        code: values.code
      })
      message.success('2FA已禁用')
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
      setCurrentStep(0)
      onUpdate?.()
      setDisable2FAModalVisible(false)
      disable2FAForm.resetFields()
    } catch (error: any) {
      console.error('禁用2FA失败:', error)
      message.error(error.response?.data?.message || '禁用2FA失败')
    } finally {
      setDisableLoading(false)
    }
  }

  // 处理复制密钥
  const handleCopySecret = () => {
    if (twoFAStatus?.data?.secret) {
      navigator.clipboard.writeText(twoFAStatus.data.secret)
      message.success('密钥已复制到剪贴板')
    }
  }

  // 处理下载备份码
  const handleDownloadBackupCodes = () => {
    if (!twoFAStatus?.data?.backupCodes) return

    const content = twoFAStatus.data.backupCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '2fa-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('备份码已下载')
  }

  const loading = parentLoading || twoFALoading

  // 渲染内容
  const renderContent = () => (
    <Spin spinning={loading}>
      <div className={`space-y-6 ${className}`}>
        {/* 2FA状态展示 */}
        {showStatusAlerts && (
          <Row gutter={[24, 16]} className="mb-6">
            <Col xs={24} md={12}>
              <div style={{ height: '120px' }}>
                <Alert
                  message="2FA状态"
                  description={
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span>双因素认证: </span>
                        <Tag
                          color={tenantInfo?.has2FA ? 'green' : 'orange'}
                          icon={tenantInfo?.has2FA ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                          className="ml-1"
                        >
                          {tenantInfo?.has2FA ? '已启用' : '未启用'}
                        </Tag>
                      </div>
                      <Text type="secondary" className="text-sm block">
                        {tenantInfo?.has2FA
                          ? '您的账户已受到双因素认证保护'
                          : '建议启用2FA以增强账户安全'
                        }
                      </Text>
                    </div>
                  }
                  type="info"
                  showIcon
                  className="rounded-lg h-full"
                  style={{
                    height: '100%',
                    borderRadius: '8px',
                    border: '1px solid #d6f7ff',
                    backgroundColor: '#f6ffff'
                  }}
                />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ height: '120px' }}>
                <Alert
                  message="前置条件"
                  description={
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span>二级密码: </span>
                        <Tag
                          color={tenantInfo?.hasSecondaryPassword ? 'green' : 'red'}
                          icon={tenantInfo?.hasSecondaryPassword ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                          className="ml-1"
                        >
                          {tenantInfo?.hasSecondaryPassword ? '已设置' : '未设置'}
                        </Tag>
                      </div>
                      <Text type="secondary" className="text-sm block">
                        {tenantInfo?.hasSecondaryPassword
                          ? '已满足2FA启用的前置条件'
                          : '启用2FA需要先设置二级密码'
                        }
                      </Text>
                    </div>
                  }
                  type={tenantInfo?.hasSecondaryPassword ? 'success' : 'warning'}
                  showIcon
                  className="rounded-lg h-full"
                  style={{
                    height: '100%',
                    borderRadius: '8px',
                    border: tenantInfo?.hasSecondaryPassword
                      ? '1px solid #b7eb8f'
                      : '1px solid #e6f4ff',
                    backgroundColor: tenantInfo?.hasSecondaryPassword
                      ? '#f6ffed'
                      : '#f0f9ff'
                  }}
                />
              </div>
            </Col>
          </Row>
        )}

        {/* 步骤指示器 */}
        {showSteps && (
          <Steps current={currentStep} className="mb-6">
            <Step title="启用2FA" icon={<SafetyCertificateOutlined />} />
            <Step title="扫描二维码" icon={<QrcodeOutlined />} />
            <Step title="验证完成" icon={<CheckCircleOutlined />} />
          </Steps>
        )}

        {/* 未启用状态 */}
        {currentStep === 0 && (
          <div className="text-center py-8">
            <Title level={4}>开始设置双因素认证</Title>
            <Paragraph className="mb-6 text-gray-600">
              双因素认证为您的账户提供额外的安全保护层
            </Paragraph>

            {/* 二级密码状态检查 */}
            {!tenantInfo?.hasSecondaryPassword ? (
              <div className="mb-6">
                <Alert
                  message="需要先设置二级密码"
                  description="启用2FA需要验证二级密码，请先完成二级密码设置"
                  type="info"
                  showIcon
                  className="rounded-lg mb-4"
                  style={{
                    border: '1px solid #e6f4ff',
                    backgroundColor: '#f0f9ff'
                  }}
                  action={
                    <Button
                      size="small"
                      type="link"
                      icon={<ArrowRightOutlined />}
                      onClick={handleNavigateToSecondaryPassword}
                    >
                      {context === 'settings' ? '前往二级密码标签页' : '前往二级密码设置'}
                    </Button>
                  }
                />
                <Button
                  type="default"
                  size="large"
                  icon={<KeyOutlined />}
                  onClick={handleNavigateToSecondaryPassword}
                  className="px-8"
                >
                  设置二级密码
                </Button>
              </div>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<SafetyCertificateOutlined />}
                onClick={handleEnable2FA}
                loading={setupLoading}
                className="primary-button px-8"
              >
                启用2FA
              </Button>
            )}
          </div>
        )}

        {/* 设置中状态 */}
        {currentStep === 1 && twoFAStatus?.data && (
          <div>
            <Title level={4} className="text-center mb-6">扫描二维码</Title>

            <Row gutter={[24, 24]} className="items-start">
              <Col xs={24} md={12}>
                <div className="flex flex-col items-center justify-start pt-4">
                  <div className="mb-6">
                    <QRCode
                      value={generateQRContent()}
                      size={200}
                      className="border border-gray-200 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <Button
                    icon={<QrcodeOutlined />}
                    onClick={() => setQrModalVisible(true)}
                    size="middle"
                    className="shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                  >
                    查看大图
                  </Button>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div className="space-y-4">
                  {/* 密钥备份重要提示 */}
                  <Alert
                    message={
                      <div className="flex items-center">
                        <ExclamationCircleOutlined className="mr-2" style={{ color: '#faad14' }} />
                        <span className="font-semibold">重要提醒：请妥善备份密钥</span>
                      </div>
                    }
                    description={
                      <div className="space-y-2 mt-2">
                        <div className="flex items-start">
                          <span className="text-red-500 mr-2 font-bold">•</span>
                          <Text className="text-sm">
                            密钥是2FA的核心，一旦丢失将无法恢复2FA功能
                          </Text>
                        </div>
                        <div className="flex items-start">
                          <span className="text-red-500 mr-2 font-bold">•</span>
                          <Text className="text-sm">
                            密钥不可更改，请务必安全保存
                          </Text>
                        </div>
                        <div className="flex items-start">
                          <span className="text-blue-500 mr-2 font-bold">•</span>
                          <Text className="text-sm">
                            建议将密钥保存在密码管理器中或离线备份
                          </Text>
                        </div>
                      </div>
                    }
                    type="warning"
                    showIcon={false}
                    className="rounded-lg"
                    style={{
                      border: '1px solid #ffe7ba',
                      backgroundColor: '#fffbf0'
                    }}
                  />

                  <div>
                    <Text strong>手动输入密钥:</Text>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        value={twoFAStatus.data.secret}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        icon={<CopyOutlined />}
                        onClick={handleCopySecret}
                      />
                    </div>
                  </div>

                  <Form
                    form={verifyForm}
                    onFinish={handleVerify2FA}
                    layout="vertical"
                  >
                    <Form.Item
                      name="code"
                      label="验证码"
                      rules={[
                        { required: true, message: '请输入6位验证码' },
                        { len: 6, message: '验证码必须是6位数字' }
                      ]}
                    >
                      <Input
                        size="large"
                        placeholder="请输入6位验证码"
                        maxLength={6}
                        className="rounded-input text-center font-mono text-lg"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        size="large"
                        htmlType="submit"
                        loading={verifyLoading}
                        block
                        className="primary-button"
                      >
                        验证并完成设置
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* 已启用状态 */}
        {currentStep === 2 && (
          <div>
            <div className="text-center mb-6">
              <CheckCircleOutlined className="text-green-500 text-6xl mb-4" />
              <Title level={4} className="text-green-600">2FA已启用</Title>
              <Paragraph className="text-gray-600">
                您的账户现在受到双因素认证保护
              </Paragraph>
            </div>
            {/* <Button
              type="primary"
              danger
              block
              onClick={handleDisable2FA}
              loading={disableLoading}
            >
              禁用2FA
            </Button> */}
            {/* <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Button
                  type="default"
                  block
                  icon={<DownloadOutlined />}
                  onClick={() => setBackupModalVisible(true)}
                >
                  查看备份码
                </Button>
              </Col> 
              <Col xs={24} sm={12}>
               
              </Col>
            </Row> */}

            <Alert
              message="重要提醒"
              description="请妥善保管您的备份码，在无法使用认证器时可以用来恢复账户访问"
              type="info"
              showIcon
              className="mt-4 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* 二级密码验证模态框 */}
      <Modal
        title="验证二级密码"
        open={secondaryPasswordModalVisible}
        onCancel={() => setSecondaryPasswordModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={secondaryPasswordForm}
          onFinish={handleSecondaryPasswordVerify}
          layout="vertical"
        >
          <Form.Item
            name="secondaryPassword"
            label="请输入二级密码以启用2FA"
            rules={[{ required: true, message: '请输入二级密码' }]}
          >
            <Input.Password
              size="large"
              placeholder="请输入您的二级密码"
              className="rounded-input"
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setSecondaryPasswordModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={setupLoading}
              >
                确认启用
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 禁用2FA模态框 */}
      <Modal
        title="禁用2FA"
        open={disable2FAModalVisible}
        onCancel={() => setDisable2FAModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Alert
          message="安全提醒"
          description="禁用2FA将降低您的账户安全性。请确认您了解相关风险。"
          type="warning"
          showIcon
          className="mb-4"
        />
        <Form
          form={disable2FAForm}
          onFinish={handleDisable2FAConfirm}
          layout="vertical"
        >
          <Form.Item
            name="secondaryPassword"
            label="二级密码"
            rules={[
              { required: true, message: '请输入二级密码' },
              { min: 6, message: '二级密码至少6位' },
              { max: 32, message: '二级密码最多32位' }
            ]}
          >
            <Input.Password
              size="large"
              placeholder="请输入您的二级密码"
              className="rounded-input"
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="验证码"
            rules={[
              { required: true, message: '请输入验证码' },
              { min: 6, message: '验证码至少6位' },
              { max: 32, message: '验证码最多32位' }
            ]}
          >
            <Input
              size="large"
              placeholder="请输入6位验证码"
              maxLength={6}
              className="rounded-input text-center font-mono text-lg"
            />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setDisable2FAModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={disableLoading}
              >
                确认禁用
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* QR码大图模态框 */}
      <Modal
        title="2FA二维码"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        width={400}
      >
        <div className="text-center">
          <QRCode
            value={generateQRContent()}
            size={300}
          />
          <Paragraph className="mt-4">
            请使用您的认证器应用扫描此二维码
          </Paragraph>
        </div>
      </Modal>

      {/* 备份码模态框 */}
      <Modal
        title="备份码"
        open={backupModalVisible}
        onCancel={() => setBackupModalVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={handleDownloadBackupCodes}>
            下载备份码
          </Button>,
          <Button key="close" onClick={() => setBackupModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={500}
      >
        <Alert
          message="重要提醒"
          description="请妥善保管这些备份码。在无法使用2FA时，您可以使用这些备份码来恢复账户访问。"
          type="info"
          showIcon
          className="mb-4"
          style={{
            border: '1px solid #e6f4ff',
            backgroundColor: '#f0f9ff'
          }}
        />
        <div style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '2' }}>
          {twoFAStatus?.data?.backupCodes?.map((code, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              {code}
            </div>
          ))}
        </div>
      </Modal>
    </Spin>
  )

  // 根据showCard决定是否包装在Card中
  if (!showCard) {
    return renderContent()
  }

  return (
    <Card
      title={showHeader ? "双因素认证 (2FA)" : undefined}
      className="border-0 shadow-sm card-bg-white"
      headStyle={showHeader ? {
        borderBottom: '1px solid #f0f0f0',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#262626'
      } : undefined}
      {...cardProps}
    >
      {renderContent()}
    </Card>
  )
}

export default TwoFactorAuthComponent 