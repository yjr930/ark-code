import type { PermissionPort } from '../../ports/permission-port.js'
import type { ElicitRequest, ElicitResult } from '../../types/public.js'

export async function handleElicitation(permissionPort: PermissionPort, request: ElicitRequest): Promise<ElicitResult> {
  return permissionPort.handleElicitation(request)
}
