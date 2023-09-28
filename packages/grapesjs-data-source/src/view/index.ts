import { DataEditor, Options } from ".."
import dynamicProperties from "./dynamic-properties"

export default (editor: DataEditor, opts: Partial<Options> = {}) => {
  if(opts.data?.appendTo) {
    dynamicProperties(editor, opts.data)
  } else {
    console.warn('Dynamic data UI not enabled, please set the appendTo option to enable it')
  }
}
