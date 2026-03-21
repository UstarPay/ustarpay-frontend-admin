import { api } from './api'

export type AssetSupportScene = 'deposit' | 'withdrawal'

export interface AssetSupportItem {
  chainCode: string
  symbol: string
  enabled?: boolean
  sort?: number
}

export interface AssetSupportConfigPayload {
  items: AssetSupportItem[]
}

export interface TenantConfigRecord {
  id: string
  tenantId: string
  configKey: string
  configValue: string
  name?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

function normalizeItems(raw: string | undefined | null): AssetSupportItem[] {
  if (!raw?.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : Array.isArray(parsed?.currencies)
          ? parsed.currencies
          : []

    return list
      .map((item: any) => ({
        chainCode: String(item?.chainCode ?? item?.chain_code ?? '').trim().toUpperCase(),
        symbol: String(item?.symbol ?? '').trim().toUpperCase(),
        enabled: item?.enabled === undefined ? true : Boolean(item.enabled),
        sort: Number(item?.sort ?? 0) || 0,
      }))
      .filter((item: AssetSupportItem) => item.chainCode && item.symbol)
  } catch {
    return []
  }
}

function serializeItems(items: AssetSupportItem[]): string {
  return JSON.stringify({
    items: items.map((item, index) => ({
      chainCode: item.chainCode.trim().toUpperCase(),
      symbol: item.symbol.trim().toUpperCase(),
      enabled: item.enabled ?? true,
      sort: item.sort ?? index + 1,
    })),
  })
}

export const assetSupportConfigService = {
  getSceneConfig: async (scene: AssetSupportScene): Promise<TenantConfigRecord | null> => {
    const response = await api.get<TenantConfigRecord | null>(`/config/key/${scene}`)
    return response.data ?? null
  },

  getSceneItems: async (scene: AssetSupportScene): Promise<AssetSupportItem[]> => {
    const config = await assetSupportConfigService.getSceneConfig(scene)
    return normalizeItems(config?.configValue)
  },

  saveSceneItems: async (scene: AssetSupportScene, items: AssetSupportItem[]): Promise<TenantConfigRecord | null> => {
    const response = await api.put<TenantConfigRecord | null>(`/config/key/${scene}`, {
      value: serializeItems(items),
    })
    return response.data ?? null
  },
}
