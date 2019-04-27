const Path = require('path');
const nodeModules = require('node_modules-path');
const serveStatic = require('serve-static');
const express = require('express');
import { StaticOptions } from "../ServerConfig";

export default function(staticOptions: StaticOptions) {
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
  // wysihtml
  router.use('/libs/wysihtml', serveStatic(Path.resolve(nodeModules('wysihtml'), 'wysihtml/parser_rules')));
  router.use('/libs/wysihtml', serveStatic(Path.resolve(nodeModules('wysihtml'), 'wysihtml/dist/minified')));
  // js-beautify
  router.use('/libs/js-beautify', serveStatic(Path.resolve(nodeModules('js-beautify'), 'js-beautify/js/lib')));
  // ace
  router.use('/libs/ace', serveStatic(Path.resolve(nodeModules('ace-builds'), 'ace-builds/src-min')));
  // alertify
  router.use('/libs/alertify', serveStatic(Path.resolve(nodeModules('alertifyjs'), 'alertifyjs/build')));
  // // normalize.css
  // router.use('/libs/normalize.css', serveStatic(Path.resolve(nodeModules('normalize.css'), 'normalize.css')));
  // font-awesome
  router.use('/libs/font-awesome/css', serveStatic(Path.resolve(nodeModules('font-awesome'), 'font-awesome/css')));
  router.use('/libs/font-awesome/fonts', serveStatic(Path.resolve(nodeModules('font-awesome'), 'font-awesome/fonts')));
  // templates
  router.use('/libs/templates/silex-templates', serveStatic(Path.resolve(nodeModules('silex-templates'), 'silex-templates')));
  router.use('/libs/templates/silex-blank-templates', serveStatic(Path.resolve(nodeModules('silex-blank-templates'), 'silex-blank-templates')));
  router.use('/libs/prodotype', serveStatic(Path.resolve(nodeModules('prodotype'), 'prodotype/pub')));

  return router;
}
