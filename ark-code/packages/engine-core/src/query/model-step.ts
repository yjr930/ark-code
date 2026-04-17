import type { EngineSessionConfig, ModelMessage, ModelResult } from '../types/public.js'
import type { TurnContext } from '../types/internal.js'
import type { EngineMessage } from '../state/messages/message-model.js'

export async function runModelStep(config: EngineSessionConfig, turnContext: TurnContext, messages: EngineMessage[]): Promise<ModelResult> {
  const modelMessages: ModelMessage[] = messages.map(message => ({
    role: message.role === 'tool' ? 'tool' : message.role === 'system' ? 'system' : message.role === 'assistant' ? 'assistant' : 'user',
    content: message.content.map(block => ('text' in block ? block.text : JSON.stringify(block))).join(''),
  }))

  const stream = config.ports.modelPort.callModel({
    messages: modelMessages,
    systemPrompt: turnContext.fullSystemPrompt.join('\n\n'),
    model: turnContext.model,
    cwd: turnContext.cwd,
  })

  while (true) {
    const step = await stream.next()
    if (step.done) {
      return step.value
    }
  }
}
