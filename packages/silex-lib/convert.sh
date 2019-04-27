# mkdir -p converted

# remove all goog.inherits as gents seems to bug on them
# replace goog.inherits with // goog...inherits so that several passes will not replace it many times
echo "Commenting out all goog.inherits"
sed -i 's/goog\.inherits/\/\/goog\.\.\.inherits/g' src/js/**/*.js
sed -i 's/goog\.inherits/\/\/goog\.\.\.inherits/g' src/js/**/**/*.js

# from goog.base(this, element, model, controller); to super(element, model, controller);
sed -i 's/goog\.base.this, /\/\*\*\/super\(/g' src/js/**/*.js
sed -i 's/goog\.base.this, /\/\*\*\/super\(/g' src/js/**/**/*.js

# I could use --sourcesManifest manifest
# but for some reason there are all closure files in there too
echo "Converting all js files"
gents --debug --externs src/externs.js --dependenciesManifest manifest --root src/ -o converted/  --convert \
  src/js/utils/Keyboard.js \
  src/js/config.js \
  src/js/controller/controller-base.js \
  src/js/controller/context-menu-controller.js \
  src/js/controller/css-editor-controller.js \
  src/js/service/silex-tasks.js \
  src/js/controller/edit-menu-controller.js \
  src/js/view/dialog/PublishDialog.js \
  src/js/controller/file-menu-controller.js \
  src/js/controller/html-editor-controller.js \
  src/js/controller/insert-menu-controller.js \
  src/js/controller/js-editor-controller.js \
  src/js/controller/page-tool-controller.js \
  src/js/controller/property-tool-controller.js \
  src/js/controller/settings-dialog-controller.js \
  src/js/controller/stage-controller.js \
  src/js/controller/text-editor-controller.js \
  src/js/controller/tool-menu-controller.js \
  src/js/controller/view-menu-controller.js \
  src/js/types.js \
  src/js/utils/invalidation-manager.js \
  src/js/model/body.js \
  src/js/utils/url.js \
  src/js/model/element.js \
  src/js/model/Component.js \
  src/js/model/file.js \
  src/js/model/head.js \
  src/js/model/page.js \
  src/js/model/property.js \
  src/js/model/DragSystem.js \
  src/js/service/tracker.js \
  src/js/utils/dom.js \
  src/js/utils/polyfills.js \
  src/js/view/bread-crumbs.js \
  src/js/utils/style.js \
  src/js/utils/notification.js \
  src/js/view/context-menu.js \
  src/js/view/menu.js \
  src/js/view/page-tool.js \
  src/js/view/ColorPicker.js \
  src/js/view/pane/pane-base.js \
  src/js/view/pane/bg-pane.js \
  src/js/view/pane/border-pane.js \
  src/js/view/pane/general-style-pane.js \
  src/js/view/pane/page-pane.js \
  src/js/view/pane/property-pane.js \
  src/js/view/pane/style-pane.js \
  src/js/view/pane/StyleEditorPane.js \
  src/js/view/property-tool.js \
  src/js/view/dialog/LinkDialog.js \
  src/js/view/TextFormatBar.js \
  src/js/view/splitter.js \
  src/js/view/stage.js \
  src/js/view/workspace.js \
  src/js/view/ModalDialog.js \
  src/js/view/dialog/ace-editor-base.js \
  src/js/view/dialog/css-editor.js \
  src/js/service/cloud-storage.js \
  src/js/view/dialog/file-explorer.js \
  src/js/view/dialog/html-editor.js \
  src/js/view/dialog/js-editor.js \
  src/js/view/dialog/settings-dialog.js \
  src/js/view/tip-of-the-day.js \
  src/js/view/dialog/Dashboard.js \
  src/js/model/Data.js \
  src/js/app.js \

# restore the source files
echo "Decommenting all goog.inherits"
sed -i 's/\/\/goog\.\.\.inherits/goog\.inherits/g' src/js/**/*.js
sed -i 's/\/\/goog\.\.\.inherits/goog\.inherits/g' src/js/**/**/*.js
sed -i 's/\/\*\*\/super./goog\.base(this, /g' src/js/**/*.js
sed -i 's/\/\*\*\/super./goog\.base(this, /g' src/js/**/**/*.js

# patch generated files
echo "Patching generated files"
echo "- add closure lib register in app.ts"
cat converted/src/js/app.ts > .tmp.txt
# echo "import closure = require('../../../node_modules/closure-library.ts/index');closure.register();" > converted/src/js/app.ts
echo "import * as closure from '../../node_modules/closure-library.ts/index';closure.register();" > converted/src/js/app.ts
cat .tmp.txt >> converted/src/js/app.ts
rm .tmp.txt

# from import * as dom from 'goog:goog.dom';
# to var dom = goog.require('goog:goog.dom');
echo "- replace imports with goog.require for goog modules in app.ts"
sed -i 's/import \* as \(.*\) from .goog\:goog\.\(.*\).;/var \1 = goog.require("goog:goog.\2");/g' converted/src/js/**/**/*.ts
sed -i 's/import \* as \(.*\) from .goog\:goog\.\(.*\).;/var \1 = goog.require("goog:goog.\2");/g' converted/src/js/**/*.ts
sed -i 's/import \* as \(.*\) from .goog\:goog\.\(.*\).;/var \1 = goog.require("goog:goog.\2");/g' converted/src/js/*.ts

# from import KeyCodes from 'goog:goog.events.KeyCodes';
# to var {KeyCodes} = goog.require('goog:goog.events.KeyCodes');
echo "- replace other imports with goog.require for goog modules in app.ts"
sed -i 's/import \(.*\) from .goog\:goog\.\(.*\).;/var {\1} = goog.require("goog:goog.\2");/g' converted/src/js/**/**/*.ts
sed -i 's/import \(.*\) from .goog\:goog\.\(.*\).;/var {\1} = goog.require("goog:goog.\2");/g' converted/src/js/**/*.ts
sed -i 's/import \(.*\) from .goog\:goog\.\(.*\).;/var {\1} = goog.require("goog:goog.\2");/g' converted/src/js/*.ts


echo "Done, now do npm run build:ts"
