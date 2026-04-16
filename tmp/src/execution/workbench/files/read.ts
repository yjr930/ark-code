import { readFile } from 'node:fs/promises'

export async function readWorkspaceFile(path: string): Promise<string> {
  return readFile(path, 'utf8')
}
