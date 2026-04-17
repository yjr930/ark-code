export type SessionHooks = {
  onSessionStart?: Array<() => Promise<void> | void>
}

export function createSessionHooks(): SessionHooks {
  return {}
}
