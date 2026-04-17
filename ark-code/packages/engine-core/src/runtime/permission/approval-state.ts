export type ApprovalState = {
  decisions: Record<string, 'allow' | 'deny' | 'ask'>
}

export function createApprovalState(): ApprovalState {
  return { decisions: {} }
}
