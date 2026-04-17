import type { MCPServerConnection, ServerResource } from '../types/public.js'

export interface McpRuntimePort {
  listClients(): MCPServerConnection[]
  listResources(): Record<string, ServerResource[]>
}
