export * from './types/public.js'
export * from './types/internal.js'
export * from './api/session.js'
export * from './api/task.js'
export * from './api/agent.js'
export * from './api/mcp.js'
export * from './api/rewind.js'

export function createPlannerContract() {
  return {
    mode: 'default' as const,
    allowsDelegation: false,
  }
}

export function createWorkspaceSnapshot(rootDir: string, workingDirectory: string) {
  return {
    rootDir,
    workingDirectory,
  }
}

export function createSubagentContract() {
  return {
    enabled: false,
    sidechainTranscriptEnabled: false,
  }
}

export function createSkillsContract() {
  return {
    listingEnabled: false,
    conditionalActivation: false,
  }
}

export function createMCPContract() {
  return {
    discoveryEnabled: false,
    invokeEnabled: false,
    recoveryEnabled: false,
  }
}

export function createMemoryContract() {
  return {
    recallEnabled: false,
    sessionMemoryEnabled: false,
  }
}

export function createArtifactContract() {
  return {
    binaryArtifactEnabled: false,
    outputHandoffEnabled: true,
  }
}

export function createHooksContract() {
  return {
    lifecycleHooksEnabled: false,
    stopGateEnabled: false,
  }
}

export function createEngineCore() {
  return {
    session: 'engine-core',
    version: '0.1.0',
  }
}
