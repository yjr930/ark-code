import type { EngineSessionConfig } from '../types/public.js'
import type { EngineState } from '../state/app-state/engine-state.js'
import type { EngineEvent } from '../state/events/engine-event.js'
import { createId } from '../utils/ids.js'
import { queryLoop } from './query-loop.js'
import { assembleTurnContext } from '../context/context-assembly.js'

export async function* runTurn(config: EngineSessionConfig, state: EngineState, input: string, isMeta = false): AsyncGenerator<EngineEvent, import('../state/result/turn-result.js').EngineTurnResult> {
  const userMessage = {
    id: createId('user'),
    role: 'user' as const,
    createdAt: config.ports.clockPort.now(),
    content: [{ type: 'text' as const, text: input }],
    meta: isMeta ? { isMeta: true } : undefined,
  }

  state.messages.push(userMessage)
  yield { type: 'message', message: userMessage }

  const turnContext = await assembleTurnContext(config, state.messages)
  return yield* queryLoop(config, state, turnContext, userMessage)
}
