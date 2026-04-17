import type { AgentResumeResult, AgentSpawnRequest, AgentSpawnResult, AgentDefinition, EngineSession } from '../types/public.js'
import { listAvailableAgents as listAvailableAgentsImpl } from '../runtime/agents/registry.js'
import { spawnAgent as spawnAgentImpl } from '../runtime/agents/spawn-agent.js'
import { resumeAgent as resumeAgentImpl } from '../runtime/agents/resume-agent.js'
import { sendAgentMessage as sendAgentMessageImpl } from '../runtime/agents/send-agent-message.js'

type AgentStore = Record<string, AgentDefinition>

function getAgentStore(session: EngineSession): AgentStore {
  const hostState = session.getState().hostState
  const agents = (hostState as { agents?: AgentDefinition[] }).agents ?? []
  return Object.fromEntries(agents.map(agent => [agent.id, agent]))
}

export function listAvailableAgents(session: EngineSession): AgentDefinition[] {
  return listAvailableAgentsImpl(getAgentStore(session))
}

export function spawnAgent(session: EngineSession, request: AgentSpawnRequest): Promise<AgentSpawnResult> {
  return spawnAgentImpl(getAgentStore(session), request)
}

export function resumeAgent(session: EngineSession, agentId: string): Promise<AgentResumeResult> {
  return resumeAgentImpl(getAgentStore(session), agentId)
}

export function sendAgentMessage(session: EngineSession, agentId: string, prompt: string): Promise<void> {
  return sendAgentMessageImpl(getAgentStore(session), agentId, prompt)
}
