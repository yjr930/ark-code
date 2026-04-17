import type { EngineMessage } from '../messages/message-model.js'

export type TranscriptEvent =
  | { type: 'record_message'; message: EngineMessage }
  | { type: 'compact_boundary'; boundaryId: string }
  | { type: 'queue_operation'; operation: string }
  | { type: 'content_replacement'; messageId: string }
