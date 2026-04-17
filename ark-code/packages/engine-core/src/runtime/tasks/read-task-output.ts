import type { EngineTask } from '../../types/public.js'

export async function readTaskOutput(tasks: Record<string, EngineTask>, taskId: string): Promise<string> {
  const task = tasks[taskId]
  if (!task) {
    throw new Error(`No task found with ID: ${taskId}`)
  }
  return task.output
}
