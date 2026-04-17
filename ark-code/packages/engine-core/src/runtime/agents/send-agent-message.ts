import type { AgentDefinition } from '../../types/public.js'

export async function sendAgentMessage(agents: Record<string, AgentDefinition>, agentId: string, prompt: string): Promise<void> {
  const agent = agents[agentId]
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`)
  }
  agent.description = `${agent.description}\n${prompt}`
}
