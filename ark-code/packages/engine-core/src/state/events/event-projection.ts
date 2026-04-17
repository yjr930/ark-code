import type { EngineEvent } from './engine-event.js'
import type { EngineMessage } from '../messages/message-model.js'
import type { EngineOperation } from '../result/turn-result.js'

export function toMessageEvent(message: EngineMessage): EngineEvent {
  return { type: 'message', message }
}

export function toToolUseEvent(toolUseId: string, name: string, input: Record<string, unknown>): EngineEvent {
  return { type: 'tool_use', toolUseId, name, input }
}

export function toToolResultEvent(toolUseId: string, name: string, result: unknown, operation?: EngineOperation): EngineEvent {
  return { type: 'tool_result', toolUseId, name, result, operation }
}
