import type { MCPServerConnection, McpResourceResult, ServerResource } from '../../types/public.js'
import { listMcpResources as listResourcesImpl, readMcpResource as readResourceImpl } from './resources.js'

export type EngineMcpRuntime = {
  clients: MCPServerConnection[]
  resources: Record<string, ServerResource[]>
}

export function createMcpRuntime(clients: MCPServerConnection[], resources: Record<string, ServerResource[]>): EngineMcpRuntime {
  return { clients, resources }
}

export function listMcpClients(runtime: EngineMcpRuntime): MCPServerConnection[] {
  return runtime.clients
}

export function listMcpResources(runtime: EngineMcpRuntime): Record<string, ServerResource[]> {
  return listResourcesImpl(runtime.resources)
}

export async function readMcpResource(runtime: EngineMcpRuntime, uri: string): Promise<McpResourceResult> {
  return readResourceImpl(runtime.resources, uri)
}
