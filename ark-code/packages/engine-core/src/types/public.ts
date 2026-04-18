import type { EngineEvent as EngineEventType } from '../state/events/engine-event.js'
import type { EngineTurnResult as EngineTurnResultType } from '../state/result/turn-result.js'
import type { EngineMessage as EngineMessageType } from '../state/messages/message-model.js'
import type { DiffStats } from '../state/file-history/diff-stats.js'
import type { RewindResult as RewindResultType } from '../state/file-history/rewind.js'
import type { EngineHostState as EngineHostStateType } from '../state/app-state/host-state.js'

export type EngineEvent = EngineEventType
export type EngineTurnResult = EngineTurnResultType
export type EngineMessage = EngineMessageType
export type RewindResult = RewindResultType
export type EngineHostState = EngineHostStateType

export type EngineTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'killed'

export type EngineTask = {
  id: string
  type: string
  status: EngineTaskStatus
  description: string
  output: string
  notified: boolean
}

export type AgentDefinition = {
  id: string
  name: string
  description: string
  mode: 'foreground' | 'background'
  agentType?: string
  isBuiltIn?: boolean
  memory?: string
  systemPrompt?: string
}

export type CoordinatorContract = {
  enabled: boolean
  systemPrompt?: string
}

export type EffectivePromptFeatures = {
  coordinatorModeEnabled: boolean
  proactiveEnabled: boolean
}

export type EffectivePromptContext = {
  mainThreadAgentDefinition?: AgentDefinition
  coordinator?: CoordinatorContract
  features?: EffectivePromptFeatures
}

export type ConnectedMCPServer = {
  name: string
  type: 'connected'
  instructions?: string
}

export type DisconnectedMCPServer = {
  name: string
  type: 'disconnected'
}

export type MCPServerConnection = ConnectedMCPServer | DisconnectedMCPServer

export type ServerResource = {
  uri: string
  name: string
}

export type McpResourceResult = {
  uri: string
  contents: string
}

export type ResumeLoadResult = {
  sessionId: string
  messages: EngineMessage[]
}

export type FileState = {
  path: string
  exists: boolean
  content: string | null
}

export type FileSnapshotResult = {
  path: string
  exists: boolean
  content: string | null
}

export type PromptRequest = {
  message: string
  defaultValue?: string
}

export type PromptResponse = {
  accepted: boolean
  value?: string
}

export type ElicitRequest = {
  serverName: string
  message: string
}

export type ElicitResult = {
  accepted: boolean
  payload?: string
}

export type PermissionDecision = {
  behavior: 'allow' | 'deny' | 'ask'
  reason?: string
}

export type ModelMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
}

export type ModelToolCall = {
  id: string
  name: string
  input: Record<string, unknown>
}

export type ModelStreamEvent =
  | { type: 'message_start' }
  | { type: 'content_block'; text: string }
  | { type: 'message_stop'; stopReason: string | null }

export type ModelResult = {
  message: string
  stopReason: string | null
  toolCalls: ModelToolCall[]
  inputTokens: number
  outputTokens: number
}

export type EngineSessionState = {
  sessionId: string
  messages: EngineMessage[]
  tasks: EngineTask[]
  hostState: EngineHostState
}

export type EngineSessionSnapshot = {
  sessionId: string
  state: EngineSessionState
}

export type SubmitInputOptions = {
  isMeta?: boolean
  messageId?: string
}

export type EngineSession = {
  readonly id: string
  submitInput(input: string, options?: SubmitInputOptions): AsyncGenerator<EngineEvent, EngineTurnResult>
  abortTurn(reason?: string): Promise<void>
  destroy(): Promise<void>
  snapshot(): EngineSessionSnapshot
  getState(): EngineSessionState
}

export type EnginePorts = {
  modelPort: import('../ports/model-port.js').ModelPort
  permissionPort: import('../ports/permission-port.js').PermissionPort
  sessionStorePort: import('../ports/session-store-port.js').SessionStorePort
  fileSystemPort: import('../ports/filesystem-port.js').FileSystemPort
  eventSinkPort: import('../ports/event-sink-port.js').EventSinkPort
  notificationPort: import('../ports/notification-port.js').NotificationPort
  mcpRuntimePort: import('../ports/mcp-runtime-port.js').McpRuntimePort
  hostStatePort: import('../ports/host-state-port.js').HostStatePort
  clockPort: import('../ports/clock-port.js').ClockPort
  idPort: import('../ports/id-port.js').IdPort
}

export type EngineSessionConfig = {
  sessionId: string
  cwd: string
  mainLoopModel: string
  modelProvider?: 'firstParty' | 'foundry'
  customSystemPrompt?: string
  appendSystemPrompt?: string
  initialMessages?: EngineMessage[]
  effectivePromptContext?: EffectivePromptContext
  ports: EnginePorts
}

export type AgentSpawnRequest = {
  prompt: string
  agentId?: string
}

export type AgentSpawnResult = {
  agentId: string
  taskId?: string
}

export type AgentResumeResult = {
  agentId: string
  resumed: boolean
}

export type WorkspaceSnapshot = {
  rootDir: string
  workingDirectory: string
}

export type PlannerContract = {
  mode: 'default'
  allowsDelegation: boolean
}

export type SubagentContract = {
  enabled: boolean
  sidechainTranscriptEnabled: boolean
}

export type SkillsContract = {
  listingEnabled: boolean
  conditionalActivation: boolean
}

export type MCPContract = {
  discoveryEnabled: boolean
  invokeEnabled: boolean
  recoveryEnabled: boolean
}

export type MemoryContract = {
  recallEnabled: boolean
  sessionMemoryEnabled: boolean
}

export type ArtifactContract = {
  binaryArtifactEnabled: boolean
  outputHandoffEnabled: boolean
}

export type HooksContract = {
  lifecycleHooksEnabled: boolean
  stopGateEnabled: boolean
}

export type RewindApi = {
  rewindFiles(session: EngineSession, userMessageId: string): Promise<RewindResult>
  canRewindFiles(session: EngineSession, userMessageId: string): boolean
  getRewindDiffStats(session: EngineSession, userMessageId: string): Promise<DiffStats | null>
}

export type SessionControlApi = {
  createSessionEngine(config: EngineSessionConfig): EngineSession
  resumeSessionEngine(config: EngineSessionConfig, snapshot: EngineSessionSnapshot): EngineSession
  destroySession(session: EngineSession): Promise<void>
  forkSession(session: EngineSession): EngineSession
  snapshotSession(session: EngineSession): EngineSessionSnapshot
  restoreSession(snapshot: EngineSessionSnapshot, config: EngineSessionConfig): EngineSession
  getSessionState(session: EngineSession): EngineSessionState
  submitInput(session: EngineSession, input: string, options?: SubmitInputOptions): AsyncGenerator<EngineEvent, EngineTurnResult>
  abortTurn(session: EngineSession, reason?: string): Promise<void>
}
