import type { ActionExecutionRecord } from '../api/types.js'

export interface RunState {
  turnCount: number
  status: 'idle' | 'running' | 'completed' | 'failed'
  outputText: string
  actions: ActionExecutionRecord[]
}
