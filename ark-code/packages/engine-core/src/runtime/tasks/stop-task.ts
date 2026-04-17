import type { EngineTask } from '../../types/public.js'

export async function stopTask(tasks: Record<string, EngineTask>, taskId: string): Promise<void> {
  const task = tasks[taskId]
  if (!task) {
    throw new Error(`No task found with ID: ${taskId}`)
  }
  if (task.status !== 'running') {
    throw new Error(`Task ${taskId} is not running`)
  }
  task.status = 'killed'
  task.notified = true
}
