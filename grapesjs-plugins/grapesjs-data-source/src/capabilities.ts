import { cmsCapabilities, CMS_DESCRIPTION } from './mcp/cms'

export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void, describeTool?: (name: string, description: string) => void) {
  describeTool?.('cms', CMS_DESCRIPTION)
  cmsCapabilities.forEach(capability => addCapability(capability))
}
