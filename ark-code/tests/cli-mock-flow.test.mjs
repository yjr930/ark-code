import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

test('cli mock flow creates sample file', async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'ark-code-test-'))
  const cliPath = path.join(process.cwd(), 'apps/cli/dist/index.js')

  const { stdout } = await execFileAsync('node', [cliPath, 'create sample file'], {
    cwd: tmpRoot,
    env: {
      ...process.env,
      ARKCODE_PROVIDER_MODE: 'mock',
    },
  })

  assert.match(stdout, /status: completed/)
  assert.match(stdout, /write-file: wrote sample-output.txt/)

  const content = await readFile(path.join(tmpRoot, 'sample-output.txt'), 'utf8')
  assert.equal(content, 'created by mock provider\n')
})
