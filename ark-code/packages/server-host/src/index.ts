import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  createSessionEngine,
  submitInput,
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
    toolPermissionContext: { mode: 'default' },
    fileHistory: { records: {} },
    attribution: { touchedPaths: {} },
    mcp: { clients: [] },
    ui: { replModeEnabled: false },
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
  return {
    sessionId: request.sessionId,
    cwd: request.workingDirectory,
    mainLoopModel: request.providerMode === 'live' ? 'live-model' : 'mock-model',
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
      hostStatePort: new InMemoryHostStatePort(),
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
