import type { EngineSessionConfig } from '../types/public.js'
import { createInitialEngineState } from './session-state.js'
import { EngineSessionImpl } from './engine.js'

export function createEngineSession(config: EngineSessionConfig): EngineSessionImpl {
  const state = createInitialEngineState(config)
  return new EngineSessionImpl(config, state)
}
