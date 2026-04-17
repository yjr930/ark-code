import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

type ClaudeMdEntry = {
  path: string
  content: string
  kind: 'project' | 'local' | 'rules'
}

async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

async function loadRulesDir(dirPath: string): Promise<ClaudeMdEntry[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const markdownFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => entry.name)
      .sort((left, right) => left.localeCompare(right))

    const loaded = await Promise.all(
      markdownFiles.map(async fileName => {
        const filePath = path.join(dirPath, fileName)
        const content = await readTextFile(filePath)
        return content === null
          ? null
          : ({ path: filePath, content, kind: 'rules' as const } satisfies ClaudeMdEntry)
      }),
    )

    return loaded.filter(
      (entry): entry is NonNullable<(typeof loaded)[number]> => entry !== null,
    )
      .map(entry => ({ ...entry }))
  } catch {
    return []
  }
}

function listAncestorDirectories(workingDirectory: string): string[] {
  const resolved = path.resolve(workingDirectory)
  const ancestors: string[] = []
  let current = resolved

  while (true) {
    ancestors.push(current)
    const parent = path.dirname(current)
    if (parent === current) {
      break
    }
    current = parent
  }

  return ancestors.reverse()
}

async function loadDirectoryClaudeMd(dir: string): Promise<ClaudeMdEntry[]> {
  const entries: ClaudeMdEntry[] = []

  const projectCandidates = [
    { path: path.join(dir, 'CLAUDE.md'), kind: 'project' as const },
    { path: path.join(dir, '.claude', 'CLAUDE.md'), kind: 'project' as const },
  ]

  for (const candidate of projectCandidates) {
    const content = await readTextFile(candidate.path)
    if (content !== null) {
      entries.push({ path: candidate.path, content, kind: candidate.kind })
    }
  }

  entries.push(...(await loadRulesDir(path.join(dir, '.claude', 'rules'))))

  const localPath = path.join(dir, 'CLAUDE.local.md')
  const localContent = await readTextFile(localPath)
  if (localContent !== null) {
    entries.push({ path: localPath, content: localContent, kind: 'local' })
  }

  return entries
}

export async function loadClaudeMdFiles(
  workingDirectory: string,
): Promise<ClaudeMdEntry[]> {
  const directories = listAncestorDirectories(workingDirectory)
  const loaded = await Promise.all(directories.map(loadDirectoryClaudeMd))
  return loaded.flat()
}

export function filterInjectedClaudeMdFiles(
  entries: ClaudeMdEntry[],
): ClaudeMdEntry[] {
  const seen = new Set<string>()
  return entries.filter(entry => {
    const key = path.resolve(entry.path)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

export function renderClaudeMdContext(entries: ClaudeMdEntry[]): string | null {
  if (entries.length === 0) {
    return null
  }

  return entries
    .map(entry => `Contents of ${entry.path} (${entry.kind} instructions):\n\n${entry.content}`)
    .join('\n\n')
}

export async function loadClaudeMd(workingDirectory: string): Promise<string | null> {
  const entries = filterInjectedClaudeMdFiles(
    await loadClaudeMdFiles(workingDirectory),
  )
  return renderClaudeMdContext(entries)
}
