import type { AgentDefinition, AgentSpawnRequest, AgentSpawnResult } from '../../types/public.js'
import { createId } from '../../utils/ids.js'

export async function spawnAgent(agents: Record<string, AgentDefinition>, request: AgentSpawnRequest): Promise<AgentSpawnResult> {
  const agentId = request.agentId ?? createId('agent')
  agents[agentId] = {
    id: agentId,
    name: agentId,
    description: request.prompt,
    mode: 'background',
  }
  return { agentId }
}
