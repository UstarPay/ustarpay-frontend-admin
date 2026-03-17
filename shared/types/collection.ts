import { ListParams, Status } from "./base";

//  
// 配置类型
export enum CollectionConfigType {
  FULL_CHAIN = "FULL_CHAIN",       // 全链配置
  PARTIAL_CHAIN = "PARTIAL_CHAIN", // 部分链配置
  FULL_SYMBOL = "FULL_SYMBOL",     // 全币种配置
  PARTIAL_SYMBOL = "PARTIAL_SYMBOL" // 部分币种配置
}

// 自动归集配置
export interface TenantCollectionConfig {
  id: string;                  // UUID
  tenantId: string;
  chainCodes: string[];
  symbols: string[];
  fromAddress: string;          // 源钱包地址  
  toAddress: string;            // 目标钱包地址
  triggerThreshold: string;     // 触发阈值 (decimal字符串)
  minCollectAmount: string;     // 最小归集金额
  minGasBalance: string;        // 最小Gas余额
  scheduleCron: string;         // 定时调度表达式
  lastExecution?: string;       // 上次执行时间 (ISO 8601)
  status: Status;
  createdBy: string;
  updatedBy: string;
  createdAt: string;           // ISO 8601 格式
  updatedAt: string;
  configCurrencyType: CollectionConfigType;
  configChainType: CollectionConfigType;
}

// 归集任务状态（与 tenant_collection_tasks.status 一致）
// -1:frozen(失效), 0:inactive(暂停), 1:active(待执行), 2:finished(已完成)
export enum CollectionTaskStatus {
  FROZEN = -1,
  INACTIVE = 0,
  ACTIVE = 1,
  FINISHED = 2,
}

// 归集任务
export interface TenantCollectionTask {
  id: string;                  // UUID
  configId: string;            // UUID  
  tenantId: string;            // UUID
  expectedFromAddressCount: number;
  fromAddressCount: number;
  toAddress: string;
  chainCodes: string[];
  symbols: string[];
  expectedAmount: Record<string, string>; // symbol -> amount (decimal字符串)
  amount: Record<string, string>;         // symbol -> amount (decimal字符串)
  blockFee: string;            // decimal字符串
  status: Status;
  failureReason?: string;
  scheduledAt: string;         // ISO 8601
  executedAt?: string;         // ISO 8601
  completedAt?: string;        // ISO 8601
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

// 归集子任务
export interface TenantCollectionSubtask {
  id: string;                  // UUID
  taskId: string;              // UUID
  configId: string;            // UUID
  tenantId: string;            // UUID
  fromAddress: string;
  toAddress: string;
  chainCode: string;
  symbol: string;
  amount: string;              // decimal字符串
  blockFee: string;            // decimal字符串
  transactionId?: number;
  txHash?: string;
  status: Status;
  failureReason?: string;
  retryCount: number;
  triggeredBy: string;         // "system" | "manual"
  scheduledAt?: string;        // ISO 8601
  executedAt?: string;         // ISO 8601  
  completedAt?: string;        // ISO 8601
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

// 创建配置请求
export interface CreateCollectionConfigRequest {
  chainCodes?: string[];
  symbols?: string[];
  toAddress: string;
  triggerThreshold: string;
  minCollectAmount: string;
  minGasBalance: string;
  scheduleCron?: string;
}

// 更新配置请求
export interface UpdateCollectionConfigRequest {
  chainCodes?: string[];
  symbols?: string[];
  fromAddress?: string;
  toAddress?: string;
  triggerThreshold?: string;
  minCollectAmount?: string;
  minGasBalance?: string;
  scheduleCron?: string;
  status?: Status;
}

// 配置查询参数
export interface CollectionConfigQueryParams extends ListParams {
  chainCode?: string;
  symbol?: string;
}

// 任务查询参数
export interface CollectionTaskQueryParams extends ListParams {
  configId?: string;
  startDate?: string;
  endDate?: string;
}

// 手动触发归集请求
export interface ManualCollectionRequest {
  configId: number;
  chainCodes?: string[];
  symbols?: string[];
  fromAddress?: string;
}

// 运行中/待执行任务响应（与 /tasks/running 接口一致，返回分页的 status=1 任务）
export interface RunningTasksResponse {
  data: {
    items: TenantCollectionTask[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 配置统计
export interface CollectionConfigStats {
  totalConfigs: number;
  activeConfigs: number;
  inactiveConfigs: number;
  frozenConfigs: number;
  configsByChain: Record<string, number>;
  configsBySymbol: Record<string, number>;
  totalCollections: number;
  totalAmount: string;
  todayCollections: number;
  todayAmount: string;
  pendingCollections: number;
  completedCollections: number;
}

// 任务统计（与后端 dto.CollectionTaskStats 一致）
export interface CollectionTaskStats {
  totalTasks: number;
  pendingTasks: number;    // 待执行
  executingTasks: number; // 执行中
  completedTasks: number;
  failedTasks: number;
  totalAmount?: Record<string, string>;
  totalFees?: string;
  averageExecutionTime?: number;
  successRate?: number;
  tasksByDate: Array<{
    date: string;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalAmount: Record<string, string>;
  }>;
}

// 调度器统计
export interface CollectionSchedulerStats {
  isRunning: boolean;
  scheduledConfigs: number;
  runningTasks: number;
  lastExecution: string;
  totalExecutions: number;
  failedExecutions: number;
  averageExecutionInterval: number;
  uptime: number;
  nextScheduledExecution: string;
}

// 归集历史记录
export interface CollectionHistoryRecord {
  date: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalAmount: string;
}

// API响应类型
export interface CollectionConfigResponse {
  data: TenantCollectionConfig;
}

export interface CollectionTaskListResponse {
  items: TenantCollectionTask[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CollectionConfigStatsResponse {
  data: CollectionConfigStats;
}

export interface CollectionTaskStatsResponse {
  data: CollectionTaskStats;
}

export interface CollectionSchedulerStatsResponse {
  data: CollectionSchedulerStats;
}


export interface ManualCollectionResponse {
  data: {
    taskId: string;
    message: string;
    estimatedCompletionTime: string;
  };
}
