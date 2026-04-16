import type { CoreEvent } from '@ark-code/bridge'
import { assembleContext } from '../../assembly/context/assembler.js'
import { runModelLoop } from '../../assembly/model-loop/model_loop.js'
import { compilePrompt } from '../../assembly/prompt/compiler.js'
import { createFinalResult } from '../../semantics/results/final_result.js'
import { executeWorkbenchAction } from '../../execution/workbench/shell/session.js'
import type {
  ResumeSessionInput,
  RunHandle,
  StartSessionInput,
  StepInput,
  StepResult,
} from './types.js'
import type { RunState } from '../state/run_state.js'
import type { SessionState } from '../state/session_state.js'
import type { TurnState } from '../state/turn_state.js'
import type { CoreStateSnapshot } from '@ark-code/bridge'

export interface EngineCore {
  startSession(input: StartSessionInput): Promise<RunHandle>
  resumeSession(input: ResumeSessionInput): Promise<RunHandle>
  step(handle: RunHandle, input?: StepInput): Promise<StepResult>
  cancel(handle: RunHandle): Promise<void>
  snapshot(handle: RunHandle): Promise<CoreStateSnapshot>
}

class EngineCoreImpl implements EngineCore {
  private readonly sessions = new Map<string, SessionState>()
  private readonly runs = new Map<string, RunState>()
  private readonly deps = new Map<string, StartSessionInput>()

  async startSession(input: StartSessionInput): Promise<RunHandle> {
    const session: SessionState = {
      sessionId: input.sessionId,
      runId: input.runId,
      workingDirectory: input.workingDirectory,
      workspacePaths: input.workspacePaths,
      history: [input.userMessage],
    }
    const run: RunState = {
      turnCount: 0,
      status: 'idle',
      outputText: '',
      actions: [],
    }

    this.sessions.set(input.sessionId, session)
    this.runs.set(input.runId, run)
    this.deps.set(input.runId, input)

    const state = this.toSnapshot(session, run)
    return {
      sessionId: input.sessionId,
      runId: input.runId,
      state,
    }
  }

  async resumeSession(input: ResumeSessionInput): Promise<RunHandle> {
    return this.startSession({
      ...input,
      userMessage: `Resume from ${input.resumedFromRunId}`,
    })
  }

  async step(handle: RunHandle, input?: StepInput): Promise<StepResult> {
    const session = this.requireSession(handle.sessionId)
    const run = this.requireRun(handle.runId)
    const deps = this.requireDeps(handle.runId)

    const turn: TurnState = {
      input: input?.userMessage ?? session.history.at(-1) ?? '',
      startedAt: new Date().toISOString(),
    }

    if (input?.userMessage) {
      session.history.push(input.userMessage)
    }

    run.turnCount += 1
    run.status = 'running'

    await this.publish(deps, {
      type: 'run.started',
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId,
      runId: handle.runId,
      payload: {
        turnCount: run.turnCount,
      },
    })

    const request = compilePrompt(assembleContext(session, turn))
    const modelOutput = await runModelLoop(deps.modelPort, request)

    run.outputText = modelOutput.text

    for (const action of modelOutput.actions) {
      await this.publish(deps, {
        type: 'action.started',
        timestamp: new Date().toISOString(),
        sessionId: session.sessionId,
        runId: handle.runId,
        payload: { action },
      })
      const summary = await executeWorkbenchAction(action, session.workingDirectory)
      run.actions.push({ action, summary })
      await this.publish(deps, {
        type: 'action.completed',
        timestamp: new Date().toISOString(),
        sessionId: session.sessionId,
        runId: handle.runId,
        payload: { action, summary },
      })
    }

    run.status = modelOutput.finishReason === 'error' ? 'failed' : 'completed'
    const state = this.toSnapshot(session, run)
    await deps.hostPort.saveCheckpoint(handle.runId, state)

    await this.publish(deps, {
      type: run.status === 'failed' ? 'run.failed' : 'run.completed',
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId,
      runId: handle.runId,
      payload: {
        text: run.outputText,
        error: modelOutput.error,
      },
    })

    return {
      state,
      result: createFinalResult({
        text: run.outputText,
        actions: run.actions,
      }),
    }
  }

  async cancel(handle: RunHandle): Promise<void> {
    const run = this.requireRun(handle.runId)
    run.status = 'failed'
  }

  async snapshot(handle: RunHandle): Promise<CoreStateSnapshot> {
    const session = this.requireSession(handle.sessionId)
    const run = this.requireRun(handle.runId)
    return this.toSnapshot(session, run)
  }

  private requireSession(sessionId: string): SessionState {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Unknown session ${sessionId}`)
    return session
  }

  private requireRun(runId: string): RunState {
    const run = this.runs.get(runId)
    if (!run) throw new Error(`Unknown run ${runId}`)
    return run
  }

  private requireDeps(runId: string): StartSessionInput {
    const deps = this.deps.get(runId)
    if (!deps) throw new Error(`Unknown run dependencies ${runId}`)
    return deps
  }

  private toSnapshot(session: SessionState, run: RunState): CoreStateSnapshot {
    return {
      sessionId: session.sessionId,
      turnCount: run.turnCount,
      status: run.status,
      workingDirectory: session.workingDirectory,
      homeDirectory: session.workspacePaths.homeDir,
    }
  }

  private async publish(input: StartSessionInput, event: CoreEvent): Promise<void> {
    await input.userPort.publish([event])
    await input.hostPort.appendEvents(event.runId, [event])
  }
}

export function createEngineCore(): EngineCore {
  return new EngineCoreImpl()
}
