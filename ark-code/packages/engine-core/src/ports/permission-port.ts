import type { ElicitRequest, ElicitResult, PermissionDecision, PromptRequest, PromptResponse } from '../types/public.js'

export type ToolPermissionRequest = {
  toolName: string
  input: Record<string, unknown>
  sourceMessageId: string
}

export interface PermissionPort {
  canUseTool(request: ToolPermissionRequest): Promise<PermissionDecision>
  requestPrompt(request: PromptRequest): Promise<PromptResponse>
  handleElicitation(request: ElicitRequest): Promise<ElicitResult>
}
