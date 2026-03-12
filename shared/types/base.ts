
// 基础类型
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  deletedBy?: string
  createdBy?: string
  updatedBy?: string
}

// 移除User定义，现在在user.ts中定义

export enum Status {
  ACTIVE = 1,
  INACTIVE = 0,
  DELETED = -1,
}

export enum UserType {
  PLATFORM_ADMIN = 'platform',
  TENANT_ADMIN = 'tenant',
}


export interface ListParams {
  page: number;
  pageSize: number;
  total?: number;
  search?: string;
  status?: Status;
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}