"use strict";
/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requiredParam = requiredParam;
/**
 * Throw an error if a parameter is missing
 * @param value the value to check
 * @param name the name of the parameter
 * @throws Error if the parameter is missing
 */
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
//# sourceMappingURL=validation.js.map