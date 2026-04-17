import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const MAX_STATUS_CHARS = 2000

export async function getGitStatus(workingDirectory: string): Promise<string | null> {
  try {
    const [{ stdout: branch }, { stdout: mainBranch }, { stdout: status }, { stdout: log }, { stdout: userName }] = await Promise.all([
      execFileAsync('git', ['branch', '--show-current'], { cwd: workingDirectory }),
      execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: workingDirectory }),
      execFileAsync('git', ['status', '--short'], { cwd: workingDirectory }),
      execFileAsync('git', ['log', '--oneline', '-n', '5'], { cwd: workingDirectory }),
      execFileAsync('git', ['config', 'user.name'], { cwd: workingDirectory }),
    ])

    const trimmedStatus = status.trim()
    const truncatedStatus =
      trimmedStatus.length > MAX_STATUS_CHARS
        ? `${trimmedStatus.slice(0, MAX_STATUS_CHARS)}\n... (truncated because it exceeds 2k characters. If you need more information, run \"git status\")`
        : trimmedStatus

    return [
      'This is the git status at the start of the conversation. Note that this status is a snapshot in time, and will not update during the conversation.',
      `Current branch: ${branch.trim()}`,
      `Main branch (you will usually use this for PRs): ${mainBranch.trim()}`,
      userName.trim() ? `Git user: ${userName.trim()}` : null,
      `Status:\n${truncatedStatus || '(clean)'}`,
      `Recent commits:\n${log.trim()}`,
    ]
      .filter((part): part is string => Boolean(part))
      .join('\n\n')
  } catch {
    return null
  }
}
