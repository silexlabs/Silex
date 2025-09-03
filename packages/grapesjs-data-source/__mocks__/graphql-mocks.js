"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.squidexSchema = exports.simpleSchema = exports.strapiSchema = exports.directusTestSchema = void 0;
const fs_1 = __importDefault(require("fs"));
exports.directusTestSchema = JSON.parse(fs_1.default.readFileSync(__dirname + '/directus-test-schema.json', 'utf8'));
exports.strapiSchema = JSON.parse(fs_1.default.readFileSync(__dirname + '/strapi-schema.json', 'utf8'));
exports.simpleSchema = JSON.parse(fs_1.default.readFileSync(__dirname + '/simple-schema.json', 'utf8'));
exports.squidexSchema = JSON.parse(fs_1.default.readFileSync(__dirname + '/squidex-schema.json', 'utf8'));
//# sourceMappingURL=graphql-mocks.js.map