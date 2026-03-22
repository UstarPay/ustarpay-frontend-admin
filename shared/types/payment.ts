export interface BinancePayOverview {
  provider_count: number
  active_provider_count: number
  pending_order_count: number
  credited_order_count: number
  closed_order_count: number
  success_webhook_count: number
  failed_webhook_count: number
  total_credited_amount: string
}

export interface BinancePayProvider {
  id: string
  tenant_id: string
  provider_code: string
  provider_name: string
  merchant_id: string
  certificate_sn: string
  api_secret_masked?: string | null
  api_host: string
  environment: 'prod' | 'sandbox'
  webhook_endpoint?: string | null
  return_url?: string | null
  cancel_url?: string | null
  allowed_currencies: string[]
  status: number
  remarks?: string | null
  created_at: string
  updated_at: string
}

export interface BinancePayOrderRecord {
  id: string
  tenant_id: string
  user_id: string
  business_id: string
  merchant_trade_no: string
  prepay_id?: string | null
  transaction_id?: string | null
  product_name: string
  order_currency?: string | null
  order_amount: string
  pay_currency?: string | null
  pay_amount: string
  order_status: string
  binance_status?: string | null
  expire_time?: string | null
  webhook_confirmed_at?: string | null
  credited_at?: string | null
  last_error?: string | null
  created_at: string
  updated_at: string
}

export interface BinancePayWebhookEvent {
  id: string
  tenant_id: string
  provider_code: string
  cert_sn?: string | null
  biz_type?: string | null
  biz_id_str?: string | null
  biz_status?: string | null
  merchant_trade_no?: string | null
  prepay_id?: string | null
  transaction_id?: string | null
  verify_status: string
  process_status: string
  process_error?: string | null
  raw_body: string
  received_at: string
  processed_at?: string | null
  created_at: string
}

export interface BinancePayProviderQueryParams {
  page?: number
  pageSize?: number
  search?: string
  environment?: string
  status?: number
}

export interface BinancePayOrderQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}

export interface BinancePayWebhookQueryParams {
  page?: number
  pageSize?: number
  search?: string
  verify_status?: string
  process_status?: string
}

export interface CreateBinancePayProviderRequest {
  provider_name: string
  merchant_id: string
  certificate_sn: string
  api_secret: string
  api_host: string
  environment?: 'prod' | 'sandbox'
  webhook_endpoint?: string | null
  return_url?: string | null
  cancel_url?: string | null
  allowed_currencies: string[]
  status?: number
  remarks?: string | null
}

export interface UpdateBinancePayProviderRequest {
  provider_name?: string
  merchant_id?: string
  certificate_sn?: string
  api_secret?: string
  api_host?: string
  environment?: 'prod' | 'sandbox'
  webhook_endpoint?: string | null
  return_url?: string | null
  cancel_url?: string | null
  allowed_currencies?: string[]
  status?: number
  remarks?: string | null
}
