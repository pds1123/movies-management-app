import axios from "axios";
import { getToken } from "../features/security/utils/HandleJWT";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
    throw new Error('VITE_API_URL is required. Set it in your local or deployment environment.');
}

const apiClient = axios.create({
    baseURL: apiUrl,
    timeout: 10_000,
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

export default apiClient;
