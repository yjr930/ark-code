import type { SessionHooks } from './session-hooks.js'

export async function runSessionStartHooks(hooks: SessionHooks): Promise<void> {
  for (const hook of hooks.onSessionStart ?? []) {
    await hook()
  }
}
