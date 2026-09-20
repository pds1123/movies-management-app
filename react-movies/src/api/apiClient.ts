import axios, { type InternalAxiosRequestConfig } from "axios";
import { getToken } from "../features/security/utils/HandleJWT";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
    throw new Error('VITE_API_URL is required. Set it in your local or deployment environment.');
}

const apiClient = axios.create({
    baseURL: apiUrl,
    timeout: 45_000,
    headers: {
        "Content-Type":"application/json"
    }
});


apiClient.interceptors.request.use(config => {
    const token = getToken();

    if (token){
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
})

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    coldStartRetryAttempted?: boolean;
};

apiClient.interceptors.response.use(
    response => response,
    async error => {
        const config = error.config as RetryableRequestConfig | undefined;
        const status = error.response?.status as number | undefined;
        const method = config?.method?.toLowerCase();
        const shouldRetry = config
            && method === 'get'
            && !config.coldStartRetryAttempted
            && !axios.isCancel(error)
            && (!error.response || (status !== undefined && status >= 500));

        if (!shouldRetry) {
            return Promise.reject(error);
        }

        config.coldStartRetryAttempted = true;
        await new Promise(resolve => setTimeout(resolve, 1_500));
        return apiClient(config);
    }
);

export default apiClient;
