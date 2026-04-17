import type { FileHistoryState } from '../file-history/rewind.js'
import type { AttributionState } from '../attribution/attribution-state.js'

export type EngineHostState = {
  toolPermissionContext: {
    mode: 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions'
  }
  fileHistory: FileHistoryState
  attribution: AttributionState
  mcp: {
    clients: { name: string }[]
  }
  ui: {
    replModeEnabled: boolean
  }
  toolRuntime: {
    embeddedSearchToolsEnabled: boolean
  }
}
