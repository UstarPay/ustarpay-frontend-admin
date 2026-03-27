import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

/**
 * 404 错误页面
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <>
      <Helmet>
        <title>页面未找到 - U卡服务管理系统</title>
      </Helmet>

      <div className="flex items-center justify-center min-h-[60vh]">
        <Result
          status="404"
          title="404"
          subTitle="抱歉，您访问的页面不存在。"
          extra={
            <Button type="primary" onClick={() => navigate('/dashboard')}>
              返回首页
            </Button>
          }
        />
      </div>
    </>
  )
}

export default NotFoundPage
