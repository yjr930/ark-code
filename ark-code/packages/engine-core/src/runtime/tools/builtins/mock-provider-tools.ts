import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { EngineOperation } from '../../../state/result/turn-result.js'
import type { EngineToolUseContext } from '../tool-context.js'

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function runMockProviderIntent(inputText: string, context: EngineToolUseContext): Promise<{ outputText: string; operations: EngineOperation[] }> {
  const normalized = inputText.toLowerCase()
  const workingDirectory = context.config.cwd
  const samplePath = path.join(workingDirectory, 'sample-output.txt')

  if (normalized.includes('create sample file')) {
    await writeFile(samplePath, 'created by mock provider\n', 'utf8')
    return {
      outputText: 'Created sample file.',
      operations: [{ kind: 'write-file', target: 'sample-output.txt', summary: 'write-file: wrote sample-output.txt' }],
    }
  }

  if (normalized.includes('replace sample content')) {
    await writeFile(samplePath, 'patched by mock provider\n', 'utf8')
    return {
      outputText: 'Patched sample file.',
      operations: [{ kind: 'patch-file', target: 'sample-output.txt', summary: 'patch-file: updated sample-output.txt' }],
    }
  }

  if (normalized.includes('find package')) {
    const packagePath = path.join(workingDirectory, 'package.json')
    const found = await fileExists(packagePath)
    return {
      outputText: found ? 'Found package.json.' : 'No package.json found.',
      operations: [{ kind: 'search-files', target: found ? 'package.json' : undefined, summary: found ? 'search-files: package.json' : 'search-files: no matches' }],
    }
  }

  if (normalized.startsWith('read ') || normalized.includes('read file')) {
    const targetPath = normalized.includes('sample-output') ? samplePath : path.join(workingDirectory, 'README.md')
    const exists = await fileExists(targetPath)
    const contents = exists ? await readFile(targetPath, 'utf8') : ''
    return {
      outputText: contents,
      operations: [{ kind: 'read-file', target: path.basename(targetPath), summary: exists ? `read-file: ${path.basename(targetPath)}` : 'read-file: missing file' }],
    }
  }

  return {
    outputText: `Mock provider received: ${inputText}`,
    operations: [{ kind: 'bash', summary: 'bash: no-op mock execution' }],
  }
}
