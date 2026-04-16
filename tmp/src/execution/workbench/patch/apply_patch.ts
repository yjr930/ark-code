import { readWorkspaceFile } from '../files/read.js'
import { writeWorkspaceFile } from '../files/write.js'

export async function applySimplePatch(input: {
  path: string
  search: string
  replace: string
}): Promise<void> {
  const original = await readWorkspaceFile(input.path)
  const next = original.replace(input.search, input.replace)
  await writeWorkspaceFile(input.path, next)
}
