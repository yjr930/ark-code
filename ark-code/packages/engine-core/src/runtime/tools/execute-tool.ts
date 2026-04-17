import { canUseTool } from '../permission/can-use-tool.js'
import { validateToolInput } from './validate-input.js'
import type { EngineSessionConfig } from '../../types/public.js'
import type { EngineState } from '../../state/app-state/engine-state.js'
import { createToolUseContext } from './tool-context.js'
import { findToolByName, type EngineToolCallResult, type EngineToolDefinition } from './registry.js'

export async function executeToolCall(
  tools: EngineToolDefinition[],
  toolName: string,
  input: Record<string, unknown>,
  config: EngineSessionConfig,
  state: EngineState,
  signal: AbortSignal,
  sourceMessageId: string,
): Promise<EngineToolCallResult> {
  const validatedInput = validateToolInput(input)
  const permission = await canUseTool(config.ports.permissionPort, toolName, validatedInput, sourceMessageId)
  if (permission.behavior === 'deny') {
    throw new Error(permission.reason ?? `Tool denied: ${toolName}`)
  }
  const tool = findToolByName(tools, toolName)
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`)
  }
  const context = createToolUseContext(config, state, signal, sourceMessageId)
  const textInput = typeof validatedInput.prompt === 'string' ? validatedInput.prompt : JSON.stringify(validatedInput)
  return tool.run(textInput, context)
}
