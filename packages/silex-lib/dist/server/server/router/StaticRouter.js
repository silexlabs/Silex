"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const nodeModules = require("node_modules-path");
const Path = require("path");
const serveStatic = require("serve-static");
function default_1(staticOptions) {
    const router = express.Router();
    // add static folders to serve published files
    router.use('/', serveStatic(Path.join(__dirname, '../../../../dist/html')));
    router.use('/', serveStatic(Path.join(__dirname, '../../../../dist/client')));
    router.use('/js', serveStatic(Path.join(__dirname, '../../../../dist/client')));
    router.use('/assets', serveStatic(Path.join(__dirname, '../../../../dist/public/assets')));
    router.use('/css', serveStatic(Path.join(__dirname, '../../../../dist/public/css')));
    router.use('/prodotype', serveStatic(Path.join(__dirname, '../../../../dist/prodotype')));
    // the scripts which have to be available in all versions (v2.1, v2.2, v2.3, ...)
    router.use('/static', serveStatic(Path.join(__dirname, '../../../../static')));
    // serve robots.txt against SEO
    router.use('/robots.txt', serveStatic(Path.join(__dirname, '../../../../static/robots.txt')));
    // wysihtml
    router.use('/libs/wysihtml', serveStatic(Path.resolve(nodeModules('wysihtml'), 'wysihtml/parser_rules')));
    router.use('/libs/wysihtml', serveStatic(Path.resolve(nodeModules('wysihtml'), 'wysihtml/dist/minified')));
    // js-beautify
    router.use('/libs/js-beautify', serveStatic(Path.resolve(nodeModules('js-beautify'), 'js-beautify/js/lib')));
    // font-awesome
    router.use('/libs/font-awesome/css', serveStatic(Path.resolve(nodeModules('font-awesome'), 'font-awesome/css')));
    router.use('/libs/font-awesome/fonts', serveStatic(Path.resolve(nodeModules('font-awesome'), 'font-awesome/fonts')));
    // ejs and prodotype
    router.use('/libs/prodotype', serveStatic(Path.resolve(nodeModules('prodotype'), 'prodotype/pub')));
    // styles for tags-input component
    router.use('/libs/tags-input', serveStatic(Path.resolve(nodeModules('tags-input'), 'tags-input')));
    // templates
    router.use('/libs/templates/silex-templates', serveStatic(Path.resolve(nodeModules('silex-templates'), 'silex-templates')));
    router.use('/libs/templates/silex-blank-templates', serveStatic(Path.resolve(nodeModules('silex-blank-templates'), 'silex-blank-templates')));
    // responsize for previews
    router.use('/responsize', serveStatic(Path.resolve(nodeModules('responsize'), 'responsize/dist')));
    return router;
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RhdGljUm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL3NlcnZlci9yb3V0ZXIvU3RhdGljUm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWtDO0FBQ2xDLGlEQUFnRDtBQUNoRCw2QkFBNEI7QUFDNUIsNENBQTJDO0FBRzNDLG1CQUF3QixhQUE0QjtJQUNsRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUE7SUFDL0IsOENBQThDO0lBQzlDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUMzRSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDN0UsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQy9FLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUMxRixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDcEYsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDRCQUE0QixDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ3pGLGlGQUFp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