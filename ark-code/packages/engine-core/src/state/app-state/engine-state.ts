import type { EngineMessage } from '../messages/message-model.js'
import type { EngineTask } from '../../types/public.js'
import type { FileHistoryState } from '../file-history/rewind.js'
import type { AttributionState } from '../attribution/attribution-state.js'

export type EngineState = {
  messages: EngineMessage[]
  tasks: Record<string, EngineTask>
  mcpClients: { name: string }[]
  mcpResources: Record<string, { uri: string; name: string }[]>
  fileHistory: FileHistoryState
  attribution: AttributionState
  readFileCache: Map<string, string>
  permissionDenials: Array<{ toolName: string; toolUseId: string }>
}
