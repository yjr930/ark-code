import type { FileSnapshotResult, FileState } from '../types/public.js'

export type FileStateRequest = {
  path: string
}

export interface FileSystemPort {
  readFileState(request: FileStateRequest): Promise<FileState>
  snapshotFileState(request: FileStateRequest): Promise<FileSnapshotResult>
}
