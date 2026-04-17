import type { ResumeLoadResult } from '../types/public.js'
import type { EngineMessage } from '../state/messages/message-model.js'

export type RecordTranscriptRequest = {
  sessionId: string
  messages: EngineMessage[]
}

export type FlushSessionRequest = {
  sessionId: string
}

export interface SessionStorePort {
  recordTranscript(request: RecordTranscriptRequest): Promise<void>
  flush(request: FlushSessionRequest): Promise<void>
  loadConversationForResume(request: { sessionId: string }): Promise<ResumeLoadResult>
  processResumedConversation?(request: ResumeLoadResult): Promise<ResumeLoadResult>
}
