# compile with closure compiler
#java -jar compiler.jar --js js/controller.js js/helper.js js/model/file.js js/model/selection.js js/view/menu.js js/view/page-tool.js js/view/properties-tool.js js/view/stage.js js/view/texteditor.js js/view/workspace.js 

# compile with advanced compilation
# java -jar compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js js/controller.js js/helper.js js/model/file.js js/model/selection.js js/view/menu.js js/view/page-tool.js js/view/properties-tool.js js/view/stage.js js/view/texteditor.js js/view/workspace.js 

# build with closure builder
#libs/closure-library/closure/bin/build/closurebuilder.py --root=libs/ --root=js/ --namespace="silex"

# build with closure builder
closure-library/closure/bin/build/closurebuilder.py \
  --root=closure-library/ \
  --root=../src/ \
  --namespace="silex.boot" \
  --output_mode=compiled \
  --compiler_jar=closure-compiler.jar \
  > ../client/js/admin.js
  