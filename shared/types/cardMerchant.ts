// 卡记录类型（来自 ustarpay_card_records）
export interface CardRecord {
  id: string
  tenant_id: string
  user_id: string
  external_card_id: string
  reference_no: string
  provider_client_id?: string
  product_code?: string
  card_material?: number
  provider_card_material?: number
  currency: string
  status: number
  status_name?: string
  status_desc?: string
  cardholder_name?: string
  preferred_printed_name?: string
  card_number_last4?: string
  expiry_date?: string
  email?: string
  mobile_number?: string
  pin_enabled?: boolean
  auto_debit_enabled?: boolean
  card_limit_enabled?: boolean
  transaction_limit?: string
  monthly_limit?: string
  balance: string
  pending_balance: string
  tracking_no?: string
  delivery_country?: string
  delivery_state?: string
  delivery_city?: string
  delivery_address1?: string
  delivery_postal?: string
  merchant_id?: string
  merchant_name?: string // 卡商名称
  created_at: string
  updated_at: string
  // 用户信息
  user_name?: string      // 用户名
  user_email?: string     // 用户邮箱
  user_phone?: string     // 用户手机号
  user_status?: number    // 用户状态
  country_code?: string   // 国家代码
}

// 开卡费用配置类型
export interface CardFeeConfig {
  deductSymbol?: string
  deductAccountId?: string // 资金支出账户
  defaultVirtualCardFee: string
  defaultPhysicalCardFee: string
  countryFees?: Record<string, CountryFeeConfig>
}

export interface CountryFeeConfig {
  countryCode: string
  countryName: string
  virtualCardFee: string
  physicalCardFee: string
  deliveryFee: string
  enabled: boolean
}

// 卡商相关类型

export interface CardMerchant {
  id: string
  tenant_id: string
  merchant_name: string
  api_key: string
  api_secret_masked: string
  signature_masked: string
  api_host: string
  sub_account_id: string
  default_product_code: string
  default_card_material: number
  default_currency: string
  environment: 'prod' | 'sandbox'
  status: number
  created_at: string
  updated_at: string
  last_token_refresh?: string | null
  notes?: string | null
}

export interface CreateCardMerchantRequest {
  merchant_name: string
  api_key: string
  api_secret: string
  signature_key: string
  api_host: string
  sub_account_id: string
  default_product_code?: string
  default_card_material?: number
  default_currency?: string
  environment?: 'prod' | 'sandbox'
  webhook_secret?: string
  notes?: string | null
}

// 卡交易记录类型（来自 ustarpay_card_transactions）
export interface CardTransaction {
  id: string
  tenant_id: string
  user_id: string
  card_record_id: string
  external_card_id: string
  external_transaction_id?: string
  reference_no?: string
  type: string
  amount: string
  authorization_amount?: string
  settlement_amount?: string
  diff_amount?: string
  currency: string
  status: string
  reconcile_status?: string
  provider_batch_id?: string
  provider_event?: string
  provider_transaction_type?: string
  provider_transaction_state?: string
  merchant_name?: string
  merchant_category?: string
  merchant_country?: string
  authorization_code?: string
  merchant_id?: string
  merchant_name_from_card?: string
  authorized_at?: string
  settled_at?: string
  created_at: string
  updated_at: string
}

export interface CardAccountFlow {
  id: string
  tenant_id: string
  user_id: string
  card_account_id: string
  card_record_id: string
  card_transaction_id?: string
  external_transaction_id?: string
  flow_type: string
  currency: string
  amount: string
  available_before: string
  available_after: string
  held_before: string
  held_after: string
  reference_type: string
  reference_id: string
  remark?: string
  created_at: string
}

export interface CardSettlementBatch {
  id: string
  tenant_id: string
  provider: string
  batch_id: string
  currency: string
  total_count: number
  total_amount: string
  matched_count: number
  diff_count: number
  status: string
  last_settled_at?: string
  created_at: string
  updated_at: string
}

export interface CardReconcileDiff {
  id: string
  tenant_id: string
  batch_id?: string
  card_transaction_id?: string
  external_transaction_id: string
  diff_type: string
  currency: string
  expected_amount: string
  actual_amount: string
  status: string
  resolution_note?: string
  created_at: string
  resolved_at?: string
}

export interface UpdateCardMerchantRequest {
  merchant_name?: string
  api_key?: string
  api_secret?: string
  signature_key?: string
  api_host?: string
  sub_account_id?: string
  default_product_code?: string
  default_card_material?: number
  default_currency?: string
  environment?: 'prod' | 'sandbox'
  status?: number
  webhook_secret?: string | null
  notes?: string | null
}
