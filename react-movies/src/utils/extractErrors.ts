import type { AxiosError } from "axios";

export default function extractError(obj: AxiosError): string[]{
    if (!obj.response) {
        return ['The server could not be reached. Check your connection and try again.'];
    }

    if (obj.response.status === 429) {
        return ['Too many requests. Wait a moment and try again.'];
    }

    const data = obj.response.data as Partial<ErrorResponse> | undefined;
    const err = data?.errors;
    if (!err) {
        return [data?.title ?? 'The request could not be completed. Please try again.'];
    }

    let messageWithErrors: string[] = [];

    for (const field in err){
        //Name: [error1, error2] => [Name: error1, Name: error2]
        const messageWithFields = err[field].map(errorMessage =>  `${field}: ${errorMessage}`);
        messageWithErrors = [...messageWithErrors, ...messageWithFields]
    }

    return messageWithErrors;
}

interface ErrorResponse{
    title: string;
    errors: {
        [field: string]: string[]
    }
}
