import { useAuthStore } from '@/stores'
import { ApiService } from '@shared/utils/api'

export const api = new ApiService({ 
    getToken: () => useAuthStore.getState().token,
    clearAuth: () => useAuthStore.getState().clearAuth(),
    refreshToken: () => useAuthStore.getState().refreshToken,
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/',
})