import type { EngineEvent } from '../state/events/engine-event.js'
import type { EngineSession, EngineSessionConfig, EngineSessionSnapshot, EngineSessionState, SubmitInputOptions } from '../types/public.js'
import type { EngineState } from '../state/app-state/engine-state.js'
import { assembleTurnContext } from '../context/context-assembly.js'
import { runTurn } from '../query/run-turn.js'
import { snapshotSessionState } from './snapshot.js'

export class EngineSessionImpl implements EngineSession {
  readonly id: string
  readonly config: EngineSessionConfig
  private readonly state: EngineState
  private abortController: AbortController

  constructor(config: EngineSessionConfig, state: EngineState) {
    this.id = config.sessionId
    this.config = config
    this.state = state
    this.abortController = new AbortController()
  }

  async *submitInput(input: string, options?: SubmitInputOptions): AsyncGenerator<EngineEvent, import('../state/result/turn-result.js').EngineTurnResult> {
    const turnContext = await assembleTurnContext(this.config, this.state.messages)
    yield {
      type: 'system_init',
      sessionId: this.id,
      model: turnContext.model,
      toolNames: ['MockProviderIntentTool'],
    }

    const turn = runTurn(this.config, this.state, input, options?.isMeta)
    let next = await turn.next()
    while (!next.done) {
      await this.config.ports.eventSinkPort.emit(next.value)
      yield next.value
      next = await turn.next()
    }

    await this.config.ports.sessionStorePort.recordTranscript({
      sessionId: this.id,
      messages: this.state.messages,
    })
    await this.config.ports.sessionStorePort.flush({ sessionId: this.id })

    const resultEvent: EngineEvent = { type: 'result', result: next.value }
    await this.config.ports.eventSinkPort.emit(resultEvent)
    yield resultEvent
    return next.value
  }

  async abortTurn(reason?: string): Promise<void> {
    this.abortController.abort(reason)
    this.abortController = new AbortController()
  }

  async destroy(): Promise<void> {
    await this.config.ports.sessionStorePort.flush({ sessionId: this.id })
  }

  snapshot(): EngineSessionSnapshot {
    return snapshotSessionState(this)
  }

  getState(): EngineSessionState {
    return {
      sessionId: this.id,
      messages: [...this.state.messages],
      tasks: Object.values(this.state.tasks),
      hostState: this.config.ports.hostStatePort.getAppState(),
    }
  }
}
