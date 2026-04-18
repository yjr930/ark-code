import type { FileHistoryState } from '../file-history/rewind.js'
import type { AttributionState } from '../attribution/attribution-state.js'
import type { AgentDefinition } from '../../types/public.js'

export type EngineHostState = {
  toolPermissionContext: {
    mode: 'default' | 'acceptEdits' | 'plan' | 'bypassPermissions'
    additionalWorkingDirectories: ReadonlyMap<string, { path: string }>
  }
  worktree: {
    currentSession: {
      worktreePath: string
      originalCwd: string
      worktreeBranch: string
    } | null
  }
  repo: {
    repoClass: 'internal' | 'external' | 'none' | null
  }
  fileHistory: FileHistoryState
  attribution: AttributionState
  mcp: {
    clients: { name: string; type: 'connected'; instructions?: string }[]
  }
  ui: {
    replModeEnabled: boolean
    isInteractive: boolean
  }
  tools: {
    enabledToolNames: ReadonlySet<string>
  }
  skills: {
    commands: { name: string }[]
  }
  agents: AgentDefinition[]
  promptFeatures: {
    simpleModeEnabled: boolean
    discoverSkillsEnabled: boolean
    explorePlanAgentsEnabled: boolean
    forkSubagentEnabled: boolean
    verificationAgentEnabled: boolean
    proactiveEnabled: boolean
    mcpInstructionsDeltaEnabled: boolean
    scratchpadEnabled: boolean
    functionResultClearingEnabled: boolean
    globalCacheScopeEnabled: boolean
    numericLengthAnchorsEnabled: boolean
    tokenBudgetEnabled: boolean
    briefEnabled: boolean
    terminalFocused?: boolean
    briefProactiveSection?: string | null
    proactiveSection?: string | null
    sessionStartDate?: string
    languagePreference?: string
    outputStyle?: {
      name: string
      prompt: string
      keepCodingInstructions?: boolean
    } | null
    antModelOverride?: string | null
    scratchpadPath?: string
    functionResultClearingKeepRecent?: number
  }
  toolRuntime: {
    embeddedSearchToolsEnabled: boolean
  }
}
