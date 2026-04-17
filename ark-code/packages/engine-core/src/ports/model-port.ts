import type { ModelMessage, ModelResult, ModelStreamEvent } from '../types/public.js'

export type ModelRequest = {
  messages: ModelMessage[]
  systemPrompt: string
  model: string
  cwd: string
}

export interface ModelPort {
  callModel(request: ModelRequest): AsyncGenerator<ModelStreamEvent, ModelResult>
}
