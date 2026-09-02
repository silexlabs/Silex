// Minimal ambient declaration for webpack's require.context, used to load
// every editor/src/locales/*.json file without listing them by name.
interface NodeRequire {
  context(directory: string, useSubdirectories?: boolean, regExp?: RegExp): {
    keys(): string[]
    <T = any>(id: string): T
  }
}
declare const require: NodeRequire
