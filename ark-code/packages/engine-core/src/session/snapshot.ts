import type { EngineSessionSnapshot } from '../types/public.js'
import type { EngineSessionImpl } from './engine.js'

export function snapshotSessionState(session: EngineSessionImpl): EngineSessionSnapshot {
  return {
    sessionId: session.id,
    state: session.getState(),
  }
}
