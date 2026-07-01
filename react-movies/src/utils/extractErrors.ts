import type { AxiosError } from "axios";

export default function extractError(obj: AxiosError): string[]{
    const data = obj.response?.data as ErrorResponse;
    const err = data.errors;
    let messageWithErrors: string[] = [];

    for (const field in err){
        //Name: [error1, error2] => [Name: error1, Name: error2]
        const messageWithFields = err[field].map(errorMessage =>  `${field}: ${errorMessage}`);
        messageWithErrors = [...messageWithErrors, ...messageWithFields]
    }

    return messageWithErrors;
}

interface ErrorResponse{
    errors: {
        [field: string]: string[]
    }
}