export type FileSnapshot = {
  path: string
  existed: boolean
  content: string | null
}

export type FileHistoryRecord = {
  userMessageId: string
  snapshots: FileSnapshot[]
}
