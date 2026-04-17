import type { EngineMessage } from '../messages/message-model.js'

export type TranscriptEntry = {
  sessionId: string
  message: EngineMessage
}

export type TranscriptBatch = {
  sessionId: string
  entries: TranscriptEntry[]
}
