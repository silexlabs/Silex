/**
 * Throw an error if a parameter is missing
 * @param value the value to check
 * @param name the name of the parameter
 * @throws Error if the parameter is missing
 */
export declare function requiredParam<T>(value: T | undefined, name: string, defaultValue?: T): NonNullable<T>;
