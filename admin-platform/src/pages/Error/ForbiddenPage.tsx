import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

/**
 * 403 权限错误页面
 */
const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <>
      <Helmet>
        <title>访问被拒绝 - U卡服务管理系统</title>
      </Helmet>

      <div className="flex items-center justify-center min-h-[60vh]">
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面。"
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

export default ForbiddenPage
