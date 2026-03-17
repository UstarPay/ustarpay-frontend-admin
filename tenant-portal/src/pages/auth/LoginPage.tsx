import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Checkbox,
  Alert,
  Card,
  Typography,
  Row,
  Col,
  Space,
  message
} from 'antd'
import { App } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  WalletOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  MonitorOutlined,
  CloudServerOutlined
} from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services'
import { useAuthStore } from '@/stores/authStore'
import type { LoginForm } from '@shared/types'
import './LoginPage.css'

const { Title, Text, Paragraph } = Typography

interface LocationState {
  from?: {
    pathname: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()
  
  const [rememberMe, setRememberMe] = useState(false)
  const { setLoading } = useAuthStore()
  const { message } = App.useApp();

  // 获取重定向路径
  const from = (location.state as LocationState)?.from?.pathname || '/dashboard'

  // 登录状态管理
  const loginMutation = useMutation({
    mutationFn: (values: LoginForm) => authService.login(values),
    onMutate: () => {
      setLoading(true)
    },
    onSuccess: (response) => {
      if (response.success) {
        // 存储 accessToken 和 refreshToken
        if (response.data?.token) {
          localStorage.setItem('accessToken', response.data.token)
        }
        if (response.data?.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken)
        }
        message.success({ content: '登录成功！' });
        navigate(from, { replace: true })
      } else {
        message.error({ content: response.message || '登录失败' });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || '登录失败，请重试'
      message.error({ content: errorMessage });
    },
    onSettled: () => {
      setLoading(false)
    },
  })

  // 处理表单提交
  const handleSubmit = async (values: LoginForm) => {
    try {
      await loginMutation.mutateAsync({
        ...values,
        remember: rememberMe,
      })
    } catch (error) {
      // 错误已在 onError 中处理
    }
  }

  // 演示登录
  const handleDemoLogin = () => {
    form.setFieldsValue({
      email: 'tenant@example.com',
      password: 'tenant123',
    })
    setRememberMe(true)
  }

  // 功能特色数据
  const features = [
    {
      icon: <WalletOutlined className="feature-icon" />,
      title: '钱包管理',
      description: '多币种数字资产管理'
    },
    {
      icon: <DatabaseOutlined className="feature-icon" />,
      title: '交易记录',
      description: '完整的交易历史查询'
    },
    {
      icon: <SafetyCertificateOutlined className="feature-icon" />,
      title: '安全防护',
      description: '多重签名安全保障'
    },
    {
      icon: <TeamOutlined className="feature-icon" />,
      title: '团队协作',
      description: '多用户权限管理'
    },
    {
      icon: <MonitorOutlined className="feature-icon" />,
      title: '实时监控',
      description: '资产状态实时跟踪'
    },
    {
      icon: <CloudServerOutlined className="feature-icon" />,
      title: '云端服务',
      description: '高可用云端部署'
    }
  ]

  return (
    <div className="login-container">
      <Row className="login-content" align="middle">
        {/* 左侧信息展示区域 */}
        <Col xs={24} md={14} lg={16} className="login-info-section">
          <div className="login-info-content">
            {/* 品牌区域 */}
            <div className="brand-section">
              <div className="brand-icon">
                <WalletOutlined style={{ fontSize: '36px', color: 'white' }} />
              </div>
              
              <Title level={1} className="brand-title">
                NH Wallet
              </Title>
              
              <Title level={3} className="brand-subtitle">
                租户管理门户
              </Title>
              
              <Paragraph className="brand-description">
                专为租户设计的数字资产管理平台，提供安全便捷的钱包服务和交易管理
              </Paragraph>
            </div>

            {/* 功能特色卡片 */}
            <div className="feature-cards">
              <Row gutter={[20, 20]}>
                {features.map((feature, index) => (
                  <Col xs={12} sm={8} md={12} lg={8} key={index}>
                    <Card className="feature-card" variant="borderless">
                      {feature.icon}
                      <div className="feature-title">{feature.title}</div>
                      <div className="feature-description">{feature.description}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {/* 底部状态指示 */}
            <div className="status-indicators">
              <div className="status-item">
                <div className="status-dot"></div>
                <div className="status-text">系统在线</div>
              </div>
              <div className="status-item">
                <div className="status-dot"></div>
                <div className="status-text">服务正常</div>
              </div>
              <div className="status-item">
                <div className="status-dot"></div>
                <div className="status-text">安全保护</div>
              </div>
            </div>
          </div>
        </Col>

        {/* 右侧登录表单区域 */}
        <Col xs={24} md={10} lg={8} className="login-form-section">
          <Card className="login-form-card" variant="borderless">
            <div className="login-header">
              <Title level={2} className="login-title">
                租户登录
              </Title>
              <Text className="login-subtitle">
                请使用租户凭据访问管理门户
              </Text>
            </div>

            <Form
              form={form}
              name="login"
              size="large"
              onFinish={handleSubmit}
              autoComplete="off"
              layout="vertical"
              className="login-form"
            >
              <Form.Item
                name="email"
                label="邮箱地址"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入邮箱地址"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位字符' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  iconRender={(visible) => 
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <div className="login-options">
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                >
                  记住密码
                </Checkbox>
                <Link to="/auth/forgot-password" className="forgot-link">
                  忘记密码？
                </Link>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="login-button"
                  loading={loginMutation.isPending}
                >
                  {loginMutation.isPending ? '登录中...' : '登录'}
                </Button>
              </Form.Item>
            </Form>

            <div className="login-help">
              <Text>
                遇到问题？请联系您的系统管理员获取帮助
              </Text>
            </div>

            {/* 开发环境快速登录 */}
            {import.meta.env.DEV && (
              <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
                <Alert
                  message="演示环境"
                  description={
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text>您可以使用以下账户体验演示：</Text>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '12px',
                        borderRadius: '6px',
                        fontFamily: 'monospace'
                      }}>
                        <div><strong>邮箱:</strong> tenant@example.com</div>
                        <div><strong>密码:</strong> tenant123</div>
                      </div>
                      <Button
                        type="primary"
                        
                        onClick={handleDemoLogin}
                        style={{
                          background: '#1e3c72',
                          borderColor: '#1e3c72'
                        }}
                      >
                        填充演示账号
                      </Button>
                    </Space>
                  }
                  type="warning"
                  showIcon
                />
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* 版权信息 */}
      <div className="copyright">
        © 2024 NH Digital Asset Wallet. All rights reserved.<br />
        企业级数字资产租户门户系统
      </div>
    </div>
  )
}
