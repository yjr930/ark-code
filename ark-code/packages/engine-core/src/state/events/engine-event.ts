import type { EngineMessage } from '../messages/message-model.js'
import type { EngineOperation, EngineTurnResult } from '../result/turn-result.js'

export type EngineEvent =
  | { type: 'system_init'; sessionId: string; model: string; toolNames: string[] }
  | { type: 'message'; message: EngineMessage }
  | { type: 'tool_use'; toolUseId: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; toolUseId: string; name: string; result: unknown; operation?: EngineOperation }
  | { type: 'progress'; message: string }
  | { type: 'result'; result: EngineTurnResult }
