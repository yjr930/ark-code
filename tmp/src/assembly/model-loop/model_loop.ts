import type { ModelPort } from '@ark-code/bridge'
import { normalizeProviderChunk } from '@ark-code/bridge'
import { reduceChunks, type ReducedChunks } from './chunk_reducer.js'
import type { NormalizedModelRequest } from '@ark-code/bridge'

async function* normalizedStream(modelPort: ModelPort, request: NormalizedModelRequest) {
  for await (const chunk of modelPort.stream(request)) {
    yield normalizeProviderChunk(chunk)
  }
}

export async function runModelLoop(modelPort: ModelPort, request: NormalizedModelRequest): Promise<ReducedChunks> {
  return reduceChunks(normalizedStream(modelPort, request))
}
