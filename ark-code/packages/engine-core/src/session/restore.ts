import type { EngineSessionConfig, EngineSessionSnapshot } from '../types/public.js'
import { createEngineSession } from './engine-factory.js'

export function restoreSessionFromSnapshot(snapshot: EngineSessionSnapshot, config: EngineSessionConfig) {
  return createEngineSession({
    ...config,
    sessionId: snapshot.sessionId,
    initialMessages: snapshot.state.messages,
  })
}
