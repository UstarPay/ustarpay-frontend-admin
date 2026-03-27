import { Typography } from 'antd'
import { Helmet } from 'react-helmet-async'

const { Title } = Typography

/**
 * 安全设置页面
 * TODO: 实现完整的安全设置功能
 */
const SecuritySettingsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>安全设置 - U卡服务管理系统</title>
      </Helmet>

      <div>
        <Title level={2}>安全设置</Title>
        <p>安全设置页面正在开发中...</p>
      </div>
    </>
  )
}

export default SecuritySettingsPage
