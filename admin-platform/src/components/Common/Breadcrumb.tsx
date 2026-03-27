import React from 'react'
import { Breadcrumb as AntBreadcrumb } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { HomeOutlined } from '@ant-design/icons'

interface BreadcrumbItem {
  path?: string
  title: string
  icon?: React.ReactNode
}

/**
 * 路由与面包屑的映射配置
 */
const routeConfig: Record<string, BreadcrumbItem> = {
  '/': { title: '首页', icon: <HomeOutlined /> },
  '/dashboard': { title: '仪表盘', icon: <HomeOutlined /> },
  
  // 租户管理
  '/tenants': { title: '租户列表' },
  '/tenants/create': { title: '创建租户' },
  '/tenants/card-merchants': { title: '卡商管理' },
  '/tenants/:id': { title: '租户详情' },
  '/tenants/:id/edit': { title: '编辑租户' },
  
  // 租户计划管理
  '/tenant-plans': { title: '计划管理' },
  '/tenant-plan-subscriptions': { title: '订阅管理' },
  
  // 用户管理
  '/users': { title: '用户列表' },
  '/users/create': { title: '创建用户' },
  '/users/:id': { title: '用户详情' },
  '/users/:id/edit': { title: '编辑用户' },
  
  // 角色管理
  '/roles': { title: '角色管理' },
  '/roles/create': { title: '创建角色' },
  '/roles/:id': { title: '角色详情' },
  '/roles/:id/edit': { title: '编辑角色' },
  
  // 权限管理
  '/permissions': { title: '权限管理' },
  
  // 区块链网络
  '/chains': { title: '区块链网络' },
  '/chains/create': { title: '添加网络' },
  '/chains/:id': { title: '网络详情' },
  '/chains/:id/edit': { title: '编辑网络' },
  
  // 数字货币
  '/currencies': { title: '数字货币' },
  '/currencies/create': { title: '添加货币' },
  '/currencies/:id': { title: '货币详情' },
  '/currencies/:id/edit': { title: '编辑货币' },
  '/kms/aws': { title: 'AWS KMS配置' },
  
  // 系统管理
  '/login-logs': { title: '登录日志' },
  '/system': { title: '系统设置' },
  '/security': { title: '安全设置' },
}

/**
 * 分组路由配置 - 用于添加父级面包屑
 */
const routeGroups: Record<string, BreadcrumbItem> = {
  'tenant-management': { title: '租户管理' },
  'card-merchant-management': { title: '卡商配置' },
  'tenant-plan-management': { title: '租户计划管理' },
  'rbac-management': { title: 'RBAC管理' },
  'blockchain-management': { title: '区块链管理' },
  'kms-config-management': { title: 'KMS配置管理' },
  'system-management': { title: '系统管理' },
}

/**
 * 匹配动态路由
 */
const matchRoute = (pathname: string): BreadcrumbItem | null => {
  // 优先匹配精确路径
  if (routeConfig[pathname]) {
    return routeConfig[pathname]
  }

  // 匹配动态路由
  for (const route in routeConfig) {
    if (route.includes(':')) {
      const regex = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$')
      if (regex.test(pathname)) {
        return routeConfig[route]
      }
    }
  }

  return null
}

/**
 * 根据路径获取分组
 */
const getRouteGroup = (pathname: string): BreadcrumbItem | null => {
  if (pathname.startsWith('/tenants/card-merchants')) {
    return routeGroups['card-merchant-management']
  }
  if (pathname.startsWith('/tenants')) {
    return routeGroups['tenant-management']
  }
  if (pathname.startsWith('/tenant-plan')) {
    return routeGroups['tenant-plan-management']
  }
  if (pathname.startsWith('/users') || pathname.startsWith('/roles') || pathname.startsWith('/permissions')) {
    return routeGroups['rbac-management']
  }
  if (pathname.startsWith('/chains') || pathname.startsWith('/currencies')) {
    return routeGroups['blockchain-management']
  }
  if (pathname.startsWith('/kms')) {
    return routeGroups['blockchain-management']
  }
  if (pathname.startsWith('/login-logs') || pathname.startsWith('/system') || pathname.startsWith('/security')) {
    return routeGroups['system-management']
  }
  return null
}

/**
 * 生成面包屑路径
 */
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []
  const skipTenantListCrumb = pathname.startsWith('/tenants/card-merchants')

  // 添加首页
  if (pathname !== '/dashboard') {
    breadcrumbs.push({
      path: '/dashboard',
      title: '首页',
      icon: <HomeOutlined />
    })
  }

  // 添加分组面包屑（如果存在）
  const routeGroup = getRouteGroup(pathname)
  if (routeGroup && pathSegments.length > 1) {
    breadcrumbs.push({
      title: routeGroup.title
    })
  }

  if (pathname.startsWith('/kms')) {
    breadcrumbs.push({ title: routeGroups['kms-config-management'].title })
  }

  // 生成路径面包屑
  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    if (skipTenantListCrumb && currentPath === '/tenants') {
      return
    }
    const matchedRoute = matchRoute(currentPath)
    
    if (matchedRoute) {
      // 如果是最后一个路径段，不添加链接
      const isLast = index === pathSegments.length - 1
      breadcrumbs.push({
        path: isLast ? undefined : currentPath,
        title: matchedRoute.title,
        icon: matchedRoute.icon
      })
    }
  })

  return breadcrumbs
}

/**
 * 面包屑导航组件
 */
const Breadcrumb: React.FC = () => {
  const location = useLocation()
  const breadcrumbs = generateBreadcrumbs(location.pathname)

  const items = breadcrumbs.map((item, index) => ({
    key: index,
    title: item.path ? (
      <Link to={item.path} className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
        {item.icon && <span className="mr-1">{item.icon}</span>}
        <span className="font-medium">{item.title}</span>
      </Link>
    ) : (
      <span className="text-gray-800 font-semibold">
        {item.icon && <span className="mr-1">{item.icon}</span>}
        {item.title}
      </span>
    )
  }))

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3 mb-4">
      <AntBreadcrumb 
        items={items}
        separator={<span className="text-gray-400 mx-1">&gt;</span>}
        className="text-sm"
      />
    </div>
  )
}

export default Breadcrumb 
