import type { MCPServerConnection } from '../../types/public.js'

export function attachMcpClients(current: MCPServerConnection[], next: MCPServerConnection[]): MCPServerConnection[] {
  return [...current, ...next]
}

export function detachMcpClient(current: MCPServerConnection[], clientName: string): MCPServerConnection[] {
  return current.filter(client => client.name !== clientName)
}
