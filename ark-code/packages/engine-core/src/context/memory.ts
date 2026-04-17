import { readFile } from 'node:fs/promises'
import path from 'node:path'

export type PromptMemoryEntry = {
  path: string
  content: string
  source: 'auto' | 'user'
}

async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

function getDefaultPromptMemoryEntrypoints(): Array<{
  path: string
  source: 'auto' | 'user'
}> {
  const home = process.env.HOME
  const autoMemEntrypoint = process.env.ARKCODE_MEMORY_ENTRYPOINT
  const entries: Array<{ path: string; source: 'auto' | 'user' }> = []

  if (autoMemEntrypoint) {
    entries.push({ path: path.resolve(autoMemEntrypoint), source: 'auto' })
  }

  if (home) {
    entries.push({
      path: path.join(home, '.claude', 'MEMORY.md'),
      source: 'user',
    })
  }

  return entries
}

export async function loadMemoryFiles(): Promise<PromptMemoryEntry[]> {
  const entries = await Promise.all(
    getDefaultPromptMemoryEntrypoints().map(async entry => {
      const content = await readTextFile(entry.path)
      return content === null ? null : { ...entry, content }
    }),
  )

  return entries.filter(
    (entry): entry is NonNullable<(typeof entries)[number]> => entry !== null,
  )
}

export function filterMemoryFilesForPrompt(
  entries: PromptMemoryEntry[],
): PromptMemoryEntry[] {
  const seen = new Set<string>()
  return entries.filter(entry => {
    const resolved = path.resolve(entry.path)
    if (seen.has(resolved)) {
      return false
    }
    seen.add(resolved)
    return true
  })
}

export function renderMemoryContext(
  entries: PromptMemoryEntry[],
): string | null {
  if (entries.length === 0) {
    return null
  }

  return [
    '# Memory',
    ...entries.map(
      entry =>
        `Contents of ${entry.path} (${entry.source} memory):\n\n${entry.content}`,
    ),
  ].join('\n\n')
}

export async function loadPromptMemory(): Promise<string | null> {
  const entries = filterMemoryFilesForPrompt(await loadMemoryFiles())
  return renderMemoryContext(entries)
}
