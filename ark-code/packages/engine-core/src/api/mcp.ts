import type { EngineSession, MCPServerConnection, McpResourceResult, ServerResource } from '../types/public.js'

function getHostState(session: EngineSession) {
  return session.getState().hostState
}

export function attachMcpClients(_session: EngineSession, _clients: MCPServerConnection[]): void {
  // current stage keeps MCP ownership in host state; attachment is exposed but inert
}

export function detachMcpClient(_session: EngineSession, _clientName: string): void {
  // current stage keeps MCP ownership in host state; detachment is exposed but inert
}

export function listMcpClients(session: EngineSession): MCPServerConnection[] {
  return getHostState(session).mcp.clients.map(client => ({ name: client.name, status: 'connected' as const }))
}

export function listMcpResources(_session: EngineSession): Record<string, ServerResource[]> {
  return {}
}

export async function refreshMcpResources(_session: EngineSession): Promise<void> {
  return undefined
}

export async function readMcpResource(_session: EngineSession, request: { uri: string }): Promise<McpResourceResult> {
  return { uri: request.uri, contents: '' }
}
