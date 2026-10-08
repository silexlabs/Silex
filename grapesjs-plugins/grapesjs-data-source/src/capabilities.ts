import { cmsCapability } from './mcp/cms'

export function registerCapabilities(addCapability: (def: Record<string, unknown>) => void) {
  addCapability(cmsCapability)
}
