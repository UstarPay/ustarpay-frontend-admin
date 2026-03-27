import { Typography } from 'antd'
import { Helmet } from 'react-helmet-async'

const { Title } = Typography

/**
 * 系统设置页面
 * TODO: 实现完整的系统设置功能
 */
const SystemSettingsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>系统设置 - U卡服务管理系统</title>
      </Helmet>

      <div>
        <Title level={2}>系统设置</Title>
        <p>系统设置页面正在开发中...</p>
      </div>
    </>
  )
}

export default SystemSettingsPage
