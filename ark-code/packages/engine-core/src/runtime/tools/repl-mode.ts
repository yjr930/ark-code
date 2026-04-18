function isEnvTruthy(value: string | undefined): boolean {
  return value === '1' || value === 'true'
}

function isEnvDefinedFalsy(value: string | undefined): boolean {
  return value !== undefined && !isEnvTruthy(value)
}

export function isReplModeEnabled(): boolean {
  if (isEnvDefinedFalsy(process.env.CLAUDE_CODE_REPL)) return false
  if (isEnvTruthy(process.env.CLAUDE_REPL_MODE)) return true
  return (
    process.env.USER_TYPE === 'ant' &&
    process.env.CLAUDE_CODE_ENTRYPOINT === 'cli'
  )
}

export const REPL_ONLY_TOOLS = new Set([
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'Bash',
  'NotebookEdit',
  'Agent',
])

export const REPL_TOOL_NAME = 'REPL'

export { isEnvDefinedFalsy, isEnvTruthy }
