import React from 'react'
import { Card, Row, Col, Button, Space } from 'antd'
import {
  WalletOutlined,
  SwapOutlined,
  DownloadOutlined,
  UploadOutlined,
  SettingOutlined,
  BellOutlined,
  FileTextOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate()

  const actions = [
    {
      title: '数字钱包列表',
      icon: <WalletOutlined style={{ fontSize: 24 }} />,
      color: '#1890ff',
      path: '/wallets/list'
    },
    {
      title: '充值',
      icon: <DownloadOutlined style={{ fontSize: 24 }} />,
      color: '#52c41a',
      path: '/history/deposits'
    },
    {
      title: '提现',
      icon: <UploadOutlined style={{ fontSize: 24 }} />,
      color: '#faad14',
      path: '/history/withdrawals'
    },
    {
      title: '归集',
      icon: <SwapOutlined style={{ fontSize: 24 }} />,
      color: '#722ed1',
      path: '/collection/configs'
    },
    {
      title: '余额监控',
      icon: <BellOutlined style={{ fontSize: 24 }} />,
      color: '#eb2f96',
      path: '/wallets/monitor'
    },
    {
      title: '交易记录',
      icon: <FileTextOutlined style={{ fontSize: 24 }} />,
      color: '#13c2c2',
      path: '/transactions/list'
    },
    {
      title: '系统配置',
      icon: <SettingOutlined style={{ fontSize: 24 }} />,
      color: '#8c8c8c',
      path: '/settings/profile'
    },
    {
      title: '数据统计',
      icon: <DashboardOutlined style={{ fontSize: 24 }} />,
      color: '#fa8c16',
      path: '/dashboard'
    }
  ]

  return (
    <Card title="快速操作">
      <Row gutter={[16, 16]}>
        {actions.map((action, index) => (
          <Col xs={12} sm={8} md={6} key={index}>
            <Button
              type="default"
              block
              style={{
                height: 80,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.3s ease'
              }}
              className="quick-action-btn"
              onClick={() => navigate(action.path)}
            >
              <div style={{ color: action.color, transition: 'transform 0.2s ease' }}>
                {action.icon}
              </div>
              <span style={{ fontSize: 12 }}>{action.title}</span>
            </Button>
          </Col>
        ))}
      </Row>
      <style>{`
        .quick-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .quick-action-btn:hover > div {
          transform: scale(1.1);
        }
        .quick-action-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </Card>
  )
}

export default QuickActionsCard
