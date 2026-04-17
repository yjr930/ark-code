import type { McpResourceResult, ServerResource } from '../../types/public.js'

export function listMcpResources(resources: Record<string, ServerResource[]>): Record<string, ServerResource[]> {
  return resources
}

export async function readMcpResource(resources: Record<string, ServerResource[]>, uri: string): Promise<McpResourceResult> {
  for (const serverResources of Object.values(resources)) {
    const resource = serverResources.find(item => item.uri === uri)
    if (resource) {
      return { uri, contents: resource.name }
    }
  }
  throw new Error(`MCP resource not found: ${uri}`)
}
