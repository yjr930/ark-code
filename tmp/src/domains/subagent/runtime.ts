import type { CoreEvent } from '../../semantics/events/types.js'

export interface SubagentRuntimeDescriptor {
  agentId: string
  agentType: string
  runInBackground: boolean
  parentAgentId?: string
}

export function createSubagentStartedEvent(
  descriptor: SubagentRuntimeDescriptor,
): CoreEvent {
  return {
    type: 'subagent.started',
    payload: descriptor,
  }
}
