import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createArtifactContract,
  createEngineCore,
  createHooksContract,
  createMCPContract,
  createMemoryContract,
  createPlannerContract,
  createSkillsContract,
  createSubagentContract,
  createWorkspaceSnapshot,
} from '../packages/engine-core/dist/index.js'

test('engine-core exports stage contracts', () => {
  assert.equal(typeof createEngineCore, 'function')
  assert.deepEqual(createPlannerContract(), {
    mode: 'default',
    allowsDelegation: false,
  })
  assert.deepEqual(createWorkspaceSnapshot('/root', '/root/work'), {
    rootDir: '/root',
    workingDirectory: '/root/work',
  })
  assert.deepEqual(createSubagentContract(), {
    enabled: false,
    sidechainTranscriptEnabled: false,
  })
  assert.deepEqual(createSkillsContract(), {
    listingEnabled: false,
    conditionalActivation: false,
  })
  assert.deepEqual(createMCPContract(), {
    discoveryEnabled: false,
    invokeEnabled: false,
    recoveryEnabled: false,
  })
  assert.deepEqual(createMemoryContract(), {
    recallEnabled: false,
    sessionMemoryEnabled: false,
  })
  assert.deepEqual(createArtifactContract(), {
    binaryArtifactEnabled: false,
    outputHandoffEnabled: true,
  })
  assert.deepEqual(createHooksContract(), {
    lifecycleHooksEnabled: false,
    stopGateEnabled: false,
  })
})
