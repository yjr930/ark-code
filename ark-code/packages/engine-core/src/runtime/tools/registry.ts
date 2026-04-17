import type { EngineToolUseContext } from './tool-context.js'
import { runMockProviderIntent } from './builtins/mock-provider-tools.js'

export type EngineToolCallResult = {
  outputText: string
  operations: import('../../state/result/turn-result.js').EngineOperation[]
}

export type EngineToolDefinition = {
  name: string
  run(inputText: string, context: EngineToolUseContext): Promise<EngineToolCallResult>
}

export function getBuiltinTools(): EngineToolDefinition[] {
  return [
    {
      name: 'MockProviderIntentTool',
      run: runMockProviderIntent,
    },
  ]
}

export function findToolByName(tools: EngineToolDefinition[], name: string): EngineToolDefinition | undefined {
  return tools.find(tool => tool.name === name)
}

export function getToolSchemas(tools: EngineToolDefinition[]): string[] {
  return tools.map(tool => tool.name)
}
