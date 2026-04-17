import type { AgentDefinition, AgentResumeResult } from '../../types/public.js'

export async function resumeAgent(agents: Record<string, AgentDefinition>, agentId: string): Promise<AgentResumeResult> {
  return {
    agentId,
    resumed: agentId in agents,
  }
}
