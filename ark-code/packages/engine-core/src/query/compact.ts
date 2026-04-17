import type { EngineMessage } from '../state/messages/message-model.js'

export function getMessagesAfterCompactBoundary(messages: EngineMessage[]): EngineMessage[] {
  const index = [...messages].reverse().findIndex(message => message.role === 'system' && message.meta?.subtype === 'compact_boundary')
  if (index === -1) {
    return messages
  }
  return messages.slice(messages.length - index)
}
