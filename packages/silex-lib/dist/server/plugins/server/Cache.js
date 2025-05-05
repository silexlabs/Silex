"use strict";
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
    if (req.path.endsWith('.html') || req.path.endsWith('/')) {
        noCache(req, res, next);
    }
    else {
        res.header('Cache-Control', 'public,max-age=86400,immutable');
        next();
    }
}
