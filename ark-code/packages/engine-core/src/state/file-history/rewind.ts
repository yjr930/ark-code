import type { DiffStats } from './diff-stats.js'

export type RewindResult = {
  userMessageId: string
  restoredPaths: string[]
}

export type FileHistoryState = {
  records: Record<string, { path: string; existed: boolean; content: string | null }[]>
}

export function createEmptyFileHistoryState(): FileHistoryState {
  return { records: {} }
}

export function canRewindFileHistory(state: FileHistoryState, userMessageId: string): boolean {
  return userMessageId in state.records
}

export function getRewindDiffStats(state: FileHistoryState, userMessageId: string): DiffStats | null {
  const record = state.records[userMessageId]
  if (!record) return null
  return {
    added: record.filter(item => !item.existed).length,
    removed: 0,
    changed: record.filter(item => item.existed).length,
  }
}
