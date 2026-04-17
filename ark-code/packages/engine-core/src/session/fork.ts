import type { EngineSessionImpl } from './engine.js'
import { createEngineSession } from './engine-factory.js'

export function forkEngineSession(session: EngineSessionImpl): EngineSessionImpl {
  return createEngineSession({
    ...session.config,
    sessionId: `${session.id}-fork`,
    initialMessages: session.getState().messages,
  })
}
