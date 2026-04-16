import type { CoreAction, ModelChunk } from '@ark-code/bridge'

export interface ReducedChunks {
  text: string
  actions: CoreAction[]
  finishReason: 'completed' | 'awaiting-input' | 'error'
  error?: string
}

export async function reduceChunks(chunks: AsyncIterable<ModelChunk>): Promise<ReducedChunks> {
  let text = ''
  const actions: CoreAction[] = []
  let finishReason: ReducedChunks['finishReason'] = 'completed'
  let error: string | undefined

  for await (const chunk of chunks) {
    if (chunk.type === 'text-delta') {
      text += chunk.text
      continue
    }
    if (chunk.type === 'action') {
      actions.push(chunk.action)
      continue
    }
    finishReason = chunk.reason
    error = chunk.error
  }

  return {
    text,
    actions,
    finishReason,
    error,
  }
}
