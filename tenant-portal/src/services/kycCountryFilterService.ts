import { api } from "./api";

export interface CountryOption {
  nameZh: string;
  nameEn: string;
  alpha2: string;
  alpha3: string;
  numericCode: string;
  continent: string;
}

export interface TenantKYCCountryFilter {
  allowAlpha3: string[];
  denyAlpha3: string[];
}

export const kycCountryFilterService = {
  getFilter: async () => {
    return api.get<TenantKYCCountryFilter>(
      "/config/kyc-country-filter",
      { _ts: Date.now() },
      {
        config: {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      },
    );
  },

  updateFilter: async (payload: TenantKYCCountryFilter) => {
    return api.put<TenantKYCCountryFilter>("/config/kyc-country-filter", payload);
  },

  listCountries: async () => {
    return api.get<CountryOption[]>(
      "/app/countries",
      { _ts: Date.now() },
      {
        prefix: "/auth/v1",
        config: {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      },
    );
  },
};
