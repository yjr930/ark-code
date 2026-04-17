export type AttributionState = {
  touchedPaths: Record<string, string>
}

export function createEmptyAttributionState(): AttributionState {
  return { touchedPaths: {} }
}
