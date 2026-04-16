import { spawn } from 'node:child_process'

export interface ExecResult {
  exitCode: number | null
  stdout: string
  stderr: string
}

export async function execCommand(command: string, cwd: string): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: {
        ...process.env,
      },
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })

    child.on('error', reject)
    child.on('close', (exitCode) => {
      resolve({ exitCode, stdout, stderr })
    })
  })
}
