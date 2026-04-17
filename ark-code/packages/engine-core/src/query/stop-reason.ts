import type { EngineTurnResult } from '../state/result/turn-result.js'

export function buildSuccessResult(result: Omit<EngineTurnResult, 'status'>): EngineTurnResult {
  return { ...result, status: 'completed' }
}

export function buildFailureResult(result: Omit<EngineTurnResult, 'status'>): EngineTurnResult {
  return { ...result, status: 'failed' }
}
