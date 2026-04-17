import { getGitStatus } from './git-status.js'

export async function getSystemContext(workingDirectory: string): Promise<Record<string, string>> {
  const gitStatus = await getGitStatus(workingDirectory)
  return gitStatus ? { gitStatus } : {}
}
