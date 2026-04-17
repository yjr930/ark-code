import type { EngineHostState } from '../state/app-state/host-state.js'

export interface HostStatePort {
  getAppState(): EngineHostState
  setAppState(updater: (prev: EngineHostState) => EngineHostState): void
}
