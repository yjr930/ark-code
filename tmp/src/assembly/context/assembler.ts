import type { NormalizedModelRequest, PromptMessage } from '@ark-code/bridge'
import type { SessionState } from '../../core/state/session_state.js'
import type { TurnState } from '../../core/state/turn_state.js'

export function assembleContext(session: SessionState, turn: TurnState): NormalizedModelRequest {
  const messages: PromptMessage[] = [
    {
      role: 'system',
      content: [
        'You are Ark Code engine core.',
        `Working directory: ${session.workingDirectory}`,
        `Ark home directory: ${session.workspacePaths.homeDir}`,
        `Config directory: ${session.workspacePaths.configDir}`,
      ].join('\n'),
    },
    ...session.history.map((content): PromptMessage => ({ role: 'user', content })),
    { role: 'user', content: turn.input },
  ]

  return {
    sessionId: session.sessionId,
    messages,
  }
}
