import type { EngineEvent } from '../state/events/engine-event.js'

export interface EventSinkPort {
  emit(event: EngineEvent): Promise<void> | void
}
