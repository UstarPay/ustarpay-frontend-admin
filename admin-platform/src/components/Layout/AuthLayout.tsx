import { ReactNode } from 'react'
import { Layout, Card, Row, Col } from 'antd'
import { Helmet } from 'react-helmet-async'
import { 
  WalletOutlined, 
  SecurityScanOutlined, 
  BankOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  CloudServerOutlined
} from '@ant-design/icons'

const { Content } = Layout

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * 认证页面布局组件
 * 用于登录、注册等认证相关页面
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const features = [
    { icon: <WalletOutlined />, title: '多币种钱包', desc: '支持主流数字资产' },
    { icon: <SecurityScanOutlined />, title: '企业级安全', desc: '银行级安全防护' },
    { icon: <BankOutlined />, title: '资产托管', desc: '专业资产托管服务' },
    { icon: <GlobalOutlined />, title: '全球服务', desc: '7×24小时全球支持' },
    { icon: <SafetyCertificateOutlined />, title: '合规运营', desc: '符合监管要求' },
    { icon: <CloudServerOutlined />, title: '云端部署', desc: '高可用架构设计' },
  ]

  return (
    <>
      <Helmet>
        <title>管理员登录 - U卡服务管理系统</title>
      </Helmet>
      
      <Layout className="min-h-screen overflow-hidden relative">
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
        
        {/* 动态背景图案 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-32 w-24 h-24 bg-purple-400 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-32 left-32 w-40 h-40 bg-cyan-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-indigo-400 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '3s' }} />
        </div>
        
        {/* 网格背景 */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <Content className="relative z-10">
          <Row className="min-h-screen">
            {/* 左侧品牌展示区域 */}
            <Col xs={0} lg={14} xl={16} className="flex items-center justify-center p-8">
              <div className="max-w-2xl text-white">
                {/* 品牌标题 */}
                <div className="mb-16 text-center">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl">
                      <WalletOutlined className="text-3xl text-white" />
                    </div>
                  </div>
                  <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    U卡服务
                  </h1>
                  <h2 className="text-2xl font-light mb-6 text-blue-100">
                    U卡服务管理系统
                  </h2>
                  <p className="text-lg text-blue-200 leading-relaxed">
                    企业级数字资产管理平台，为您提供安全、可靠、专业的数字资产托管服务
                  </p>
                </div>
                
                {/* 特性展示 */}
                <div className="grid grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <div 
                      key={index} 
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                    >
                      <div className="text-blue-400 text-2xl mb-3">{feature.icon}</div>
                      <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                      <p className="text-blue-200 text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>
                
                {/* 底部装饰 */}
                <div className="mt-16 text-center">
                  <div className="flex items-center justify-center space-x-8 text-blue-300">
                    <div className="flex items-center space-x-2">
                      <SafetyCertificateOutlined className="text-lg" />
                      <span className="text-sm">银行级安全</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <GlobalOutlined className="text-lg" />
                      <span className="text-sm">全球部署</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CloudServerOutlined className="text-lg" />
                      <span className="text-sm">高可用性</span>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            
            {/* 右侧登录表单区域 */}
            <Col xs={24} lg={10} xl={8} className="flex items-center justify-center p-8">
              <div className="w-full max-w-md">
                {/* 移动端品牌标题 */}
                <div className="text-center mb-8 lg:hidden">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                      <WalletOutlined className="text-2xl text-white" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    U卡服务
                  </h1>
                  <p className="text-blue-200">
                    U卡服务管理系统
                  </p>
                </div>
                
                {/* 登录卡片 */}
                <Card 
                  className="shadow-2xl border-0 backdrop-blur-sm bg-white/95"
                  styles={{ 
                    body: { 
                      padding: '40px 32px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)'
                    } 
                  }}
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      管理员登录
                    </h3>
                    <p className="text-gray-500">
                      请使用管理员账户登录系统
                    </p>
                  </div>
                  
                  {children}
                </Card>
                
                {/* 版权信息 */}
                <div className="text-center mt-8">
                  <p className="text-blue-200 text-sm">
                    © 2024 NH Digital Asset Wallet. All rights reserved.
                  </p>
                  <p className="text-blue-300 text-xs mt-1">
                    企业级数字资产托管解决方案
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </Content>
      </Layout>
    </>
  )
}

export default AuthLayout
