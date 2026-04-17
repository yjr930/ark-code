import type { EngineSessionConfig, ModelResult, EngineTask, AgentDefinition, MCPServerConnection, ServerResource } from './public.js'
import type { EngineMessage } from '../state/messages/message-model.js'
import type { EngineState } from '../state/app-state/engine-state.js'
import type { EngineOperation } from '../state/result/turn-result.js'

import type { SystemPrompt } from '../context/prompt-builder.js'

export type TurnContext = {
  defaultSystemPrompt: SystemPrompt
  systemPrompt: SystemPrompt
  fullSystemPrompt: SystemPrompt
  userContext: Record<string, string>
  systemContext: Record<string, string>
  messagesWithUserContext: EngineMessage[]
  model: string
  cwd: string
}

export type QueryLoopState = {
  messages: EngineMessage[]
  turnCount: number
  operations: EngineOperation[]
}

export type ToolExecutionContext = {
  config: EngineSessionConfig
  state: EngineState
  messageId: string
}

export type TaskRegistry = Record<string, EngineTask>

export type AgentRegistry = Record<string, AgentDefinition>

export type McpRuntimeState = {
  clients: MCPServerConnection[]
  resources: Record<string, ServerResource[]>
}

export type ModelExecution = {
  requestMessages: EngineMessage[]
  result: ModelResult
}
