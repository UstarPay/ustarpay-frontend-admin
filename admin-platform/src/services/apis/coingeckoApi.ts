export interface CoinGeckoSimplePriceResponse {
  [coinGeckoId: string]: {
    usd?: number;
  };
}

const COINGECKO_SIMPLE_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price'

export const coingeckoApi = {
  async getSimplePrices(ids: string[]): Promise<CoinGeckoSimplePriceResponse> {
    const normalizedIds = Array.from(
      new Set(
        ids.map((id) => id.trim()).filter(Boolean)
      )
    )

    if (normalizedIds.length === 0) {
      return {}
    }

    const query = new URLSearchParams({
      ids: normalizedIds.join(','),
      vs_currencies: 'usd',
    })

    const response = await fetch(`${COINGECKO_SIMPLE_PRICE_URL}?${query.toString()}`)
    if (!response.ok) {
      throw new Error(`CoinGecko request failed with status ${response.status}`)
    }

    return response.json()
  },
}

export default coingeckoApi
