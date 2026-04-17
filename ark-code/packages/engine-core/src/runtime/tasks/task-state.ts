import type { EngineTask } from '../../types/public.js'
import { createId } from '../../utils/ids.js'

export function createTask(type: string, description: string): EngineTask {
  return {
    id: createId(type),
    type,
    status: 'pending',
    description,
    output: '',
    notified: false,
  }
}
