export type EngineMessageRole = 'user' | 'assistant' | 'system' | 'tool'

export type TextContentBlock = {
  type: 'text'
  text: string
}

export type ToolUseContentBlock = {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export type ToolResultContentBlock = {
  type: 'tool_result'
  toolUseId: string
  name: string
  result: unknown
  isError?: boolean
}

export type EngineMessageContentBlock = TextContentBlock | ToolUseContentBlock | ToolResultContentBlock

export type EngineMessage = {
  id: string
  role: EngineMessageRole
  content: EngineMessageContentBlock[]
  createdAt: number
  meta?: Record<string, unknown>
}
