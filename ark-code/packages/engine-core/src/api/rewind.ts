import type { DiffStats } from '../state/file-history/diff-stats.js'
import type { EngineSession, ResumeLoadResult, RewindResult } from '../types/public.js'
import { canRewindFileHistory, getRewindDiffStats } from '../state/file-history/rewind.js'

export async function loadConversationForResume(sessionId: string): Promise<ResumeLoadResult> {
  return { sessionId, messages: [] }
}

export async function rewindFiles(session: EngineSession, userMessageId: string): Promise<RewindResult> {
  const state = session.getState().hostState.fileHistory.records[userMessageId] ?? []
  return {
    userMessageId,
    restoredPaths: state.map(item => item.path),
  }
}

export function canRewindFiles(session: EngineSession, userMessageId: string): boolean {
  return canRewindFileHistory(session.getState().hostState.fileHistory, userMessageId)
}

export async function getRewindDiffStatsApi(session: EngineSession, userMessageId: string): Promise<DiffStats | null> {
  return getRewindDiffStats(session.getState().hostState.fileHistory, userMessageId)
}
