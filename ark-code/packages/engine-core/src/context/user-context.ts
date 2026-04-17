import { loadClaudeMd, loadClaudeMdFiles } from './claude-md.js'
import { loadPromptMemory } from './memory.js'

export async function buildUserContextParts(
  workingDirectory: string,
): Promise<Record<string, string>> {
  const [claudeMd, memory] = await Promise.all([
    loadClaudeMd(workingDirectory),
    loadPromptMemory(),
  ])

  return {
    ...(claudeMd ? { claudeMd } : {}),
    ...(memory ? { memory } : {}),
    currentDate: `Today's date is ${new Date().toISOString().slice(0, 10)}.`,
  }
}

export async function collectUserVisibleMemory(
  workingDirectory: string,
): Promise<string[]> {
  const entries = await loadClaudeMdFiles(workingDirectory)
  return entries.map(entry => entry.path)
}

export async function getUserContext(
  workingDirectory: string,
): Promise<Record<string, string>> {
  return buildUserContextParts(workingDirectory)
}
