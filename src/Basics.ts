export const isString = (value: any): value is string => typeof value === 'string';

export const isNumber = (value: any): value is number => typeof value === 'number';

export const isBoolean = (value: any): value is boolean => typeof value === 'boolean';

export const isArray = (input: any): input is Array<any> => input instanceof Array;

export const isObject = (input: any): input is {[ key: string ]: any} => {
    return typeof input === 'object' && input !== null && !isArray(input);
};
