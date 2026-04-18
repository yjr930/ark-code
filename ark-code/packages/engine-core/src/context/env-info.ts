import os from 'node:os'
import process from 'node:process'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export const CLAUDE_4_5_OR_4_6_MODEL_IDS = {
  opus: 'claude-opus-4-6',
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001',
} as const

export const FRONTIER_MODEL_NAME = 'Claude Opus 4.6'

function getCanonicalModelName(modelId: string): string {
  const normalized = modelId.toLowerCase().trim()

  if (normalized.includes('claude-opus-4-6')) return 'claude-opus-4-6'
  if (normalized.includes('claude-opus-4-5')) return 'claude-opus-4-5'
  if (normalized.includes('claude-opus-4-1')) return 'claude-opus-4-1'
  if (normalized.includes('claude-opus-4')) return 'claude-opus-4'
  if (normalized.includes('claude-sonnet-4-6')) return 'claude-sonnet-4-6'
  if (normalized.includes('claude-sonnet-4-5')) return 'claude-sonnet-4-5'
  if (normalized.includes('claude-sonnet-4')) return 'claude-sonnet-4'
  if (normalized.includes('claude-haiku-4-5')) return 'claude-haiku-4-5'
  if (normalized.includes('claude-3-7-sonnet')) return 'claude-3-7-sonnet'
  if (normalized.includes('claude-3-5-sonnet')) return 'claude-3-5-sonnet'
  if (normalized.includes('claude-3-5-haiku')) return 'claude-3-5-haiku'
  if (normalized.includes('claude-3-opus')) return 'claude-3-opus'
  if (normalized.includes('claude-3-sonnet')) return 'claude-3-sonnet'
  if (normalized.includes('claude-3-haiku')) return 'claude-3-haiku'

  const match = normalized.match(/(claude-(\d+-\d+-)?\w+)/)
  if (match && match[1]) {
    return match[1]
  }

  return normalized
}

export async function getIsGit(cwd: string): Promise<boolean> {
  try {
    await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd })
    return true
  } catch {
    return false
  }
}

export function getShellInfoLine(): string {
  const shell = process.env.SHELL || 'unknown'
  const shellName = shell.includes('zsh')
    ? 'zsh'
    : shell.includes('bash')
      ? 'bash'
      : shell

  if (process.platform === 'win32') {
    return 'Shell: ' + shellName + ' (use Unix shell syntax, not Windows — e.g., /dev/null not NUL, forward slashes in paths)'
  }

  return `Shell: ${shellName}`
}

export function getUnameSR(): string {
  if (process.platform === 'win32') {
    return `${os.version()} ${os.release()}`
  }

  return `${os.type()} ${os.release()}`
}

export function getKnowledgeCutoff(modelId: string): string | null {
  const canonical = getCanonicalModelName(modelId)

  if (canonical.includes('claude-sonnet-4-6')) {
    return 'August 2025'
  }
  if (canonical.includes('claude-opus-4-6')) {
    return 'May 2025'
  }
  if (canonical.includes('claude-opus-4-5')) {
    return 'May 2025'
  }
  if (canonical.includes('claude-haiku-4')) {
    return 'February 2025'
  }
  if (canonical.includes('claude-opus-4') || canonical.includes('claude-sonnet-4')) {
    return 'January 2025'
  }

  return null
}

export function getMarketingNameForModel(
  modelId: string,
  modelProvider: 'firstParty' | 'foundry' = 'firstParty',
): string | null {
  if (modelProvider === 'foundry') {
    return null
  }

  const has1m = modelId.toLowerCase().includes('[1m]')
  const canonical = getCanonicalModelName(modelId)

  if (canonical.includes('claude-opus-4-6')) {
    return has1m ? 'Opus 4.6 (with 1M context)' : 'Opus 4.6'
  }
  if (canonical.includes('claude-opus-4-5')) {
    return 'Opus 4.5'
  }
  if (canonical.includes('claude-opus-4-1')) {
    return 'Opus 4.1'
  }
  if (canonical.includes('claude-opus-4')) {
    return 'Opus 4'
  }
  if (canonical.includes('claude-sonnet-4-6')) {
    return has1m ? 'Sonnet 4.6 (with 1M context)' : 'Sonnet 4.6'
  }
  if (canonical.includes('claude-sonnet-4-5')) {
    return has1m ? 'Sonnet 4.5 (with 1M context)' : 'Sonnet 4.5'
  }
  if (canonical.includes('claude-sonnet-4')) {
    return has1m ? 'Sonnet 4 (with 1M context)' : 'Sonnet 4'
  }
  if (canonical.includes('claude-3-7-sonnet')) {
    return 'Claude 3.7 Sonnet'
  }
  if (canonical.includes('claude-3-5-sonnet')) {
    return 'Claude 3.5 Sonnet'
  }
  if (canonical.includes('claude-haiku-4-5')) {
    return 'Haiku 4.5'
  }
  if (canonical.includes('claude-3-5-haiku')) {
    return 'Claude 3.5 Haiku'
  }

  return null
}

function isEnvTruthy(value: string | boolean | undefined): boolean {
  if (!value) return false
  if (typeof value === 'boolean') return value
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase().trim())
}

export function isUndercover(
  repoClass: 'internal' | 'external' | 'none' | null | undefined,
): boolean {
  if (process.env.USER_TYPE === 'ant') {
    if (
      isEnvTruthy(process.env.CLAUDE_CODE_UNDERCOVER) ||
      isEnvTruthy(process.env.CLAUDECODE_UNDERCOVER)
    ) {
      return true
    }
    return repoClass !== 'internal'
  }

  return false
}

export function isWorktreeSession(
  currentWorktreeSession:
    | {
        worktreePath: string
        originalCwd: string
        worktreeBranch: string
      }
    | null
    | undefined,
): boolean {
  return currentWorktreeSession !== null && currentWorktreeSession !== undefined
}

export function getAdditionalWorkingDirectories(
  additionalWorkingDirectories:
    | ReadonlyMap<string, { path: string }>
    | undefined,
): string[] {
  return additionalWorkingDirectories
    ? Array.from(additionalWorkingDirectories.keys())
    : []
}

export function getLatestModelFamilyLine(): string {
  return `The most recent Claude model family is Claude 4.5/4.6. Model IDs — Opus 4.6: '${CLAUDE_4_5_OR_4_6_MODEL_IDS.opus}', Sonnet 4.6: '${CLAUDE_4_5_OR_4_6_MODEL_IDS.sonnet}', Haiku 4.5: '${CLAUDE_4_5_OR_4_6_MODEL_IDS.haiku}'. When building AI applications, default to the latest and most capable Claude models.`
}

export function getClaudeCodeAvailabilityLine(): string {
  return 'Claude Code is available as a CLI in the terminal, desktop app (Mac/Windows), web app (claude.ai/code), and IDE extensions (VS Code, JetBrains).'
}

export function getFastModeLine(): string {
  return `Fast mode for Claude Code uses the same ${FRONTIER_MODEL_NAME} model with faster output. It does NOT switch to a different model. It can be toggled with /fast.`
}

export function shouldSuppressModelDetailsForUndercover(
  repoClass: 'internal' | 'external' | 'none' | null | undefined,
): boolean {
  return isUndercover(repoClass)
}

export type EnvInfoConfig = {
  additionalWorkingDirectories?: ReadonlyMap<string, { path: string }>
  currentWorktreeSession?: {
    worktreePath: string
    originalCwd: string
    worktreeBranch: string
  } | null
}
