import type { EngineEvent } from '../state/events/engine-event.js'
import type { EngineSession, EngineSessionConfig, EngineSessionSnapshot, EngineSessionState, SubmitInputOptions } from '../types/public.js'
import { createEngineSession } from '../session/engine-factory.js'
import { restoreSessionFromSnapshot } from '../session/restore.js'
import { forkEngineSession } from '../session/fork.js'

export function createSessionEngine(config: EngineSessionConfig): EngineSession {
  return createEngineSession(config)
}

export function resumeSessionEngine(config: EngineSessionConfig, snapshot: EngineSessionSnapshot): EngineSession {
  return restoreSessionFromSnapshot(snapshot, config)
}

export async function destroySession(session: EngineSession): Promise<void> {
  await session.destroy()
}

export function forkSession(session: EngineSession): EngineSession {
  return forkEngineSession(session as ReturnType<typeof createEngineSession>)
}

export function snapshotSession(session: EngineSession): EngineSessionSnapshot {
  return session.snapshot()
}

export function restoreSession(snapshot: EngineSessionSnapshot, config: EngineSessionConfig): EngineSession {
  return restoreSessionFromSnapshot(snapshot, config)
}

export function getSessionState(session: EngineSession): EngineSessionState {
  return session.getState()
}

export function submitInput(session: EngineSession, input: string, options?: SubmitInputOptions): AsyncGenerator<EngineEvent, import('../state/result/turn-result.js').EngineTurnResult> {
  return session.submitInput(input, options)
}

export async function abortTurn(session: EngineSession, reason?: string): Promise<void> {
  await session.abortTurn(reason)
}
