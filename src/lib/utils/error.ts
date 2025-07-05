import { ApiResponse } from '../../types';

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, this.constructor);
        }
    }
}

export const createErrorResponse = (
    error: string | Error,
    statusCode: number = 500
): ApiResponse => {
    const message = error instanceof Error ? error.message : error;

    return {
        success: false,
        error: message,
        message: 'An error occurred'
    };
};

export const createSuccessResponse = <T>(
    data: T,
    message?: string
): ApiResponse<T> => {
    return {
        success: true,
        data,
        message
    };
};

export const handleAsyncError = (fn: Function) => {
    return async (...args: any[]) => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error('Async error:', error);
            throw error;
        }
    };
};

export const logError = (error: Error, context?: string) => {
    console.error(`[${context || 'ERROR'}]`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
}; 