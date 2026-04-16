import path from 'node:path'
import process from 'node:process'
import { ensureWorkspaceLayout, renderCoreRun, runCoreSession } from '@ark-code/server-host'

async function main(): Promise<void> {
  const rootDir = path.resolve(process.cwd())
  const workingDirectory = rootDir
  const configuredHomeDir = process.env.ARKCODE_HOME
  const providerMode = process.env.ARKCODE_PROVIDER_MODE === 'live' ? 'live' : 'mock'
  const userMessage = process.argv.slice(2).join(' ').trim() || 'hello from ark-code'

  const workspaceLayout = await ensureWorkspaceLayout(rootDir, configuredHomeDir)
  const runId = `run-${Date.now()}`
  const sessionId = `session-${Date.now()}`

  const { result } = await runCoreSession({
    sessionId,
    runId,
    userMessage,
    workingDirectory,
    providerMode,
    workspaceLayout,
  })

  process.stdout.write(`${renderCoreRun(result)}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
  process.exitCode = 1
})
