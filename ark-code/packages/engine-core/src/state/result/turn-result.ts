export type EngineUsage = {
  inputTokens: number
  outputTokens: number
  totalCostUsd: number
}

export type EngineOperationKind = 'write-file' | 'patch-file' | 'search-files' | 'bash' | 'read-file'

export type EngineOperation = {
  kind: EngineOperationKind
  summary: string
  target?: string
  details?: Record<string, unknown>
}

export type EngineTurnStatus = 'completed' | 'failed' | 'aborted'

export type EngineTurnResult = {
  status: EngineTurnStatus
  stopReason: string | null
  outputText: string
  operations: EngineOperation[]
  usage: EngineUsage
  errorMessage?: string
}
