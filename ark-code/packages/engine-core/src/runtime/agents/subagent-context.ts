import type { TurnContext } from '../../types/internal.js'

export function createSubagentContext(parent: TurnContext): TurnContext {
  return {
    ...parent,
    userContext: { ...parent.userContext },
    systemContext: { ...parent.systemContext },
  }
}
