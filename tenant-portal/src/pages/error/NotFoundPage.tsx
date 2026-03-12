import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在。"
        extra={
          <div className="space-x-2">
            <Button type="primary" onClick={() => navigate('/dashboard')}>
              返回首页
            </Button>
            <Button onClick={() => navigate(-1)}>
              返回上页
            </Button>
          </div>
        }
      />
    </div>
  )
}
