import { apiClient } from '@/services/apiClient'

export interface EmailDeliveryConfigView {
  enabled: boolean
  provider: string
  apiKey: string
  apiKeyConfigured: boolean
  fromName: string
  fromEmail: string
  replyTo: string
  webhookSecret: string
  webhookSecretConfigured: boolean
  sendTimeoutSeconds: number
  universalCodeEnabled: boolean
  universalCode: string
  universalCodeConfigured: boolean
  universalCodeScopes: string[]
  universalCodeAllowedEnvs: string[]
  universalCodeAllowedEmails: string[]
  universalCodeAllowedIPs: string[]
}

export interface UpdateEmailDeliveryConfigPayload {
  enabled: boolean
  provider: string
  apiKey?: string
  fromName: string
  fromEmail: string
  replyTo: string
  webhookSecret?: string
  sendTimeoutSeconds: number
  universalCodeEnabled: boolean
  universalCode?: string
  universalCodeScopes: string[]
  universalCodeAllowedEnvs: string[]
  universalCodeAllowedEmails: string[]
  universalCodeAllowedIPs: string[]
}

export interface EmailTemplateView {
  id: string
  scene: string
  locale: string
  name: string
  subjectTemplate: string
  htmlTemplate: string
  textTemplate: string
  enabled: boolean
  version: number
  remark: string
  createdAt: string
  updatedAt: string
}

export interface EmailTemplatePayload {
  scene: string
  locale: string
  name: string
  subjectTemplate: string
  htmlTemplate: string
  textTemplate?: string
  enabled: boolean
  remark?: string
}

export const emailDeliveryApi = {
  async getConfig(): Promise<EmailDeliveryConfigView> {
    const response = await apiClient.get<EmailDeliveryConfigView>('/system/email-delivery/config')
    return response.data
  },

  async updateConfig(payload: UpdateEmailDeliveryConfigPayload): Promise<EmailDeliveryConfigView> {
    const response = await apiClient.put<EmailDeliveryConfigView>('/system/email-delivery/config', payload)
    return response.data
  },

  async listTemplates(filters?: { scene?: string; locale?: string }): Promise<EmailTemplateView[]> {
    const response = await apiClient.get<EmailTemplateView[]>('/system/email-delivery/templates', {
      params: filters,
    })
    return response.data
  },

  async createTemplate(payload: EmailTemplatePayload): Promise<EmailTemplateView> {
    const response = await apiClient.post<EmailTemplateView>('/system/email-delivery/templates', payload)
    return response.data
  },

  async updateTemplate(id: string, payload: EmailTemplatePayload): Promise<EmailTemplateView> {
    const response = await apiClient.put<EmailTemplateView>(`/system/email-delivery/templates/${id}`, payload)
    return response.data
  },
}
