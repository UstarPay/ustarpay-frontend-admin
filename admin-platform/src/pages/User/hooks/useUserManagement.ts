import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { adminApi } from '@/services/apis/adminApi'
import rbacApi from '@/services/apis/rbacApi'
import { User, UserList } from '@shared/types/user'
import { AdminRole } from '@shared/types/role'
import { Permission } from '@shared/types/permission'
import { AssignRoleRequest } from '@shared/types/role'

/**
 * 用户管理自定义Hook
 */
export const useUserManagement = () => {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuthStore()
  const { addNotification } = useAppStore()

  // 状态管理
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [transferTargetKeys, setTransferTargetKeys] = useState<string[]>([])
  const [userRoles, setUserRoles] = useState<AdminRole[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  })

  // 获取用户列表
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError
  } = useQuery({
    queryKey: ['users', pagination.page, pagination.pageSize],
    queryFn: async () => {
      try {
        const result = await adminApi.getUsers()
        // TODO: 添加分页参数支持
        return result
      } catch (error) {
        console.error('获取用户列表失败:', error)
        return {
          items: [],
          total: 0,
          page: pagination.page,
          pageSize: pagination.pageSize
        }
      }
    },
    enabled: hasPermission('user:list')
  })

  // 获取所有角色
  const {
    data: allRoles = [],
    isLoading: rolesLoading
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rbacApi.role.getRoles(false),
    enabled: hasPermission('user:assign-role')
  })

  // 获取用户角色
  const fetchUserRoles = async (userId: number) => {
    try {
      const roles = await rbacApi.userRole.getUserRoles(userId)
      setUserRoles(roles)
      setTransferTargetKeys(roles.map(role => role.id.toString()))
      return roles
    } catch (error) {
      console.error('获取用户角色失败:', error)
      setUserRoles([])
      setTransferTargetKeys([])
      return []
    }
  }

  // 获取角色权限
  const fetchRolePermissions = async (roleId: number): Promise<Permission[]> => {
    try {
      const role = await rbacApi.role.getRoleById(roleId)
      return role.permissions || []
    } catch (error) {
      console.error('获取角色权限失败:', error)
      return []
    }
  }

  // 分配角色
  const assignRolesMutation = useMutation({
    mutationFn: (data: AssignRoleRequest) => rbacApi.userRole.assignRolesToUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      if (selectedUser) {
        fetchUserRoles(selectedUser.id)
      }
      addNotification({
        type: 'success',
        title: '分配成功',
        message: '用户角色分配成功'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: '分配失败',
        message: error.response?.data?.message || '用户角色分配失败'
      })
    }
  })

  // 业务逻辑函数
  const selectUser = async (user: User) => {
    setSelectedUser(user)
    await fetchUserRoles(user.id)
  }

  const assignRoles = () => {
    if (!selectedUser) return

    assignRolesMutation.mutate({
      user_id: selectedUser.id,
      role_ids: transferTargetKeys.map(key => parseInt(key))
    })
  }

  const clearSelection = () => {
    setSelectedUser(null)
    setTransferTargetKeys([])
    setUserRoles([])
  }

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  return {
    // 数据
    users,
    allRoles,
    selectedUser,
    transferTargetKeys,
    userRoles,

    // 状态
    usersLoading,
    rolesLoading,
    usersError,
    isAssigningRoles: assignRolesMutation.isPending,

    // 操作函数
    selectUser,
    assignRoles,
    clearSelection,
    setTransferTargetKeys,
    handlePageChange,
    fetchRolePermissions,

    // 权限检查
    hasPermission
  }
}