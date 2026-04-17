import type { EngineSessionConfig } from '../types/public.js'
import type { TurnContext } from '../types/internal.js'
import type { EngineMessage } from '../state/messages/message-model.js'
import { getSystemContext } from './system-context.js'
import { getUserContext } from './user-context.js'
import {
  appendSystemContext,
  asSystemPrompt,
  buildDefaultSystemPrompt,
  buildEffectiveSystemPrompt,
} from './prompt-builder.js'

export async function fetchSystemPromptParts(config: EngineSessionConfig): Promise<{
  defaultSystemPrompt: import('./prompt-builder.js').SystemPrompt
  userContext: Record<string, string>
  systemContext: Record<string, string>
}> {
  const [defaultSystemPrompt, userContext, systemContext] = await Promise.all([
    config.customSystemPrompt !== undefined
      ? Promise.resolve(asSystemPrompt([]))
      : buildDefaultSystemPrompt(config),
    getUserContext(config.cwd),
    config.customSystemPrompt !== undefined
      ? Promise.resolve({})
      : getSystemContext(config.cwd),
  ])

  return {
    defaultSystemPrompt,
    userContext,
    systemContext,
  }
}

export function prependUserContext(
  messages: EngineMessage[],
  context: Record<string, string>,
  config: EngineSessionConfig,
): EngineMessage[] {
  if (Object.keys(context).length === 0) {
    return messages
  }

  const reminder: EngineMessage = {
    id: config.ports.idPort.uuid(),
    role: 'user',
    createdAt: config.ports.clockPort.now(),
    content: [
      {
        type: 'text',
        text:
          `<system-reminder>\nAs you answer the user's questions, you can use the following context:\n${Object.entries(context)
            .map(([key, value]) => `# ${key}\n${value}`)
            .join('\n')}\n\nIMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.\n</system-reminder>\n`,
      },
    ],
    meta: { isMeta: true, subtype: 'user_context_reminder' },
  }

  return [reminder, ...messages]
}

export async function assembleTurnContext(
  config: EngineSessionConfig,
  messages: EngineMessage[],
): Promise<TurnContext> {
  const { defaultSystemPrompt, userContext, systemContext } =
    await fetchSystemPromptParts(config)

  const systemPrompt = buildEffectiveSystemPrompt({
    defaultSystemPrompt,
    customSystemPrompt: config.customSystemPrompt,
    appendSystemPrompt: config.appendSystemPrompt,
  })

  const fullSystemPrompt = appendSystemContext(systemPrompt, systemContext)
  const messagesWithUserContext = prependUserContext(messages, userContext, config)

  return {
    defaultSystemPrompt,
    systemPrompt,
    fullSystemPrompt,
    userContext,
    systemContext,
    messagesWithUserContext,
    model: config.mainLoopModel,
    cwd: config.cwd,
  }
}
