"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requiredParam = requiredParam;
function requiredParam(value, name, defaultValue) {
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        const error = new Error(`Missing required parameter ${name}`);
        console.error(`Missing required parameter ${name}`, error);
        throw error;
    }
    return value;
}
