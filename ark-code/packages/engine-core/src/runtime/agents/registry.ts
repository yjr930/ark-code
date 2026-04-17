import type { AgentDefinition } from '../../types/public.js'

export function listAvailableAgents(agents: Record<string, AgentDefinition>): AgentDefinition[] {
  return Object.values(agents)
}
