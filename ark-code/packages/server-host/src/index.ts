import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  createSessionEngine,
  submitInput,
  type AgentDefinition,
  type EffectivePromptContext,
  type EngineEvent,
  type EngineHostState,
  type EngineSessionConfig,
  type EngineTurnResult,
  type FileSnapshotResult,
  type FileState,
  type ModelMessage,
  type ModelResult,
  type ModelStreamEvent,
  type ResumeLoadResult,
} from '../../engine-core/dist/index.js'
import { projectResult } from '../../bridge/dist/index.js'

export type WorkspaceLayout = {
  rootDir: string
  homeDir: string
  configDir: string
  sandboxDir: string
  artifactsDir: string
  debugDir: string
  stateDir: string
}

export type RunCoreSessionRequest = {
  sessionId: string
  runId: string
  userMessage: string
  workingDirectory: string
  mainLoopModel?: string
  modelProvider?: 'firstParty' | 'foundry'
  additionalWorkingDirectories?: string[]
  enabledToolNames?: string[]
  skillCommands?: { name: string }[]
  availableAgents?: AgentDefinition[]
  effectivePromptContext?: EffectivePromptContext
  promptFeatures?: {
    sessionStartDate?: string
    simpleModeEnabled?: boolean
    discoverSkillsEnabled?: boolean
    explorePlanAgentsEnabled?: boolean
    forkSubagentEnabled?: boolean
    verificationAgentEnabled?: boolean
    proactiveEnabled?: boolean
    mcpInstructionsDeltaEnabled?: boolean
    scratchpadEnabled?: boolean
    functionResultClearingEnabled?: boolean
    globalCacheScopeEnabled?: boolean
    numericLengthAnchorsEnabled?: boolean
    tokenBudgetEnabled?: boolean
    briefEnabled?: boolean
    terminalFocused?: boolean
    briefProactiveSection?: string | null
    proactiveSection?: string | null
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
  isWorktreeSession?: boolean
  isInteractive?: boolean
  providerMode: 'mock' | 'live'
  workspaceLayout: WorkspaceLayout
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
}

export async function ensureWorkspaceLayout(rootDir: string, configuredHomeDir?: string): Promise<WorkspaceLayout> {
  const homeDir = configuredHomeDir ? path.resolve(configuredHomeDir) : path.join(rootDir, '.arkcode-dev', 'home')
  const layout: WorkspaceLayout = {
    rootDir,
    homeDir,
    configDir: path.join(homeDir, 'config'),
    sandboxDir: path.join(homeDir, 'sandbox'),
    artifactsDir: path.join(homeDir, 'artifacts'),
    debugDir: path.join(homeDir, 'debug'),
    stateDir: path.join(homeDir, 'state'),
  }

  await Promise.all(Object.values(layout).map(value => ensureDir(value)))
  return layout
}

class MockModelPort {
  async *callModel(request: { messages: ModelMessage[]; systemPrompt: string; model: string; cwd: string }): AsyncGenerator<ModelStreamEvent, ModelResult> {
    const userMessage = request.messages.filter(message => message.role === 'user').at(-1)?.content ?? ''
    yield { type: 'message_start' }
    yield { type: 'content_block', text: `processing ${userMessage}` }
    yield { type: 'message_stop', stopReason: 'end_turn' }
    return {
      message: `processed ${userMessage}`,
      stopReason: 'end_turn',
      toolCalls: [{ id: `tool-${Date.now()}`, name: 'MockProviderIntentTool', input: { prompt: userMessage } }],
      inputTokens: userMessage.length,
      outputTokens: userMessage.length,
    }
  }
}

class InMemorySessionStorePort {
  private readonly transcripts = new Map<string, string>()

  async recordTranscript(request: { sessionId: string; messages: unknown[] }): Promise<void> {
    this.transcripts.set(request.sessionId, JSON.stringify(request.messages))
  }

  async flush(_request: { sessionId: string }): Promise<void> {
    return undefined
  }

  async loadConversationForResume(request: { sessionId: string }): Promise<ResumeLoadResult> {
    return {
      sessionId: request.sessionId,
      messages: [],
    }
  }
}

class LocalFileSystemPort {
  async readFileState(request: { path: string }): Promise<FileState> {
    try {
      const content = await readFile(request.path, 'utf8')
      return { path: request.path, exists: true, content }
    } catch {
      return { path: request.path, exists: false, content: null }
    }
  }

  async snapshotFileState(request: { path: string }): Promise<FileSnapshotResult> {
    return this.readFileState(request)
  }
}

class InMemoryEventSinkPort {
  readonly events: EngineEvent[] = []

  emit(event: EngineEvent): void {
    this.events.push(event)
  }
}

class InMemoryNotificationPort {
  readonly notifications: Array<{ level: 'info' | 'warning' | 'error'; message: string }> = []

  enqueue(notification: { level: 'info' | 'warning' | 'error'; message: string }): void {
    this.notifications.push(notification)
  }
}

class StaticMcpRuntimePort {
  listClients() {
    return []
  }

  listResources() {
    return {}
  }
}

class InMemoryHostStatePort {
  private state: EngineHostState = {
    toolPermissionContext: {
      mode: 'default',
      additionalWorkingDirectories: new Map(),
    },
    worktree: {
      currentSession: null,
    },
    repo: {
      repoClass: null,
    },
    fileHistory: { records: {} },
    attribution: { touchedPaths: {} },
    mcp: { clients: [] },
    ui: { replModeEnabled: false, isInteractive: true },
    tools: { enabledToolNames: new Set() },
    skills: { commands: [] },
    agents: [],
    promptFeatures: {
      sessionStartDate: undefined,
      simpleModeEnabled: false,
      discoverSkillsEnabled: false,
      explorePlanAgentsEnabled: false,
      forkSubagentEnabled: false,
      verificationAgentEnabled: false,
      proactiveEnabled: false,
      mcpInstructionsDeltaEnabled: false,
      scratchpadEnabled: false,
      functionResultClearingEnabled: false,
      globalCacheScopeEnabled: false,
      numericLengthAnchorsEnabled: false,
      tokenBudgetEnabled: false,
      briefEnabled: false,
      terminalFocused: undefined,
      briefProactiveSection: null,
      proactiveSection: null,
      languagePreference: undefined,
      outputStyle: null,
      antModelOverride: null,
      scratchpadPath: undefined,
      functionResultClearingKeepRecent: undefined,
    },
    toolRuntime: { embeddedSearchToolsEnabled: false },
  }

  getAppState(): EngineHostState {
    return this.state
  }

  setAppState(updater: (prev: EngineHostState) => EngineHostState): void {
    this.state = updater(this.state)
  }
}

function createEngineConfig(request: RunCoreSessionRequest): EngineSessionConfig {
  const eventSink = new InMemoryEventSinkPort()
  const hostStatePort = new InMemoryHostStatePort()
  hostStatePort.setAppState(prev => ({
    ...prev,
    toolPermissionContext: {
      ...prev.toolPermissionContext,
      additionalWorkingDirectories: new Map(
        (request.additionalWorkingDirectories ?? []).map(dir => [dir, { path: dir }]),
      ),
    },
    worktree: {
      currentSession: request.isWorktreeSession
        ? {
            worktreePath: request.workingDirectory,
            originalCwd: request.workspaceLayout.rootDir,
            worktreeBranch: 'unknown',
          }
        : null,
    },
    ui: {
      ...prev.ui,
      isInteractive: request.isInteractive ?? true,
    },
    tools: {
      enabledToolNames: new Set(
        request.enabledToolNames ?? [
          'TaskCreate',
          'TodoWrite',
          'Read',
          'Write',
          'Edit',
          'Glob',
          'Grep',
          'Bash',
          'AskUserQuestion',
          'Agent',
          'Skill',
        ],
      ),
    },
    skills: {
      commands: request.skillCommands ?? [],
    },
    agents: request.availableAgents ?? [],
    promptFeatures: {
      sessionStartDate: request.promptFeatures?.sessionStartDate,
      simpleModeEnabled: request.promptFeatures?.simpleModeEnabled ?? false,
      discoverSkillsEnabled:
        request.promptFeatures?.discoverSkillsEnabled ?? false,
      explorePlanAgentsEnabled:
        request.promptFeatures?.explorePlanAgentsEnabled ?? false,
      forkSubagentEnabled:
        request.promptFeatures?.forkSubagentEnabled ?? false,
      verificationAgentEnabled:
        request.promptFeatures?.verificationAgentEnabled ?? false,
      proactiveEnabled:
        request.promptFeatures?.proactiveEnabled ?? false,
      mcpInstructionsDeltaEnabled:
        request.promptFeatures?.mcpInstructionsDeltaEnabled ?? false,
      scratchpadEnabled:
        request.promptFeatures?.scratchpadEnabled ?? false,
      functionResultClearingEnabled:
        request.promptFeatures?.functionResultClearingEnabled ?? false,
      globalCacheScopeEnabled:
        request.promptFeatures?.globalCacheScopeEnabled ?? false,
      numericLengthAnchorsEnabled:
        request.promptFeatures?.numericLengthAnchorsEnabled ?? false,
      tokenBudgetEnabled:
        request.promptFeatures?.tokenBudgetEnabled ?? false,
      briefEnabled: request.promptFeatures?.briefEnabled ?? false,
      terminalFocused: request.promptFeatures?.terminalFocused,
      briefProactiveSection:
        request.promptFeatures?.briefProactiveSection ?? null,
      proactiveSection: request.promptFeatures?.proactiveSection ?? null,
      languagePreference: request.promptFeatures?.languagePreference,
      outputStyle: request.promptFeatures?.outputStyle ?? null,
      antModelOverride: request.promptFeatures?.antModelOverride ?? null,
      scratchpadPath: request.promptFeatures?.scratchpadPath,
      functionResultClearingKeepRecent:
        request.promptFeatures?.functionResultClearingKeepRecent,
    },
  }))

  return {
    sessionId: request.sessionId,
    cwd: request.workingDirectory,
    mainLoopModel:
      request.mainLoopModel ??
      (request.providerMode === 'live'
        ? 'claude-sonnet-4-5-20250929'
        : 'claude-sonnet-4-5-20250929'),
    modelProvider: request.modelProvider ?? 'firstParty',
    effectivePromptContext: request.effectivePromptContext,
    ports: {
      modelPort: new MockModelPort(),
      permissionPort: {
        async canUseTool() {
          return { behavior: 'allow' as const }
        },
        async requestPrompt() {
          return { accepted: false }
        },
        async handleElicitation() {
          return { accepted: false }
        },
      },
      sessionStorePort: new InMemorySessionStorePort(),
      fileSystemPort: new LocalFileSystemPort(),
      eventSinkPort: eventSink,
      notificationPort: new InMemoryNotificationPort(),
      mcpRuntimePort: new StaticMcpRuntimePort(),
      hostStatePort,
      clockPort: { now: () => Date.now() },
      idPort: { uuid: () => `id-${Date.now()}` },
    },
  }
}

export async function runCoreSession(request: RunCoreSessionRequest): Promise<{ result: EngineTurnResult; events: EngineEvent[] }> {
  const config = createEngineConfig(request)
  const eventSink = config.ports.eventSinkPort as InMemoryEventSinkPort
  const session = createSessionEngine(config)
  const stream = submitInput(session, request.userMessage)
  let step = await stream.next()
  while (!step.done) {
    step = await stream.next()
  }
  const bridged = projectResult(step.value)
  return {
    result: bridged.result,
    events: eventSink.events,
  }
}

export function renderCoreRun(result: EngineTurnResult): string {
  return [
    `status: ${result.status}`,
    ...result.operations.map((operation: { summary: string }) => operation.summary),
  ].join('\n')
}
