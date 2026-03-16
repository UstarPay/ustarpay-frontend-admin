// 卡记录类型（来自 ustarpay_card_records）
export interface CardRecord {
  id: string
  tenant_id: string
  user_id: string
  external_card_id: string
  reference_no: string
  product_code?: string
  card_material?: number
  currency: string
  status: number
  card_number_last4?: string
  expiry_date?: string
  balance: string
  pending_balance: string
  tracking_no?: string
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
  currency: string
  status: string
  merchant_name?: string
  merchant_category?: string
  merchant_country?: string
  authorization_code?: string
  merchant_id?: string
  merchant_name_from_card?: string
  settled_at?: string
  created_at: string
  updated_at: string
}

export interface UpdateCardMerchantRequest {
  merchant_name?: string
  api_key?: string
  api_secret?: string
  signature_key?: string
  api_host?: string
  sub_account_id?: string
  environment?: 'prod' | 'sandbox'
  status?: number
  webhook_secret?: string | null
  notes?: string | null
}
