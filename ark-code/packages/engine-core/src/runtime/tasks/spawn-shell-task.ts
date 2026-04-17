import type { EngineTask } from '../../types/public.js'
import { createTask } from './task-state.js'

export function spawnShellTask(tasks: Record<string, EngineTask>, description: string): EngineTask {
  const task = createTask('local_bash', description)
  task.status = 'running'
  tasks[task.id] = task
  return task
}
