import { DataEditor, DataOptions, DynamicDataOptions } from ".."
import dynamicProperties from "./dynamic-properties"

export default (editor: DataEditor, opts: Partial<DataOptions> = {}) => {
  if(opts.dynamicData?.appendTo) {
    dynamicProperties(editor, opts.dynamicData)
  } else {
    console.warn('Dynamic data UI not enabled, please set the appendTo option to enable it')
  }
}
