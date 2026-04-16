import type { CoreAction } from '@ark-code/bridge'
import { execCommand } from './exec.js'
import { readWorkspaceFile } from '../files/read.js'
import { writeWorkspaceFile } from '../files/write.js'
import { applySimplePatch } from '../patch/apply_patch.js'

export async function executeWorkbenchAction(action: CoreAction, workingDirectory: string): Promise<string> {
  switch (action.kind) {
    case 'read-file': {
      const content = await readWorkspaceFile(action.path)
      return `Read ${action.path} (${content.length} chars)`
    }
    case 'write-file': {
      await writeWorkspaceFile(action.path, action.content)
      return `Wrote ${action.path}`
    }
    case 'apply-patch': {
      await applySimplePatch(action)
      return `Patched ${action.path}`
    }
    case 'exec-command': {
      const result = await execCommand(action.command, action.cwd ?? workingDirectory)
      return `Executed ${action.command} (exit=${result.exitCode})\n${result.stdout}${result.stderr}`.trim()
    }
  }
}
