import type { EngineSessionConfig } from '../types/public.js'
import type { EngineState } from '../state/app-state/engine-state.js'
import { createEmptyFileHistoryState } from '../state/file-history/rewind.js'
import { createEmptyAttributionState } from '../state/attribution/attribution-state.js'

export function createInitialEngineState(config: EngineSessionConfig): EngineState {
  return {
    messages: config.initialMessages ? [...config.initialMessages] : [],
    tasks: {},
    mcpClients: config.ports.mcpRuntimePort.listClients(),
    mcpResources: config.ports.mcpRuntimePort.listResources(),
    fileHistory: createEmptyFileHistoryState(),
    attribution: createEmptyAttributionState(),
    readFileCache: new Map(),
    permissionDenials: [],
  }
}
