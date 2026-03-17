import React from 'react'
import { Button, Typography, message } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import { truncateString, copyToClipboard } from '../utils'

const { Text } = Typography

interface AddressDisplayProps {
  address: string
  maxLength?: number
  showCopy?: boolean
  copyable?: boolean
  className?: string
}

/**
 * 地址显示组件
 * 支持截取显示和复制功能
 */
export const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  maxLength = 12,
  showCopy = true,
  copyable = true,
  className,
}) => {
  const handleCopy = async () => {
    if (!copyable) return
    
    const success = await copyToClipboard(address)
    if (success) {
      message.success('地址已复制到剪贴板')
    } else {
      message.error('复制失败，请手动复制')
    }
  }

  const displayText = maxLength > 0 ? truncateString(address, maxLength / 2, maxLength / 2) : address

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Text 
        code 
        className="font-mono text-sm"
        title={address}
      >
        {displayText}
      </Text>
      {showCopy && copyable && (
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          className="text-gray-500 hover:text-blue-500"
        />
      )}
    </div>
  )
}

export default AddressDisplay
