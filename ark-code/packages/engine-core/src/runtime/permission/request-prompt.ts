import type { PermissionPort } from '../../ports/permission-port.js'
import type { PromptRequest, PromptResponse } from '../../types/public.js'

export async function requestPrompt(permissionPort: PermissionPort, request: PromptRequest): Promise<PromptResponse> {
  return permissionPort.requestPrompt(request)
}
