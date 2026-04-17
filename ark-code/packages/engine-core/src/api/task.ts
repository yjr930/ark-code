import type { EngineSession, EngineTask } from '../types/public.js'
import { getTask as getTaskImpl, listTasks as listTasksImpl } from '../runtime/tasks/registry.js'
import { readTaskOutput as readTaskOutputImpl } from '../runtime/tasks/read-task-output.js'
import { stopTask as stopTaskImpl } from '../runtime/tasks/stop-task.js'

function getMutableTaskStore(session: EngineSession): Record<string, EngineTask> {
  const state = session.getState()
  return Object.fromEntries(state.tasks.map(task => [task.id, task]))
}

export function listTasks(session: EngineSession): EngineTask[] {
  return listTasksImpl(getMutableTaskStore(session))
}

export function getTask(session: EngineSession, taskId: string): EngineTask | undefined {
  return getTaskImpl(getMutableTaskStore(session), taskId)
}

export async function readTaskOutput(session: EngineSession, taskId: string): Promise<string> {
  return readTaskOutputImpl(getMutableTaskStore(session), taskId)
}

export async function killTask(session: EngineSession, taskId: string): Promise<void> {
  await stopTaskImpl(getMutableTaskStore(session), taskId)
}
