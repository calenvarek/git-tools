/**
 * Runtime validation utilities for safe type handling
 */

/**
 * Safely parses JSON with error handling
 */
export const safeJsonParse = <T = any>(jsonString: string, context?: string): T => {
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed === null || parsed === undefined) {
            throw new Error('Parsed JSON is null or undefined');
        }
        return parsed;
    } catch (error) {
        const contextStr = context ? ` (${context})` : '';
        throw new Error(`Failed to parse JSON${contextStr}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Validates that a value is a non-empty string
 */
export const validateString = (value: any, fieldName: string): string => {
    if (typeof value !== 'string') {
        throw new Error(`${fieldName} must be a string, got ${typeof value}`);
    }
    if (value.trim() === '') {
        throw new Error(`${fieldName} cannot be empty`);
    }
    return value;
};

/**
 * Validates that a value exists and has a specific property
 */
export const validateHasProperty = (obj: any, property: string, context?: string): void => {
    if (!obj || typeof obj !== 'object') {
        const contextStr = context ? ` in ${context}` : '';
        throw new Error(`Object is null or not an object${contextStr}`);
    }
    if (!(property in obj)) {
        const contextStr = context ? ` in ${context}` : '';
        throw new Error(`Missing required property '${property}'${contextStr}`);
    }
};

/**
 * Validates package.json structure has basic required fields
 */
export const validatePackageJson = (data: any, context?: string, requireName: boolean = true): any => {
    if (!data || typeof data !== 'object') {
        const contextStr = context ? ` (${context})` : '';
        throw new Error(`Invalid package.json${contextStr}: not an object`);
    }
    if (requireName && typeof data.name !== 'string') {
        const contextStr = context ? ` (${context})` : '';
        throw new Error(`Invalid package.json${contextStr}: name must be a string`);
    }
    return data;
};

