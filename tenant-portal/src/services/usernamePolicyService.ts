import { api } from "./api";

export interface TenantUsernamePolicy {
  systemExact: string[];
  systemFragments: string[];
  customExact: string[];
  customFragments: string[];
  effectiveExact: string[];
  effectiveFragments: string[];
}

export interface UpdateTenantUsernamePolicyPayload {
  customExact: string[];
  customFragments: string[];
}

export const usernamePolicyService = {
  getPolicy: async () => {
    return api.get<TenantUsernamePolicy>("/config/username-policy");
  },

  updatePolicy: async (payload: UpdateTenantUsernamePolicyPayload) => {
    return api.put<TenantUsernamePolicy>("/config/username-policy", payload);
  },
};
