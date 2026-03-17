// 登录日志类型 - 对应Go的AdminLoginLog
export interface AdminLoginLog {
  id: number
  user_id?: number          // 可能为空（登录失败）
  username: string
  login_ip: string
  user_agent: string
  login_method: string      // password, 2fa, sso
  login_status: string      // success, failed, locked
  failure_reason?: string
  session_id?: string
  created_at: string
  user?: {
    id: number
    username: string
    full_name: string
    email: string
  }
}

// 登录日志查询参数
export interface LoginLogQueryParams {
  user_id?: number
  username?: string
  login_status?: string
  login_method?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
} 