import type { EngineSessionConfig } from '../types/public.js'
import type { EngineState } from '../state/app-state/engine-state.js'
import type { TurnContext } from '../types/internal.js'
import type { EngineEvent } from '../state/events/engine-event.js'
import type { EngineMessage } from '../state/messages/message-model.js'
import { createId } from '../utils/ids.js'
import { runModelStep } from './model-step.js'
import { getBuiltinTools } from '../runtime/tools/registry.js'
import { executeToolCall } from '../runtime/tools/execute-tool.js'
import { toMessageEvent, toToolResultEvent, toToolUseEvent } from '../state/events/event-projection.js'
import { buildFailureResult, buildSuccessResult } from './stop-reason.js'

export async function* queryLoop(config: EngineSessionConfig, state: EngineState, turnContext: TurnContext, userMessage: EngineMessage): AsyncGenerator<EngineEvent, import('../state/result/turn-result.js').EngineTurnResult> {
  const messagesForQuery: EngineMessage[] = [...turnContext.messagesWithUserContext]
  const modelResult = await runModelStep(config, turnContext, messagesForQuery)

  const assistantMessage: EngineMessage = {
    id: createId('assistant'),
    role: 'assistant',
    createdAt: config.ports.clockPort.now(),
    content: modelResult.message ? [{ type: 'text', text: modelResult.message }] : [],
    meta: { stopReason: modelResult.stopReason },
  }

  state.messages.push(assistantMessage)
  yield toMessageEvent(assistantMessage)

  const tools = getBuiltinTools()
  const operations: import('../state/result/turn-result.js').EngineOperation[] = []

  for (const toolCall of modelResult.toolCalls) {
    yield toToolUseEvent(toolCall.id, toolCall.name, toolCall.input)
    const toolResult = await executeToolCall(
      tools,
      toolCall.name,
      toolCall.input,
      config,
      state,
      new AbortController().signal,
      userMessage.id,
    )
    operations.push(...toolResult.operations)

    const toolMessage: EngineMessage = {
      id: createId('tool-result'),
      role: 'tool',
      createdAt: config.ports.clockPort.now(),
      content: [{ type: 'tool_result', toolUseId: toolCall.id, name: toolCall.name, result: toolResult.outputText }],
    }
    state.messages.push(toolMessage)
    yield toToolResultEvent(toolCall.id, toolCall.name, toolResult.outputText, toolResult.operations[0])
  }

  const outputText = operations.length > 0 ? operations.map(operation => operation.summary).join('\n') : modelResult.message

  if (modelResult.stopReason === 'error') {
    return buildFailureResult({
      stopReason: modelResult.stopReason,
      outputText,
      operations,
      usage: {
        inputTokens: modelResult.inputTokens,
        outputTokens: modelResult.outputTokens,
        totalCostUsd: 0,
      },
      errorMessage: modelResult.message,
    })
  }

  return buildSuccessResult({
    stopReason: modelResult.stopReason,
    outputText,
    operations,
    usage: {
      inputTokens: modelResult.inputTokens,
      outputTokens: modelResult.outputTokens,
      totalCostUsd: 0,
    },
  })
}
