function isEnvTruthy(value: string | undefined): boolean {
  return value === '1' || value === 'true'
}

export function hasEmbeddedSearchTools(): boolean {
  if (!isEnvTruthy(process.env.EMBEDDED_SEARCH_TOOLS)) return false
  const entrypoint = process.env.CLAUDE_CODE_ENTRYPOINT
  return (
    entrypoint !== 'sdk-ts' &&
    entrypoint !== 'sdk-py' &&
    entrypoint !== 'sdk-cli' &&
    entrypoint !== 'local-agent'
  )
}

export { isEnvTruthy }

export function embeddedSearchToolsBinaryPath(): string {
  return process.execPath
}

void embeddedSearchToolsBinaryPath

export {}
