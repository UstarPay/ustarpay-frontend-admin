import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Checkbox, Alert, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import type { LoginForm, LoginResponse } from '@shared/types'
import { adminApi } from '@/services/apis/adminApi'

/**
 * 登录页面
 */
const LoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginForm>()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const { addNotification } = useAppStore()
  const [error, setError] = useState<string>('')

  useEffect(() => {
    form.setFieldsValue({
      userType: 'platform' // 管理平台固定为platform类型
    })
  }, [])

  // 登录API调用
  const loginMutation = useMutation({ 
    mutationFn: async (data: LoginForm): Promise<LoginResponse> => { 
      const response = await adminApi.login(data)
      return response
    },
    onSuccess: (data) => {       
      // 转换权限格式：字符串数组 -> Permission对象数组
      const formattedPermissions = (data.permissions as unknown as string[]).map((perm: string) => ({
        id: perm, // 使用permission code作为临时id
        code: perm,
        name: perm,
        moduleId: perm.split(':')[0] || '', // 从permission code提取模块id
        module: {
          id: perm.split(':')[0] || '',
          code: perm.split(':')[0] || '',
          name: perm.split(':')[0] || '',
          level: 1,
          sortOrder: 1
        }
      }))
      console.log('🔄 转换后权限格式:', formattedPermissions)
      
      // 保存登录状态
      login(data.token, data.user, formattedPermissions as any[])
      
      // 显示成功消息 
      addNotification({
        type: 'success',
        title: '登录成功',
        message: `欢迎回来，${data.user.fullName || data.user.userName}！`,
      })

      // 重定向到目标页面或默认页面
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    },
    onError: (error: any) => {
      console.error('❌ 登录失败:', error)
      setError(error.response?.data?.message || '登录失败，请检查用户名和密码')
    },
  })

  const handleSubmit = (values: LoginForm) => {
    setError('')
    loginMutation.mutate(values)
  }

  const syncAutofilledValues = (event: React.FormEvent<HTMLFormElement>) => {
    const formElement = event.currentTarget
    if (!formElement) {
      return
    }

    const usernameInput = formElement.querySelector<HTMLInputElement>('input[name="username"]')
    const passwordInput = formElement.querySelector<HTMLInputElement>('input[name="password"]')
    const rememberInput = formElement.querySelector<HTMLInputElement>('input[name="remember"]')

    form.setFieldsValue({
      username: usernameInput?.value?.trim() || form.getFieldValue('username'),
      password: passwordInput?.value || form.getFieldValue('password'),
      remember: rememberInput?.checked ?? form.getFieldValue('remember'),
      userType: 'platform',
    })
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          登录到管理平台
        </h2>
        <p className="text-gray-600">
          请输入您的凭据以访问管理后台
        </p>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          className="mb-6"
          closable
          onClose={() => setError('')}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onSubmitCapture={syncAutofilledValues}
        autoComplete="on"
        size="large"
        initialValues={{ userType: 'platform' }}
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="请输入用户名"
            name="username"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入密码"
            name="password"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item name="remember" valuePropName="checked" className="mb-2">
          <Checkbox>记住我</Checkbox>
        </Form.Item>

        {/* 隐藏的用户类型字段 - 管理平台固定为platform */}
        <Form.Item name="userType" style={{ display: 'none' }}>
          <Input type="hidden" />
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={loginMutation.isPending}
            className="w-full h-12 text-base font-medium"
          >
            {loginMutation.isPending ? '登录中...' : '登录'}
          </Button>
        </Form.Item>
      </Form>

      <div className="mt-6 text-center">
        <Space direction="vertical" size="small">
          <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
            忘记密码？
          </a>
          <div className="text-xs text-gray-500">
            如需帮助，请联系系统管理员
          </div>
        </Space>
      </div>

      {/* 开发环境快速登录 */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800 mb-2">
            <strong>开发环境快速登录:</strong>
          </div>
          <div className="space-y-1 text-xs text-yellow-700">
            <div>管理员: admin / admin123</div>
            <div>普通用户: system / admin123</div>
            <div>审计员: auditor / admin123</div>
          </div>
          <div className="mt-2">
            <Button
              size="small"
              htmlType="button"
              onClick={() => {
                form.setFieldsValue({
                  username: 'admin',
                  password: 'admin123',
                  remember: true,
                })
              }}
            >
              填充管理员账号
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage
