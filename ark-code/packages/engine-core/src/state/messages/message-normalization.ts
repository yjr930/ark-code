import type { EngineMessage } from './message-model.js'

export function getMessageText(message: EngineMessage): string {
  return message.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('')
}

export function cloneMessages(messages: readonly EngineMessage[]): EngineMessage[] {
  return messages.map(message => ({
    ...message,
    content: message.content.map(block => ({ ...block })),
    meta: message.meta ? { ...message.meta } : undefined,
  }))
}
