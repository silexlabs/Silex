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
exports.noCache = noCache;
exports.withCache = withCache;
function noCache(req, res, next) {
    res.header('Cache-Control', 'private,no-cache,no-store,must-revalidate,proxy-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
}
function withCache(req, res, next) {
    if (req.url.endsWith('.html') || req.url.endsWith('/')) {
        noCache(req, res, next);
    }
    else {
        res.header('Cache-Control', 'public,max-age=86400,immutable'); // 24h
        next();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvcGx1Z2lucy9zZXJ2ZXIvQ2FjaGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRzs7QUFFSCwwQkFLQztBQUVELDhCQU9DO0FBZEQsU0FBZ0IsT0FBTyxDQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSTtJQUNyQyxHQUFHLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSw0REFBNEQsQ0FBQyxDQUFBO0lBQ3pGLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQzNCLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFBO0lBQ2hDLElBQUksRUFBRSxDQUFBO0FBQ1IsQ0FBQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUk7SUFDdEMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ3ZELE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ3pCLENBQUM7U0FBTSxDQUFDO1FBQ04sR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQSxDQUFDLE1BQU07UUFDcEUsSUFBSSxFQUFFLENBQUE7SUFDUixDQUFDO0FBQ0gsQ0FBQyJ9