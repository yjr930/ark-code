import type { EngineTurnResult } from '../../engine-core/dist/index.js'

export type BridgeRunResult = {
  result: EngineTurnResult
}

export function projectResult(result: EngineTurnResult): BridgeRunResult {
  return { result }
}
