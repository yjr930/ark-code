export function createAbortController(): AbortController {
  return new AbortController()
}

export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new Error(signal.reason ? String(signal.reason) : 'aborted')
  }
}
