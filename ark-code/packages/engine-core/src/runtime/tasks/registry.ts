import type { EngineTask } from '../../types/public.js'

export function listTasks(tasks: Record<string, EngineTask>): EngineTask[] {
  return Object.values(tasks)
}

export function getTask(tasks: Record<string, EngineTask>, taskId: string): EngineTask | undefined {
  return tasks[taskId]
}
