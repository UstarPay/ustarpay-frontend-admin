// 主入口文件 - 导出所有共享模块

// 导出类型定义
export * from './types'

// 导出常量
export * from './constants'

// 导出React Hooks
export * from './hooks'

// 导出React组件
export * from './components'

// 导出工具函数
// export * from './utils'

// 版本信息
export const SHARED_MODULE_VERSION = '1.0.0'

// 共享模块信息
export const SHARED_MODULE_INFO = {
  name: 'Digital Asset Wallet Shared Module',
  version: SHARED_MODULE_VERSION,
  description: 'Reusable components, hooks, types, and utilities for digital asset wallet custody system',
  author: 'NH Team',
  license: 'MIT',
  dependencies: {
    react: '^18.0.0',
    'antd': '^5.0.0',
    'axios': '^1.0.0',
    'dayjs': '^1.11.0',
  },
  features: [
    'TypeScript support',
    'React Hooks for common functionality',
    'Ant Design integration',
    'Cryptocurrency utilities',
    'API client with authentication',
    'Form validation',
    'Data formatting',
    'Error handling',
    'Permission management',
    'WebSocket support',
  ],
} as const
