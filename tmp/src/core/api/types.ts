import type { HostPort, UserPort } from '@ark-code/bridge'
import type { ModelPort } from '@ark-code/bridge'
import type { CoreStateSnapshot } from '@ark-code/bridge'
import type { CoreAction } from '@ark-code/bridge'

export interface WorkspacePaths {
  rootDir: string
  configDir: string
  sandboxDir: string
  artifactsDir: string
  debugDir: string
  stateDir: string
  homeDir: string
}

export interface StartSessionInput {
  sessionId: string
  runId: string
  userMessage: string
  workingDirectory: string
  workspacePaths: WorkspacePaths
  modelPort: ModelPort
  userPort: UserPort
  hostPort: HostPort
}

export interface ResumeSessionInput extends Omit<StartSessionInput, 'userMessage'> {
  resumedFromRunId: string
}

export interface StepInput {
  userMessage?: string
}

export interface ActionExecutionRecord {
  action: CoreAction
  summary: string
}

export interface FinalResult {
  text: string
  actions: ActionExecutionRecord[]
}

export interface StepResult {
  state: CoreStateSnapshot
  result: FinalResult
}

export interface RunHandle {
  sessionId: string
  runId: string
  state: CoreStateSnapshot
}
