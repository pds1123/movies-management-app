import type { AxiosError } from "axios";

export default function extractIdentityErrors(obj: AxiosError): string[]{
    if (!obj.response) {
        return ['The server could not be reached. Check your connection and try again.'];
    }

    if (obj.response.status === 429) {
        return ['Too many sign-in attempts. Wait a minute and try again.'];
    }

    const data = obj.response.data;
    if (Array.isArray(data)) {
        const errorMessages = (data as ErrorResponse[])
            .map(error => error.description)
            .filter(Boolean);

        if (errorMessages.length > 0) {
            return errorMessages;
        }
    }

    return ['Sign in could not be completed. Please try again.'];
}

interface ErrorResponse {
    code: string;
    description: string;
}
