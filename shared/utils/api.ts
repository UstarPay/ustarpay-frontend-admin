import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosRequestHeaders
} from 'axios';
import type { ApiResponse, PaginatedResponse } from '../types';

interface ApiServiceOptions {
  baseUrl?: string;
  timeout?: number;
  getToken?: () => string | null;
  refreshToken?: () => string | null;
  clearAuth?: () => void;
  authPrefix?: string;
  tenantPrefix?: string;
  headers?: AxiosRequestHeaders;
  withCredentials?: boolean;
}

/**
 * ApiService: 通用 API 请求类
 */
export class ApiService {
  private client: AxiosInstance;
  private getToken: () => string | null;
  private refreshToken: () => string | null;
  private clearAuth: () => void;
  public authPrefix: string;
  public tenantPrefix: string;

  // 默认错误提示
  public static ERROR_MESSAGES: Record<number, string> = {
    400: '请求参数错误',
    401: '未授权，请重新登录',
    403: '权限不足',
    404: '请求的资源不存在',
    408: '请求超时',
    409: '资源冲突',
    422: '数据验证失败',
    429: '请求过于频繁',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时'
  };

  constructor(options: ApiServiceOptions = {}) {
    const {
      baseUrl = 'http://localhost:8000/',
      timeout = 30000,
      getToken = () => null, // 默认不返回 token，由上层传入
      refreshToken = () => null,
      clearAuth = () => {},
      authPrefix = '/auth/v1',
      tenantPrefix = '/tenant-admin/v1',
      headers = {
        'Content-Type': 'application/json'
      },
      withCredentials = false
    } = options;

    this.getToken = getToken;
    this.refreshToken = refreshToken;
    this.clearAuth = clearAuth;
    this.authPrefix = authPrefix;
    this.tenantPrefix = tenantPrefix;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers,
      withCredentials
    });

    this.setupInterceptors();
  }

  /** 初始化拦截器 */
  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (!config.url?.includes('/login') && token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      return config;
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => this.handleError(error)
    );
  }

  /** 错误处理 */
  private handleError(error: any) {
    const { response } = error;

    // 网络错误
    if (!response) {
      throw new Error('网络连接失败，请检查网络设置');
    }

    const status = response.status;
    const message = ApiService.ERROR_MESSAGES[status] || '未知错误';

    if (status === 401) {
      this.clearAuth();
      if (!window.location.pathname.includes('/login')) {
        // window.location.href = '/auth/login';
      }
      throw new Error('登录已过期，请重新登录');
    }

    if (status === 403) {
      throw new Error('权限不足，无法执行此操作');
    }

    if (status === 429) {
      const retryAfter = response.headers['retry-after'];
      throw new Error(
        retryAfter
          ? `请求过于频繁，请 ${retryAfter} 秒后重试`
          : '请求过于频繁，请稍后重试'
      );
    }

    if (status >= 500) {
      throw new Error(`服务器错误: ${message}`);
    }

    const responseData = response.data;
    throw new Error(responseData?.message || responseData?.error || message);
  }

  /** 统一 URL 拼接 */
  private buildUrl(url: string, prefix?: string): string {
    return `${prefix || this.tenantPrefix}${url}`;
  }

  /** GET 请求 */
  async get<T = any>(
    url: string,
    params?: any,
    config?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(
      this.buildUrl(url, config?.prefix),
      {
        ...config?.config,
        params
      }
    );
    return response.data;
  }

  /** POST 请求 */
  async post<T = any>(
    url: string,
    data?: any,
    config?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(
      this.buildUrl(url, config?.prefix),
      data,
      config?.config
    );
    return response.data;
  }

  /** PUT 请求 */
  async put<T = any>(
    url: string,
    data?: any,
    config?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(
      this.buildUrl(url, config?.prefix),
      data,
      config?.config
    );
    return response.data;
  }

  /** PATCH 请求 */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(
      this.buildUrl(url, config?.prefix),
      data,
      config?.config
    );
    return response.data;
  }

  /** DELETE 请求 */
  async delete<T = any>(
    url: string,
    config?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(
      this.buildUrl(url, config?.prefix),
      config?.config
    );
    return response.data;
  }

  /** 分页 GET */
  async getPaginated<T = any>(
    url: string,
    params?: {
      page?: number
      pageSize?: number
      search?: string
      sort?: string
      order?: 'asc' | 'desc'
      [key: string]: any
    },
    config?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<T>>> = await this.client.get( `${config?.prefix || this.tenantPrefix}${url}`, {
      ...config?.config,
      params: {
        ...params,
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
      },
    })
    return response.data
  }

  /** 文件上传 */
  async upload<T = any>(
    url: string,
    file: File,
    options?: {
      onProgress?: (progress: number) => void;
      metadata?: Record<string, any>;
    }
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (options?.onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          options.onProgress(progress);
        }
      }
    });

    return response.data;
  }

  /** 文件下载 */
  async download(
    url: string,
    filename?: string,
    config?: { config?: AxiosRequestConfig; prefix?: string }
  ): Promise<void> {
    const response = await this.client.get(
      this.buildUrl(url, config?.prefix),
      {
        ...config?.config,
        responseType: 'blob'
      }
    );

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /** 批量请求 */
  async batch<T = any>(
    requests: Array<{
      method: 'get' | 'post' | 'put' | 'patch' | 'delete';
      url: string;
      data?: any;
      config?: { config?: AxiosRequestConfig; prefix?: string };
    }>
  ): Promise<ApiResponse<T>[]> {
    const promises = requests.map(({ method, url, data, config }) => {
      switch (method) {
        case 'get':
          return this.get<T>(url, config);
        case 'post':
          return this.post<T>(url, data, config);
        case 'put':
          return this.put<T>(url, data, config);
        case 'patch':
          return this.patch<T>(url, data, config);
        case 'delete':
          return this.delete<T>(url, config);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    });

    return Promise.all(promises);
  }
}
 