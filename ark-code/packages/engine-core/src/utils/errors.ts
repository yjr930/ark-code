export class EngineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'EngineError'
  }
}

export class UnsupportedFeatureError extends EngineError {
  constructor(feature: string) {
    super(`${feature} is not implemented in the current stage`, 'unsupported_feature')
  }
}
