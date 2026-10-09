import { cmsCapabilities } from './mcp/cms'

export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void) {
  cmsCapabilities.forEach(capability => addCapability(capability))
}
