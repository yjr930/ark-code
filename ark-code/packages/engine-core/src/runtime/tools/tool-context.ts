import type { EngineSessionConfig } from '../../types/public.js'
import type { EngineState } from '../../state/app-state/engine-state.js'

export type EngineToolUseContext = {
  config: EngineSessionConfig
  state: EngineState
  signal: AbortSignal
  sourceMessageId: string
}

export function createToolUseContext(config: EngineSessionConfig, state: EngineState, signal: AbortSignal, sourceMessageId: string): EngineToolUseContext {
  return { config, state, signal, sourceMessageId }
}
