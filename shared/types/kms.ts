import type { BaseEntity, PaginatedResponse } from './base'

export type KMSAuthMode = 'DEFAULT' | 'STATIC' | 'ASSUME_ROLE'

export interface SystemKMSConfig extends BaseEntity {
  configCode: string
  provider: string
  region: string
  kmsKeyId: string
  kmsKeyArn: string
  aliasName: string
  authMode: KMSAuthMode
  accessKeyId: string
  roleArn: string
  externalId: string
  roleSessionName: string
  serviceTargets: string[]
  requiredActions: string[]
  isActive: boolean
  description: string
  hasSecretAccessKey: boolean
  hasSessionToken: boolean
  secretAccessKeyMasked: string
  sessionTokenMasked: string
}

export interface SystemKMSConfigListParams {
  page?: number
  limit?: number
  configCode?: string
  provider?: string
  authMode?: KMSAuthMode
  search?: string
  isActive?: boolean
}

export interface SystemKMSConfigListResponse extends PaginatedResponse<SystemKMSConfig> {
  limit?: number
}

export interface UpsertSystemKMSConfigRequest {
  configCode: string
  provider: string
  region: string
  kmsKeyId: string
  kmsKeyArn?: string
  aliasName?: string
  authMode: KMSAuthMode
  accessKeyId?: string
  secretAccessKey?: string
  sessionToken?: string
  roleArn?: string
  externalId?: string
  roleSessionName?: string
  serviceTargets: string[]
  requiredActions: string[]
  isActive: boolean
  description?: string
}
