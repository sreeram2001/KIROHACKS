export interface ValidationErrorDetail {
    field: string;
    error: string;
}

export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details: ValidationErrorDetail[];
    };
}
