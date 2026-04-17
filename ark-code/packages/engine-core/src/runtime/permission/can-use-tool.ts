import type { PermissionPort } from '../../ports/permission-port.js'
import type { PermissionDecision } from '../../types/public.js'

export async function canUseTool(permissionPort: PermissionPort, toolName: string, input: Record<string, unknown>, sourceMessageId: string): Promise<PermissionDecision> {
  return permissionPort.canUseTool({ toolName, input, sourceMessageId })
}
