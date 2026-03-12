import React from 'react'
import { Spin, SpinProps } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

export interface LoadingSpinnerProps extends SpinProps {
  fullscreen?: boolean
  text?: string
  overlay?: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullscreen = false,
  text = '加载中...',
  overlay = false,
  size = 'default',
  ...props
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />

  const spinnerContent = (
    <Spin
      indicator={antIcon}
      size={size}
      tip={text}
      {...props}
    />
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
        {spinnerContent}
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-80">
        {spinnerContent}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinnerContent}
    </div>
  )
}
