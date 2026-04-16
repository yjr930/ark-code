import type { WorkspacePaths } from '../api/types.js'

export interface SessionState {
  sessionId: string
  runId: string
  workingDirectory: string
  workspacePaths: WorkspacePaths
  history: string[]
}
