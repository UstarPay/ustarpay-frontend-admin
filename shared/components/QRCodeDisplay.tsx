import React, { useMemo } from 'react'
import { Button, Card, Space, message } from 'antd'
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import { useClipboard } from '../hooks'

// 注意：这里需要安装 qrcode 库
// npm install qrcode @types/qrcode

export interface QRCodeDisplayProps {
  value: string
  size?: number
  title?: string
  description?: string
  showCopy?: boolean
  showDownload?: boolean
  className?: string
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  title,
  description,
  showCopy = true,
  showDownload = true,
  className = '',
}) => {
  const { copy } = useClipboard()

  // 生成二维码数据URL
  const qrCodeDataUrl = useMemo(() => {
    // 这里使用简单的在线二维码生成服务
    // 在实际项目中，建议使用本地的 qrcode 库
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`
  }, [value, size])

  const handleCopy = async () => {
    const success = await copy(value)
    if (success) {
      message.success('已复制到剪贴板')
    } else {
      message.error('复制失败')
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = qrCodeDataUrl
    link.download = `qrcode-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('二维码已保存')
  }

  return (
    <Card className={`text-center ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      )}

      <div className="mb-4">
        <img
          src={qrCodeDataUrl}
          alt="QR Code"
          className="mx-auto border border-gray-200 rounded-lg"
          style={{ width: size, height: size }}
        />
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <code className="text-sm text-gray-700 break-all">{value}</code>
      </div>

      {(showCopy || showDownload) && (
        <Space>
          {showCopy && (
            <Button 
              icon={<CopyOutlined />} 
              onClick={handleCopy}
            >
              复制地址
            </Button>
          )}
          {showDownload && (
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownload}
            >
              保存二维码
            </Button>
          )}
        </Space>
      )}
    </Card>
  )
}

// 简单版本的二维码组件，只显示图片
export interface SimpleQRCodeProps {
  value: string
  size?: number
  className?: string
}

export const SimpleQRCode: React.FC<SimpleQRCodeProps> = ({
  value,
  size = 150,
  className = '',
}) => {
  const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`

  return (
    <img
      src={qrCodeDataUrl}
      alt="QR Code"
      className={`border border-gray-200 rounded ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
